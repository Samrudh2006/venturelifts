import { FastifyInstance } from "fastify";
import prisma from "../../lib/prisma.js";

function relevanceScore(mentor: { name: string; email: string; expertise: string }, query: string): number {
  const q = query.toLowerCase();
  const name = mentor.name.toLowerCase();
  const email = mentor.email.toLowerCase();
  const expertise = mentor.expertise.toLowerCase();

  let score = 0;
  if (name.includes(q)) score += 10;
  if (email.includes(q)) score += 5;

  const queryTerms = q.split(/\s+/).filter(Boolean);
  const expertiseTerms = expertise.split(/[,\s]+/).filter(Boolean);
  const allText = `${name} ${email} ${expertise}`;

  for (const term of queryTerms) {
    if (allText.includes(term)) score += 3;
    for (const exp of expertiseTerms) {
      if (exp.includes(term) || term.includes(exp)) score += 5;
      const dist = levenshtein(term, exp);
      if (dist > 0 && dist <= 2) score += 4 - dist;
    }
  }
  return score;
}

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

export default async function mentorRoutes(fastify: FastifyInstance) {
  fastify.get("/", { preHandler: [(fastify as any).requireRole("founder", "admin")] }, async (request) => {
    const query = (request.query as any).q?.toString().toLowerCase() || "";
    const ventureId = (request.query as any).ventureId ? Number((request.query as any).ventureId) : undefined;

    let ventureSector = "";
    let ventureStage = "";
    if (ventureId) {
      const venture = await prisma.venture.findUnique({ where: { id: ventureId }, select: { sector: true, stage: true } });
      if (venture) {
        ventureSector = venture.sector.toLowerCase();
        ventureStage = venture.stage.toLowerCase();
      }
    }

    const mentors = await prisma.user.findMany({
      where: { role: "mentor" },
      select: { id: true, name: true, email: true, role: true, expertise: true, createdAt: true },
      orderBy: { name: "asc" },
    });

    const scored = mentors.map(m => {
      let score = query ? relevanceScore(m, query) : 1;
      if (ventureSector || ventureStage) {
        const exp = m.expertise.toLowerCase();
        if (ventureSector && exp.includes(ventureSector)) score += 8;
        if (ventureStage && exp.includes(ventureStage)) score += 4;
      }
      return { ...m, score };
    });

    const filtered = (query || ventureId)
      ? scored.filter(m => m.score > 0).sort((a, b) => b.score - a.score)
      : scored.sort((a, b) => b.score - a.score);

    return { mentors: filtered };
  });
}
