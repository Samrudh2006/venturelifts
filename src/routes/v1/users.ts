import { FastifyInstance } from "fastify";
import prisma from "../../lib/prisma.js";

export default async function userRoutes(fastify: FastifyInstance) {
  fastify.get("/", { preHandler: [(fastify as any).requireRole("admin")] }, async () => {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, expertise: true, createdAt: true, emailVerified: true, twoFactorEnabled: true, _count: { select: { ventures: true, sessions: true } } },
      orderBy: [{ role: "asc" }, { name: "asc" }],
    });
    return { users };
  });

  fastify.delete("/:id", { preHandler: [(fastify as any).requireRole("admin")] }, async (request, reply) => {
    const { id } = request.params as any;
    const user = await prisma.user.findUnique({ where: { id: Number(id) } });
    if (!user) {
      reply.status(404);
      return { error: "User not found" };
    }
    if (user.role === "admin") {
      const adminCount = await prisma.user.count({ where: { role: "admin" } });
      if (adminCount <= 1) {
        reply.status(400);
        return { error: "Cannot delete the last admin account" };
      }
    }
    await prisma.user.delete({ where: { id: user.id } });
    return { message: "User deleted" };
  });

  fastify.put("/:id/role", { preHandler: [(fastify as any).requireRole("admin")] }, async (request, reply) => {
    const { id } = request.params as any;
    const { role } = request.body as any;
    if (!["founder", "mentor", "admin"].includes(role)) {
      reply.status(400);
      return { error: "Invalid role" };
    }
    const user = await prisma.user.findUnique({ where: { id: Number(id) } });
    if (!user) {
      reply.status(404);
      return { error: "User not found" };
    }
    const updated = await prisma.user.update({ where: { id: user.id }, data: { role } });
    return { user: { id: updated.id, name: updated.name, email: updated.email, role: updated.role } };
  });

  fastify.get("/analytics", { preHandler: [(fastify as any).requireRole("admin")] }, async () => {
    const totalUsers = await prisma.user.count();
    const totalVentures = await prisma.venture.count();
    const totalReports = await prisma.aiReport.count();
    const totalComments = await prisma.comment.count();
    const roleCounts = await prisma.user.groupBy({ by: ["role"], _count: true });
    const stageCounts = await prisma.venture.groupBy({ by: ["stage"], _count: true });
    const sectorCounts = await prisma.venture.groupBy({ by: ["sector"], _count: true, orderBy: { _count: { sector: "desc" } }, take: 10 });
    return {
      totalUsers, totalVentures, totalReports, totalComments,
      roleCounts: roleCounts.map(r => ({ role: r.role, count: r._count })),
      stageCounts: stageCounts.map(s => ({ stage: s.stage, count: s._count })),
      sectorCounts: sectorCounts.map(s => ({ sector: s.sector, count: s._count })),
    };
  });
}
