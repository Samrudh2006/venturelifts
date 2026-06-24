import type { FastifyInstance } from "fastify";
import { z } from "zod";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
const REDIRECT_URI = process.env.OAUTH_REDIRECT_URI || "http://localhost:8000/api/v1/oauth/google/callback";

export default async function oauthRoutes(instance: FastifyInstance) {
  instance.get("/google", async (_request, reply) => {
    if (!GOOGLE_CLIENT_ID) return reply.status(501).send({ error: "OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET." });
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      response_type: "code",
      scope: "openid email profile",
      access_type: "offline",
    });
    reply.redirect(302, `https://accounts.google.com/o/oauth2/v2/auth?${params}`);
  });

  instance.get("/google/callback", async (request, reply) => {
    const { code } = request.query as { code?: string };
    if (!code) return reply.status(400).send({ error: "Missing authorization code" });

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      return reply.status(501).send({ error: "OAuth not configured" });
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
      if (!tokenData.access_token) return reply.status(400).send({ error: "Failed to exchange code for token", details: tokenData });

      const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      const profile = await userRes.json() as any;

      return {
        user: { email: profile.email, name: profile.name, avatar: profile.picture },
        message: "OAuth login successful. Integrate with your auth system.",
      };
    } catch (err: any) {
      return reply.status(500).send({ error: "OAuth callback failed", details: err.message });
    }
  });
}
