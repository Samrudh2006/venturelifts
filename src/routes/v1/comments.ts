import { FastifyInstance } from "fastify";
import prisma from "../../lib/prisma.js";
import { z } from "zod";

const createCommentSchema = z.object({
  ventureId: z.number().int().positive(),
  content: z.string().min(1).max(2000),
  parentId: z.number().int().positive().optional(),
});

const updateCommentSchema = z.object({
  content: z.string().min(1).max(2000),
});

export default async function commentRoutes(fastify: FastifyInstance) {
  fastify.get("/:ventureId", { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { ventureId } = request.params as any;
    const id = Number(ventureId);
    if (!Number.isFinite(id)) {
      reply.status(400);
      return { error: "Invalid venture ID" };
    }
    const comments = await prisma.comment.findMany({
      where: { ventureId: id, parentId: null },
      include: {
        user: { select: { id: true, name: true, role: true } },
        replies: {
          include: { user: { select: { id: true, name: true, role: true } } },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return { comments };
  });

  fastify.post("/", { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const data = createCommentSchema.parse(request.body);
    const venture = await prisma.venture.findUnique({ where: { id: data.ventureId } });
    if (!venture) {
      reply.status(404);
      return { error: "Venture not found" };
    }
    if (data.parentId) {
      const parent = await prisma.comment.findUnique({ where: { id: data.parentId } });
      if (!parent || parent.ventureId !== data.ventureId) {
        reply.status(404);
        return { error: "Parent comment not found" };
      }
    }
    const comment = await prisma.comment.create({
      data: { ventureId: data.ventureId, userId: request.user!.id, content: data.content, parentId: data.parentId },
      include: { user: { select: { id: true, name: true, role: true } } },
    });
    reply.status(201);
    return { comment };
  });

  fastify.put("/:id", { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as any;
    const data = updateCommentSchema.parse(request.body);
    const comment = await prisma.comment.findUnique({ where: { id: Number(id) } });
    if (!comment) {
      reply.status(404);
      return { error: "Comment not found" };
    }
    if (comment.userId !== request.user!.id) {
      reply.status(403);
      return { error: "Not authorized to edit this comment" };
    }
    const updated = await prisma.comment.update({
      where: { id: comment.id },
      data: { content: data.content },
      include: { user: { select: { id: true, name: true, role: true } } },
    });
    return { comment: updated };
  });

  fastify.delete("/:id", { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as any;
    const comment = await prisma.comment.findUnique({ where: { id: Number(id) } });
    if (!comment) {
      reply.status(404);
      return { error: "Comment not found" };
    }
    if (comment.userId !== request.user!.id && request.user!.role !== "admin") {
      reply.status(403);
      return { error: "Not authorized to delete this comment" };
    }
    await prisma.comment.deleteMany({ where: { OR: [{ id: comment.id }, { parentId: comment.id }] } });
    return { message: "Comment deleted" };
  });
}
