import { init, captureException, setupFastifyErrorHandler } from "@sentry/node";
import type { FastifyInstance } from "fastify";

const DSN = process.env.SENTRY_DSN || "";

export function initSentry() {
  if (!DSN) return;
  init({ dsn: DSN, environment: process.env.NODE_ENV || "development", tracesSampleRate: 0.2 });
}

export function setupSentryErrorHandler(server: FastifyInstance) {
  if (!DSN) return;
  setupFastifyErrorHandler(server);
}

export function captureError(err: Error, context?: Record<string, unknown>) {
  if (!DSN) { console.error("[Sentry未配置]", err.message); return; }
  captureException(err, { extra: context });
}
