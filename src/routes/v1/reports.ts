import { FastifyInstance } from "fastify";
import prisma from "../../lib/prisma.js";
import logger from "../../lib/logger.js";

export default async function reportRoutes(fastify: FastifyInstance) {
  fastify.get("/export", { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { type, ventureId } = request.query as any;

    if (type === "validation" && ventureId) {
      const venture = await prisma.venture.findUnique({
        where: { id: Number(ventureId) },
        include: {
          user: { select: { name: true, email: true } },
          aiReports: { where: { reportType: "validation" }, orderBy: { createdAt: "desc" }, take: 1 },
        },
      });
      if (!venture) {
        reply.status(404);
        return { error: "Venture not found" };
      }
      const report = venture.aiReports[0]?.payload || {};
      const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Validation Report - ${venture.name}</title>
<style>
body { font-family: system-ui, -apple-system, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; color: #1a1a1a; }
h1 { font-size: 28px; border-bottom: 3px solid #f97316; padding-bottom: 8px; }
h2 { font-size: 20px; margin-top: 32px; color: #333; }
.meta { color: #666; font-size: 14px; }
.score { font-size: 48px; font-weight: 900; color: #f97316; }
.card { background: #f9f9f9; border-left: 4px solid #f97316; padding: 16px; margin: 12px 0; border-radius: 8px; }
ul { padding-left: 20px; }
li { margin: 6px 0; color: #444; }
.footer { margin-top: 48px; padding-top: 16px; border-top: 1px solid #eee; font-size: 12px; color: #999; }
</style></head>
<body>
<h1>Venture Validation Report</h1>
<p class="meta">${venture.name} | ${venture.sector} | ${venture.stage}</p>
<p class="meta">Founder: ${(venture.user as any)?.name || venture.founder} | Generated: ${new Date().toISOString().split("T")[0]}</p>
<div class="score">${report.score || "--"}/100</div>
<p>${report.summary || "No validation data available."}</p>
<h2>Strengths</h2>
<ul>${(report.strengths || []).map((s: string) => `<li>${s}</li>`).join("")}</ul>
<h2>Risks</h2>
<ul>${(report.risks || []).map((r: string) => `<li>${r}</li>`).join("")}</ul>
<h2>Recommended Experiments</h2>
<ul>${(report.experiments || []).map((e: string) => `<li>${e}</li>`).join("")}</ul>
<h2>Next 30 Days</h2>
<ul>${(report.next_30_days || []).map((d: string) => `<li>${d}</li>`).join("")}</ul>
<h2>Pitch Improvements</h2>
<ul>${(report.pitch_improvements || []).map((p: string) => `<li>${p}</li>`).join("")}</ul>
<div class="footer">VentureLift &mdash; Entrepreneurial Support Platform</div>
</body></html>`;
      reply.header("Content-Type", "text/html");
      reply.header("Content-Disposition", `attachment; filename="validation-${venture.name.toLowerCase().replace(/\s+/g, "-")}.html"`);
      return reply.send(html);
    }

    const overview = await prisma.venture.count();
    const users = await prisma.user.count();
    const reports = await prisma.aiReport.count();
    const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Platform Report</title>
<style>
body { font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; color: #1a1a1a; }
h1 { font-size: 28px; border-bottom: 3px solid #f97316; padding-bottom: 8px; }
.stat { display: inline-block; margin: 16px; padding: 24px; background: #f9f9f9; border-radius: 12px; text-align: center; }
.num { font-size: 36px; font-weight: 900; color: #f97316; }
.label { font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 1px; }
.footer { margin-top: 48px; padding-top: 16px; border-top: 1px solid #eee; font-size: 12px; color: #999; }
</style></head>
<body>
<h1>VentureLift Platform Report</h1>
<p>Generated: ${new Date().toISOString().split("T")[0]}</p>
<div class="stat"><div class="num">${overview}</div><div class="label">Ventures</div></div>
<div class="stat"><div class="num">${users}</div><div class="label">Users</div></div>
<div class="stat"><div class="num">${reports}</div><div class="label">AI Reports</div></div>
<div class="footer">VentureLift &mdash; Entrepreneurial Support Platform</div>
</body></html>`;
    reply.header("Content-Type", "text/html");
    reply.header("Content-Disposition", `attachment; filename="venturelift-platform-report.html"`);
    return reply.send(html);
  });
}
