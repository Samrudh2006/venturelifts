import { FastifyInstance } from "fastify";
import { authService } from "../../lib/auth.js";
import logger from "../../lib/logger.js";
import { twoFactorSetupSchema, twoFactorEnableSchema, twoFactorVerifySchema } from "../../schemas/index.js";

export default async function twoFactorRoutes(fastify: FastifyInstance) {
  fastify.post("/setup", { preHandler: [(fastify as any).requireRole("admin")] }, async (request, reply) => {
    try {
      const result = await authService.setupTwoFactorAuth(request.user!.id);
      logger.info({ userId: request.user!.id }, "2FA setup initiated");
      return {
        secret: result.secret,
        backupCodes: result.backupCodes,
        message: "Scan the secret with your authenticator app, then verify with /2fa/verify",
      };
    } catch (error: any) {
      reply.status(400);
      return { error: error.message };
    }
  });

  fastify.post("/verify", { preHandler: [(fastify as any).requireRole("admin")] }, async (request, reply) => {
    const data = twoFactorVerifySchema.parse(request.body);
    const isValid = await authService.verifyTwoFactorToken(request.user!.id, data.token);
    if (!isValid) {
      reply.status(400);
      return { error: "Invalid verification code" };
    }
    return { message: "Verification code is valid, you can now enable 2FA" };
  });

  fastify.post("/enable", { preHandler: [(fastify as any).requireRole("admin")] }, async (request, reply) => {
    const data = twoFactorEnableSchema.parse(request.body);
    try {
      const result = await authService.enableTwoFactorAuth(request.user!.id, data.token);
      logger.info({ userId: request.user!.id }, "2FA enabled");
      return result;
    } catch (error: any) {
      reply.status(400);
      return { error: error.message };
    }
  });

  fastify.get("/status", { preHandler: [fastify.authenticate] }, async (request) => {
    const prisma = (await import("../../lib/prisma.js")).default;
    const user = await prisma.user.findUnique({
      where: { id: request.user!.id },
      select: { twoFactorEnabled: true },
    });
    return { twoFactorEnabled: user?.twoFactorEnabled || false };
  });
}
