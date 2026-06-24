import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import fp from "fastify-plugin";
import { authService } from "../lib/auth.js";
import prisma from "../lib/prisma.js";

declare module "fastify" {
  interface FastifyRequest {
    user?: { id: number; name: string; email: string; role: string; expertise: string; emailVerified: boolean };
  }
}

async function authPlugin(fastify: FastifyInstance) {
  fastify.decorateRequest("user", undefined);

  fastify.decorate("authenticate", async (request: FastifyRequest, reply: FastifyReply) => {
    const token = request.cookies?.vl_session || request.headers.authorization?.replace("Bearer ", "");
    if (!token) return reply.status(401).send({ error: "Login required" });

    const payload = authService.verifyToken(token);
    if (!payload) return reply.status(401).send({ error: "Invalid or expired token" });

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) return reply.status(401).send({ error: "User not found" });

    request.user = {
      id: user.id, name: user.name, email: user.email,
      role: user.role, expertise: user.expertise, emailVerified: user.emailVerified,
    };
  });

  fastify.decorate("requireRole", (...roles: string[]) => {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      await (fastify as any).authenticate(request, reply);
      if (!request.user) return;
      if (!roles.includes(request.user.role)) {
        return reply.status(403).send({ error: "You do not have permission for this action." });
      }
    };
  });
}

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireRole: (...roles: string[]) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

export default fp(authPlugin, { name: "auth" });
