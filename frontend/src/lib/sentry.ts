import { init, captureException } from "@sentry/react";

const DSN = import.meta.env.VITE_SENTRY_DSN || "";

export function initFrontendSentry() {
  if (!DSN) return;
  init({
    dsn: DSN,
    environment: import.meta.env.MODE || "development",
    tracesSampleRate: 0.2,
    integrations: [],
  });
}

export function reportError(error: unknown, context?: Record<string, unknown>) {
  if (!DSN) { console.error("[Sentry未設定]", error); return; }
  captureException(error, { extra: context });
}
