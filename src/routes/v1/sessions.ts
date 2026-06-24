import { FastifyInstance } from "fastify";
import { authService } from "../../lib/auth.js";
import { sessionRevokeSchema } from "../../schemas/index.js";

export default async function sessionRoutes(fastify: FastifyInstance) {
  fastify.get("/", { preHandler: [fastify.authenticate] }, async (request) => {
    const sessions = await authService.getUserSessions(request.user!.id);
    return { sessions };
  });

  fastify.post("/revoke", { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const data = sessionRevokeSchema.parse(request.body);
    try {
      await authService.revokeSession(data.sessionId, request.user!.id);
      return { message: "Session revoked" };
    } catch (error: any) {
      reply.status(error.message === "Unauthorized" ? 403 : 404);
      return { error: error.message };
    }
  });
}
