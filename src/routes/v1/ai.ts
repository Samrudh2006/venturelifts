import { FastifyInstance } from "fastify";
import prisma from "../../lib/prisma.js";
import logger from "../../lib/logger.js";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { nlpSchema, faqSchema, suggestionSchema, roadmapSchema, validateSchema, cnnPredictSchema } from "../../schemas/index.js";

const ROOT = resolve(fileURLToPath(new URL("../../..", import.meta.url)));
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.env.ADVANCED_AI_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const AI_PROVIDER: string | null = OPENAI_API_KEY ? "openai" : GROQ_API_KEY ? "groq" : null;
const AI_MODEL = process.env.AI_MODEL || (AI_PROVIDER === "groq" ? "llama3-8b-8192" : "gpt-5.4-mini");

function nowIso() { return new Date().toISOString(); }

function listItems(items: string[]) {
  if (!Array.isArray(items)) return "";
  return items.map(item => `- ${item}`).join("\n");
}

async function saveReport(ventureId: number | null, reportType: string, payload: any) {
  await prisma.aiReport.create({
    data: { ventureId, reportType: reportType as any, payload, createdAt: new Date() },
  });
}

function parseJsonCandidate(text: string) {
  const trimmed = String(text || "").trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  return JSON.parse(start !== -1 && end !== -1 ? trimmed.slice(start, end + 1) : trimmed);
}

function extractAiJson(data: any) {
  if (!data) throw new Error("No AI response data");
  const message = data.choices?.[0]?.message;
  if (message) {
    if (typeof message.content === "string") return parseJsonCandidate(message.content);
    if (typeof message.content === "object" && message.content !== null) return message.content;
  }
  const text = data.choices?.[0]?.text || data.output?.[0]?.content?.[0]?.text;
  if (typeof text === "string") return parseJsonCandidate(text);
  throw new Error("Unable to parse AI JSON response");
}

async function callAiJson(prompt: string, schema?: any) {
  if (!AI_PROVIDER) return null;
  const apiKey = OPENAI_API_KEY || GROQ_API_KEY;
  const body: any = { model: AI_MODEL, messages: [{ role: "user", content: prompt }] };
  if (schema) {
    body.response_format = { type: "json_schema", json_schema: { name: "response", strict: true, schema } };
  }
  const baseUrl = AI_PROVIDER === "groq" ? "https://api.groq.com" : "https://api.openai.com";
  const response = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`${AI_PROVIDER} API returned ${response.status}`);
  return extractAiJson(await response.json());
}

function localValidation(venture: any) {
  const problemWords = String(venture.problem || "").split(/\s+/).filter(Boolean).length;
  const solutionWords = String(venture.solution || "").split(/\s+/).filter(Boolean).length;
  const traction = String(venture.traction || "").trim().toLowerCase();
  let score = 52;
  score += Math.floor(Math.min(problemWords, 40) / 3);
  score += Math.floor(Math.min(solutionWords, 45) / 4);
  score += traction && !["none", "no"].includes(traction) ? 12 : 0;
  score = Math.max(35, Math.min(score, 91));
  return {
    score, summary: "Idea validation is based on the submitted venture details.",
    strengths: ["The venture has a named customer and problem area.", "The solution can be shaped into a testable early product.", "The founder has enough context to define first experiments."],
    risks: ["Customer pain intensity needs stronger evidence.", "The value proposition may need a narrower first user segment.", "Business model and acquisition channels need validation."],
    experiments: ["Interview 12 target users and score urgency of the problem.", "Create a landing page with one offer and measure signup intent.", "Run a concierge prototype before building the full product."],
    customer_segments: [venture.customer || "Early adopters with urgent workflow pain", "Incubators and entrepreneurship cells", "Small teams seeking structured venture support"],
    pitch_improvements: ["Quantify the problem with a clear cost, time, or revenue metric.", "Describe the first wedge market before expanding the platform vision.", "Add proof from interviews, pilots, waitlists, or usage data."],
    next_30_days: ["Finish 12 discovery interviews.", "Build a clickable MVP flow.", "Collect 3 mentor reviews and revise the pitch."],
  };
}

function localNlp(text: string) {
  const frequency: Record<string, number> = {};
  for (const word of text.split(/\s+/)) {
    const cleaned = word.replace(/[.,;:!?()\[\]{}]/g, "").toLowerCase();
    if (cleaned.length > 4) frequency[cleaned] = (frequency[cleaned] || 0) + 1;
  }
  const keywords = Object.keys(frequency).sort((a, b) => frequency[b] - frequency[a]).slice(0, 8);
  const clarityScore = Math.max(45, Math.min(88, 95 - Math.abs(55 - text.split(/\s+/).filter(Boolean).length)));
  return {
    keywords: keywords.length ? keywords : ["startup", "customer", "innovation"],
    sentiment: "constructive and opportunity-focused",
    clarity_score: clarityScore,
    market_signals: ["The description points toward entrepreneurship enablement.", "There is room to define the highest-value first customer."],
    missing_information: ["Revenue model", "Primary acquisition channel", "Evidence from users"],
    improved_statement: "We help early-stage founders validate ideas, connect with mentors, and move from concept to investor-ready venture through data-backed workflows and AI guidance.",
  };
}

function localFaq(question: string) {
  const lower = question.toLowerCase();
  let answer = "VentureLift helps founders create venture profiles, validate ideas, search mentors, analyze pitch text, and track startup readiness.";
  if (lower.includes("mentor")) answer = "Founders can open Search to find mentors by expertise such as AI, fundraising, healthtech, product, fintech, edtech, or climate.";
  else if (lower.includes("score") || lower.includes("validation")) answer = "The validation score estimates idea readiness from problem clarity, customer definition, solution detail, traction, and next goals.";
  else if (lower.includes("admin")) answer = "Admin users can view platform users, review roles, and see venture activity across the platform.";
  else if (lower.includes("roadmap")) answer = "The roadmap generator unlocks after a venture receives a validation score above 75, then creates a 90-day execution plan.";
  return { answer, next_steps: ["Create or select a venture profile.", "Run AI idea validation.", "Use Search to find mentors or review ventures."], related_topics: ["idea validation", "mentor matching", "roadmap", "funding readiness"] };
}

function localSuggestion(message: string, venture: any) {
  return {
    reply: `For ${venture?.name || "this venture"}, focus the next decision on evidence, not features.`,
    action_items: ["Write the top 3 assumptions that must be true for the venture to work.", "Interview 8 to 12 target customers and ask about current behavior, not opinions.", "Define one measurable success signal for the next two weeks."],
    risks_to_watch: ["Building too broadly before a narrow early user is proven.", "Counting interest as traction without a commitment signal.", "Ignoring acquisition cost and repeat usage."],
    mentor_angle: "Ask a mentor to review your customer segment, validation experiment, and pricing hypothesis.",
  };
}

function localRoadmap(venture: any, score: number) {
  return {
    summary: `${venture?.name || "The venture"} is ready for a focused 90-day roadmap (score: ${score}).`,
    weeks: [
      { period: "Weeks 1-2", focus: "Customer proof", tasks: ["Interview 12 target customers in the highest urgency segment.", "Document pain intensity, current alternatives, and willingness to pay.", "Rewrite the value proposition using customer language."] },
      { period: "Weeks 3-6", focus: "MVP and pilot", tasks: ["Build or refine the smallest workflow that proves the core promise.", "Recruit 5 pilot users and define usage checkpoints.", "Track activation, repeated use, and conversion intent."] },
      { period: "Weeks 7-10", focus: "Go-to-market", tasks: ["Test two acquisition channels with clear cost and conversion tracking.", "Create a landing page, demo script, and customer proof deck.", "Collect testimonials, case notes, or usage metrics."] },
      { period: "Weeks 11-12", focus: "Investor readiness", tasks: ["Prepare a 10-slide pitch deck with problem, traction, market, model, and ask.", "Review metrics with mentors and identify the next funding path.", "Set the next 90-day target based on pilot outcomes."] },
    ],
    milestones: ["12 customer interviews completed", "5 active pilot users", "Clear acquisition channel tested", "Pitch deck and mentor review completed"],
    metrics: ["activation rate", "weekly active users", "pilot conversion", "customer acquisition cost", "retention signal"],
    funding_readiness: ["Show customer proof before asking for capital.", "Include pilot metrics and a precise use of funds.", "Prepare grant, incubator, or angel outreach depending on traction."],
  };
}

function validationSchemaDef() {
  return { type: "object", properties: { score: { type: "integer" }, summary: { type: "string" }, strengths: { type: "array", items: { type: "string" } }, risks: { type: "array", items: { type: "string" } }, experiments: { type: "array", items: { type: "string" } }, customer_segments: { type: "array", items: { type: "string" } }, pitch_improvements: { type: "array", items: { type: "string" } }, next_30_days: { type: "array", items: { type: "string" } } }, required: ["score", "summary", "strengths", "risks", "experiments", "customer_segments", "pitch_improvements", "next_30_days"] };
}
function nlpSchemaDef() {
  return { type: "object", properties: { keywords: { type: "array", items: { type: "string" } }, sentiment: { type: "string" }, clarity_score: { type: "integer" }, market_signals: { type: "array", items: { type: "string" } }, missing_information: { type: "array", items: { type: "string" } }, improved_statement: { type: "string" } }, required: ["keywords", "sentiment", "clarity_score", "market_signals", "missing_information", "improved_statement"] };
}
function faqSchemaDef() {
  return { type: "object", properties: { answer: { type: "string" }, next_steps: { type: "array", items: { type: "string" } }, related_topics: { type: "array", items: { type: "string" } } }, required: ["answer", "next_steps", "related_topics"] };
}
function suggestionSchemaDef() {
  return { type: "object", properties: { reply: { type: "string" }, action_items: { type: "array", items: { type: "string" } }, risks_to_watch: { type: "array", items: { type: "string" } }, mentor_angle: { type: "string" } }, required: ["reply", "action_items", "risks_to_watch", "mentor_angle"] };
}
function roadmapSchemaDef() {
  return { type: "object", properties: { summary: { type: "string" }, weeks: { type: "array", items: { type: "object", properties: { period: { type: "string" }, focus: { type: "string" }, tasks: { type: "array", items: { type: "string" } } }, required: ["period", "focus", "tasks"] } }, milestones: { type: "array", items: { type: "string" } }, metrics: { type: "array", items: { type: "string" } }, funding_readiness: { type: "array", items: { type: "string" } } }, required: ["summary", "weeks", "milestones", "metrics", "funding_readiness"] };
}

export default async function aiRoutes(fastify: FastifyInstance) {
  fastify.get("/status", async () => {
    return { enabled: Boolean(AI_PROVIDER), provider: AI_PROVIDER, model: AI_PROVIDER ? AI_MODEL : null };
  });

  fastify.post("/validate", { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const payload = validateSchema.parse(request.body);
    const venture = payload.venture;
    let result: any;
    let source = AI_PROVIDER || "local";
    try {
      const prompt = `You are an expert startup venture analyst. Return strict JSON with keys: score, summary, strengths, risks, experiments, customer_segments, pitch_improvements, next_30_days.\n\nVenture:\nName: ${venture.name}\nSector: ${venture.sector}\nStage: ${venture.stage}\nProblem: ${venture.problem}\nSolution: ${venture.solution}\nCustomer: ${venture.customer}\nTraction: ${venture.traction}\nGoals: ${venture.goals}`;
      result = (await callAiJson(prompt, validationSchemaDef())) || localValidation(venture);
    } catch (error: any) {
      result = localValidation(venture);
      result.summary += ` API call failed: ${error.message}`;
      source = "local";
    }
    await saveReport(venture.id || null, "validation", result);
    return { source, result };
  });

  fastify.post("/nlp", { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const data = nlpSchema.parse(request.body);
    let result: any;
    let source = AI_PROVIDER || "local";
    try {
      if (AI_PROVIDER) {
        const prompt = `Analyze this startup description using NLP-style business interpretation. Return strict JSON with keys: keywords, sentiment, clarity_score, market_signals, missing_information, improved_statement.\n\nText:\n${data.text}`;
        result = (await callAiJson(prompt, nlpSchemaDef())) || localNlp(data.text);
      } else {
        const pythonCommand = process.env.PYTHON || "python";
        const scriptPath = resolve(ROOT, "nlp_predict.py");
        const pythonResult = spawnSync(pythonCommand, [scriptPath, "--text", data.text], { encoding: "utf8", maxBuffer: 10 * 1024 * 1024 });
        if (pythonResult.status === 0) {
          result = JSON.parse(pythonResult.stdout);
          source = "local-model";
        } else {
          result = localNlp(data.text);
          source = "local";
        }
      }
    } catch (error: any) {
      result = localNlp(data.text);
      result.market_signals.push(`API call failed: ${error.message}`);
      source = "local";
    }
    await saveReport(data.venture_id || null, "nlp", result);
    return { source, result };
  });

  fastify.post("/cnn-predict", { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const data = cnnPredictSchema.parse(request.body);
    try {
      const pythonCommand = process.env.PYTHON || "python";
      const modelPath = resolve(ROOT, "models", "cnn_cifar10.keras");
      const scriptPath = resolve(ROOT, "predict_cnn.py");
      const result = spawnSync(pythonCommand, [scriptPath, "--model-path", modelPath.toString()], { input: data.image_base64, encoding: "utf8", maxBuffer: 20 * 1024 * 1024 });
      if (result.error) throw result.error;
      if (result.status !== 0) throw new Error(result.stderr || "Python prediction failed");
      return { prediction: JSON.parse(result.stdout) };
    } catch (error: any) {
      reply.status(500);
      return { error: error.message || "Prediction failed." };
    }
  });

  fastify.post("/faq", { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const data = faqSchema.parse(request.body);
    let result: any;
    let source = AI_PROVIDER || "local";
    try {
      const prompt = `You are the VentureLift FAQ bot. Return strict JSON with keys: answer, next_steps, related_topics.\n\nQuestion:\n${data.question}`;
      result = (await callAiJson(prompt, faqSchemaDef())) || localFaq(data.question);
    } catch (error: any) {
      result = localFaq(data.question);
      result.next_steps.push(`AI call failed: ${error.message}`);
      source = "local";
    }
    await saveReport(null, "faq", result);
    return { source, result };
  });

  fastify.post("/suggestions", { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const data = suggestionSchema.parse(request.body);
    let result: any;
    let source = AI_PROVIDER || "local";
    try {
      const prompt = `You are a practical startup mentor. Return strict JSON with keys: reply, action_items, risks_to_watch, mentor_angle.\n\nVenture: ${data.venture?.name || "N/A"}\nFounder message: ${data.message}`;
      result = (await callAiJson(prompt, suggestionSchemaDef())) || localSuggestion(data.message, data.venture);
    } catch (error: any) {
      result = localSuggestion(data.message, data.venture);
      result.risks_to_watch.push(`AI call failed: ${error.message}`);
      source = "local";
    }
    await saveReport(data.venture?.id || null, "suggestion", result);
    return { source, result };
  });

  fastify.post("/roadmap", { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const data = roadmapSchema.parse(request.body);
    if (data.score <= 75) {
      reply.status(403);
      return { error: "Roadmap unlocks only when validation score is above 75." };
    }
    let result: any;
    let source = AI_PROVIDER || "local";
    try {
      const prompt = `Generate a 90-day venture roadmap. Score is ${data.score}. Return strict JSON with keys: summary, weeks, milestones, metrics, funding_readiness. Each week: period, focus, tasks.\n\nVenture: ${data.venture.name || "N/A"}`;
      result = (await callAiJson(prompt, roadmapSchemaDef())) || localRoadmap(data.venture, data.score);
    } catch (error: any) {
      result = localRoadmap(data.venture, data.score);
      result.funding_readiness.push(`AI call failed: ${error.message}`);
      source = "local";
    }
    await saveReport(data.venture?.id || null, "roadmap", result);
    return { source, result };
  });
}
