import type { FastifyInstance } from "fastify";
import { authService } from "../../lib/auth.js";
import prisma from "../../lib/prisma.js";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
const APP_URL = process.env.APP_URL || process.env.FRONTEND_URL || "http://localhost:5173";
const REDIRECT_URI = process.env.OAUTH_REDIRECT_URI || "http://localhost:8000/api/v1/oauth/google/callback";

function authCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    secure: process.env.NODE_ENV === "production",
  };
}

export default async function oauthRoutes(instance: FastifyInstance) {
  instance.get("/google", async (_request, reply) => {
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      return reply.redirect(302, `${APP_URL}/login?oauth=not-configured`);
    }
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      response_type: "code",
      scope: "openid email profile",
      access_type: "offline",
      prompt: "select_account",
    });
    reply.redirect(302, `https://accounts.google.com/o/oauth2/v2/auth?${params}`);
  });

  instance.get("/google/callback", async (request, reply) => {
    const { code } = request.query as { code?: string };
    if (!code) return reply.redirect(302, `${APP_URL}/login?oauth=missing-code`);

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      return reply.redirect(302, `${APP_URL}/login?oauth=not-configured`);
    }

    try {
      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          redirect_uri: REDIRECT_URI,
          grant_type: "authorization_code",
        }),
      });
      const tokenData = await tokenRes.json() as any;
      if (!tokenData.access_token) return reply.redirect(302, `${APP_URL}/login?oauth=token-failed`);

      const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      const profile = await userRes.json() as any;
      if (!profile.email) return reply.redirect(302, `${APP_URL}/login?oauth=email-missing`);

      const email = String(profile.email).toLowerCase().trim();
      let user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        user = await prisma.user.create({
          data: {
            name: profile.name || email.split("@")[0],
            email,
            passwordHash: authService.hashPassword(authService.generateToken(24)),
            role: "founder",
            expertise: "",
            emailVerified: true,
            emailVerifiedAt: new Date(),
          },
        });
      } else if (!user.emailVerified) {
        user = await prisma.user.update({ where: { id: user.id }, data: { emailVerified: true, emailVerifiedAt: new Date() } });
      }

      const tokens = authService.generateTokens(user.id);
      await authService.createSession(user.id, request.headers["user-agent"], request.ip);
      reply.setCookie("vl_session", tokens.accessToken, authCookieOptions());
      return reply.redirect(302, `${APP_URL}/dashboard?oauth=success`);
    } catch (err: any) {
      request.log.error({ err }, "Google OAuth callback failed");
      return reply.redirect(302, `${APP_URL}/login?oauth=failed`);
    }
  });
}
