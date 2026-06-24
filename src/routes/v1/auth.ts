import { FastifyInstance } from "fastify";
import { authService } from "../../lib/auth.js";
import prisma from "../../lib/prisma.js";
import {
  registerSchema, loginSchema, emailVerificationSchema,
  passwordResetRequestSchema, passwordResetSchema, refreshTokenSchema,
} from "../../schemas/index.js";
import logger from "../../lib/logger.js";

function publicUser(user: any) {
  return { id: user.id, name: user.name, email: user.email, role: user.role, expertise: user.expertise, created_at: user.created_at, emailVerified: user.emailVerified };
}

export default async function authRoutes(fastify: FastifyInstance) {
  fastify.post("/register", async (request, reply) => {
    const data = registerSchema.parse(request.body);
    try {
      const user = await authService.createUser(data);
      reply.status(201);
      return { user: publicUser(user) };
    } catch (error: any) {
      reply.status(409);
      return { error: error.message || "Registration failed" };
    }
  });

  fastify.post("/login", async (request, reply) => {
    const data = loginSchema.parse(request.body);
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user || !authService.verifyPassword(data.password, user.passwordHash)) {
      reply.status(401);
      return { error: "Invalid email or password" };
    }
    if (!user.emailVerified) {
      reply.status(403);
      return { error: "Please verify your email first" };
    }
    const tokens = authService.generateTokens(user.id);
    const session = await authService.createSession(user.id, request.headers["user-agent"], request.ip);
    reply.setCookie("vl_session", tokens.accessToken, {
      httpOnly: true, sameSite: "lax", path: "/",
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      secure: process.env.NODE_ENV === "production",
    });
    return { user: publicUser(user), accessToken: tokens.accessToken, refreshToken: session.refreshToken };
  });

  fastify.post("/logout", async (request, reply) => {
    const body = request.body as any;
    if (body?.refreshToken) {
      await prisma.session.updateMany({ where: { refreshToken: body.refreshToken }, data: { revokedAt: new Date() } });
    }
    reply.clearCookie("vl_session", { path: "/" });
    return { ok: true };
  });

  fastify.post("/refresh", async (request, reply) => {
    const data = refreshTokenSchema.parse(request.body);
    try {
      const result = await authService.refreshAccessToken(data.refreshToken);
      reply.setCookie("vl_session", result.accessToken, {
        httpOnly: true, sameSite: "lax", path: "/",
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        secure: process.env.NODE_ENV === "production",
      });
      return { accessToken: result.accessToken, user: publicUser(result.user) };
    } catch (error: any) {
      reply.status(401);
      return { error: error.message };
    }
  });

  fastify.post("/email/verify", async (request, reply) => {
    const data = emailVerificationSchema.parse(request.body);
    try {
      await authService.verifyEmail(data.token);
      return { message: "Email verified successfully" };
    } catch (error: any) {
      reply.status(400);
      return { error: error.message };
    }
  });

  fastify.post("/password/reset/request", async (request, reply) => {
    const data = passwordResetRequestSchema.parse(request.body);
    return authService.requestPasswordReset(data.email);
  });

  fastify.post("/password/reset", async (request, reply) => {
    const data = passwordResetSchema.parse(request.body);
    try {
      await authService.resetPassword(data.token, data.newPassword);
      return { message: "Password reset successfully" };
    } catch (error: any) {
      reply.status(400);
      return { error: error.message };
    }
  });

  fastify.get("/me", { preHandler: [fastify.authenticate] }, async (request) => {
    return { user: request.user ? publicUser(request.user) : null };
  });
}
