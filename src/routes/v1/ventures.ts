import { FastifyInstance } from "fastify";
import prisma from "../../lib/prisma.js";
import logger from "../../lib/logger.js";

export default async function ventureRoutes(fastify: FastifyInstance) {
  fastify.get("/", { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const user = request.user!;
    const query = (request.query as any).q?.toString().toLowerCase() || "";
    const like = `%${query}%`;

    let ventures;
    if (user.role === "founder") {
      ventures = await prisma.venture.findMany({
        where: {
          userId: user.id,
          ...(query ? {
            OR: [
              { name: { contains: query } },
              { founder: { contains: query } },
              { sector: { contains: query } },
              { stage: { contains: query } },
              { problem: { contains: query } },
              { solution: { contains: query } },
              { customer: { contains: query } },
            ],
          } : {}),
        },
        include: { user: { select: { name: true, email: true } } },
        orderBy: { id: "desc" },
      });
    } else {
      ventures = await prisma.venture.findMany({
        where: query ? {
          OR: [
            { name: { contains: query } },
            { founder: { contains: query } },
            { sector: { contains: query } },
            { stage: { contains: query } },
            { problem: { contains: query } },
            { solution: { contains: query } },
            { customer: { contains: query } },
            { user: { name: { contains: query } } },
          ],
        } : {},
        include: { user: { select: { name: true, email: true } } },
        orderBy: { id: "desc" },
      });
    }

    return {
      ventures: ventures.map(v => ({
        ...v,
        owner_name: (v.user as any)?.name,
        owner_email: (v.user as any)?.email,
      })),
    };
  });

  fastify.post("/", { preHandler: [(fastify as any).requireRole("founder", "admin")] }, async (request, reply) => {
    const user = request.user!;
    const payload = request.body as any;
    const required = ["name", "founder", "sector", "stage", "problem", "solution", "customer", "traction", "goals"];
    const missing = required.filter(f => !String(payload[f] || "").trim());
    if (missing.length) {
      reply.status(400);
      return { error: `Missing fields: ${missing.join(", ")}` };
    }

    const name = String(payload.name).trim();
    const problem = String(payload.problem).trim();

    const similar = await prisma.venture.findFirst({
      where: {
        OR: [
          { name: { contains: name } },
          { problem: { contains: problem.substring(0, 100) } },
        ],
      },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    if (similar && similar.userId !== user.id) {
      reply.status(409);
      return {
        error: "A similar venture already exists.",
        similarVenture: {
          id: similar.id,
          name: similar.name,
          founder: similar.founder,
          owner_name: (similar.user as any)?.name,
          owner_email: (similar.user as any)?.email,
        },
      };
    }

    const venture = await prisma.venture.create({
      data: {
        userId: user.id,
        name,
        founder: String(payload.founder).trim(),
        sector: String(payload.sector).trim(),
        stage: String(payload.stage).trim(),
        problem,
        solution: String(payload.solution).trim(),
        customer: String(payload.customer).trim(),
        traction: String(payload.traction).trim(),
        goals: String(payload.goals).trim(),
      },
    });
    reply.status(201);
    return { venture };
  });

  fastify.delete("/:id", { preHandler: [(fastify as any).requireRole("admin")] }, async (request, reply) => {
    const { id } = request.params as any;
    const venture = await prisma.venture.findUnique({ where: { id: Number(id) } });
    if (!venture) {
      reply.status(404);
      return { error: "Venture not found" };
    }
    await prisma.venture.delete({ where: { id: venture.id } });
    return { message: "Venture deleted" };
  });

  fastify.get("/all", { preHandler: [(fastify as any).requireRole("admin")] }, async () => {
    const ventures = await prisma.venture.findMany({
      include: { user: { select: { id: true, name: true, email: true } }, aiReports: { select: { id: true } } },
      orderBy: { id: "desc" },
    });
    return {
      ventures: ventures.map(v => ({
        ...v,
        owner_name: (v.user as any)?.name,
        owner_email: (v.user as any)?.email,
        report_count: v.aiReports.length,
      })),
    };
  });

  fastify.put("/:id", { preHandler: [(fastify as any).requireRole("founder", "admin")] }, async (request, reply) => {
    const { id } = request.params as any;
    const venture = await prisma.venture.findUnique({ where: { id: Number(id) } });
    if (!venture) {
      reply.status(404);
      return { error: "Venture not found" };
    }
    const user = request.user!;
    if (user.role !== "admin" && venture.userId !== user.id) {
      reply.status(403);
      return { error: "Not authorized to edit this venture" };
    }
    const payload = request.body as any;
    const updatable: any = {};
    for (const field of ["name", "founder", "sector", "stage", "problem", "solution", "customer", "traction", "goals"]) {
      if (payload[field] !== undefined) updatable[field] = String(payload[field]).trim();
    }
    const updated = await prisma.venture.update({ where: { id: venture.id }, data: updatable });
    return { venture: updated };
  });
}
