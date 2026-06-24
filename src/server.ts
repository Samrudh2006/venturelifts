import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import formbody from "@fastify/formbody";
import rateLimit from "@fastify/rate-limit";
import fastifyCookie from "@fastify/cookie";
import { connectDatabase, disconnectDatabase } from "./lib/prisma.js";
import logger from "./lib/logger.js";
import { seedDemoUsers } from "./lib/seed.js";
import authPlugin from "./plugins/auth.js";
import { initSentry, setupSentryErrorHandler, captureError } from "./lib/sentry.js";
import healthRoutes from "./routes/health.js";
import authRoutes from "./routes/v1/auth.js";
import ventureRoutes from "./routes/v1/ventures.js";
import mentorRoutes from "./routes/v1/mentors.js";
import userRoutes from "./routes/v1/users.js";
import aiRoutes from "./routes/v1/ai.js";
import sessionRoutes from "./routes/v1/sessions.js";
import twoFactorRoutes from "./routes/v1/twofactor.js";
import commentRoutes from "./routes/v1/comments.js";
import reportRoutes from "./routes/v1/reports.js";
import monitoringRoutes from "./routes/v1/monitoring.js";
import oauthRoutes from "./routes/v1/oauth.js";
import billingRoutes from "./routes/v1/billing.js";

export async function buildServer() {
  const fastify = Fastify({
    logger: false,
    trustProxy: true,
  });

  await fastify.register(cors, {
    origin: process.env.CORS_ORIGIN?.split(",") || ["http://localhost:5173", "http://127.0.0.1:8000"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  await fastify.register(helmet, {
    contentSecurityPolicy: process.env.NODE_ENV === "production" ? {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "https:", "data:"],
        connectSrc: ["'self'", "https://api.openai.com", "https://api.groq.com"],
      },
    } : false,
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    xFrameOptions: { action: "deny" },
    xContentTypeOptions: true,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  });

  await fastify.register(formbody);
  await fastify.register(fastifyCookie);

  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: "1 minute",
    keyGenerator: (request) => request.ip,
    errorResponseBuilder: () => ({ error: "Too many requests, please try again later." }),
  });

  initSentry();
  setupSentryErrorHandler(fastify);
  await seedDemoUsers();

  await fastify.register(authPlugin);

  fastify.addHook("onRequest", (request, _reply, done) => {
    request.log = logger.child({ reqId: request.id, method: request.method, url: request.url });
    done();
  });

  fastify.addHook("onResponse", (request, reply, done) => {
    logger.info({ reqId: request.id, method: request.method, url: request.url, statusCode: reply.statusCode, responseTime: reply.elapsedTime }, "request completed");
    done();
  });

  fastify.setErrorHandler((error, request, reply) => {
    if (error.statusCode === 429) {
      reply.status(429).send({ error: "Too many requests, please try again later." });
      return;
    }
    if (error.validation) {
      reply.status(400).send({ error: error.validation[0]?.message || "Validation failed" });
      return;
    }
    if (error instanceof (require("zod") as any).ZodError) {
      reply.status(400).send({ error: error.errors[0]?.message || "Validation failed" });
      return;
    }
    logger.error({ err: error, reqId: request.id }, "Unhandled error");
    reply.status(error.statusCode || 500).send({ error: error.message || "Internal server error" });
  });

  fastify.get("/", async () => {
    return { service: "VentureLift API", version: "1.0.0", docs: "/api/v1" };
  });

  await fastify.register(healthRoutes);

  await fastify.register(async (instance) => {
    await instance.register(authRoutes);
    await instance.register(ventureRoutes, { prefix: "/ventures" });
    await instance.register(mentorRoutes, { prefix: "/mentors" });
    await instance.register(userRoutes, { prefix: "/users" });
    await instance.register(aiRoutes, { prefix: "/ai" });
    await instance.register(sessionRoutes, { prefix: "/sessions" });
    await instance.register(twoFactorRoutes, { prefix: "/2fa" });
    await instance.register(commentRoutes, { prefix: "/comments" });
    await instance.register(reportRoutes, { prefix: "/reports" });
    await instance.register(monitoringRoutes, { prefix: "/monitoring" });
    await instance.register(oauthRoutes, { prefix: "/oauth" });
    await instance.register(billingRoutes, { prefix: "/billing" });
  }, { prefix: "/api/v1" });

  return fastify;
}

async function start() {
  await connectDatabase();

  const server = await buildServer();
  const port = Number(process.env.PORT || 8000);

  const gracefulShutdown = async (signal: string) => {
    logger.info({ signal }, "Shutdown signal received");
    await server.close();
    await disconnectDatabase();
    process.exit(0);
  };

  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("uncaughtException", (error) => {
    logger.error({ err: error }, "Uncaught exception");
    gracefulShutdown("uncaughtException");
  });
  process.on("unhandledRejection", (reason) => {
    logger.error({ err: reason }, "Unhandled rejection");
  });

  try {
    await server.listen({ port, host: "127.0.0.1" });
    logger.info({ port }, "VentureLift Fastify server started");
    logger.info({ endpoints: ["/health", "/ready", "/live", "/api/v1"] }, "Available endpoints");
  } catch (error) {
    captureError(error as Error, { context: "server start" });
    logger.error({ err: error }, "Failed to start server");
    process.exit(1);
  }
}

if (process.argv[1] && (process.argv[1].endsWith("server.ts") || process.argv[1].endsWith("server.js"))) {
  start();
}
