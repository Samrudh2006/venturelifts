import type { FastifyInstance } from "fastify";
import logger from "../../lib/logger.js";

const startTime = Date.now();

const recentLogs: Array<{ timestamp: string; level: string; msg: string }> = [];

setInterval(() => recentLogs.splice(0, recentLogs.length), 60000);

const origInfo = logger.info.bind(logger);
logger.info = (...args: any[]) => {
  recentLogs.push({ timestamp: new Date().toISOString(), level: "info", msg: String(args[0]?.msg || args[0] || "") });
  origInfo(...args);
};

export default async function monitoringRoutes(instance: FastifyInstance) {
  instance.get("/system", { preHandler: [(instance as any).requireRole("admin")] }, async () => {
    const mem = process.memoryUsage();
    return {
      uptime: Math.floor((Date.now() - startTime) / 1000),
      version: "1.0.0",
      node: process.version,
      platform: process.platform,
      memory: { rss: Math.round(mem.rss / 1024 / 1024) + "MB", heapUsed: Math.round(mem.heapUsed / 1024 / 1024) + "MB", heapTotal: Math.round(mem.heapTotal / 1024 / 1024) + "MB" },
      cpu: process.cpuUsage(),
    };
  });

  instance.get("/logs", { preHandler: [(instance as any).requireRole("admin")] }, async () => {
    return { logs: recentLogs.slice(-100) };
  });

  instance.get("/health", async () => {
    return { status: "ok", uptime: Math.floor((Date.now() - startTime) / 1000) };
  });
}
