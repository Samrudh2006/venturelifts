import { FastifyInstance } from "fastify";
import prisma from "../lib/prisma.js";
import logger from "../lib/logger.js";

export default async function healthRoutes(fastify: FastifyInstance) {
  fastify.get("/health", async () => {
    return { status: "ok", timestamp: new Date().toISOString(), uptime: process.uptime() };
  });

  fastify.get("/ready", async (request, reply) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return { status: "ready", database: "connected", timestamp: new Date().toISOString() };
    } catch (error) {
      logger.error({ err: error }, "Health check failed - database not ready");
      reply.status(503);
      return { status: "not ready", database: "disconnected", timestamp: new Date().toISOString() };
    }
  });

  fastify.get("/live", async () => {
    return { status: "alive", timestamp: new Date().toISOString() };
  });
}
