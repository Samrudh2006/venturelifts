import http from "k6/http";
import { check, sleep } from "k6";
import { Rate } from "k6/metrics";

const BASE_URL = __ENV.BASE_URL || "http://127.0.0.1:8000";

export const options = {
  stages: [
    { duration: "30s", target: 20 },
    { duration: "1m", target: 50 },
    { duration: "30s", target: 100 },
    { duration: "1m", target: 100 },
    { duration: "30s", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(95)<500"],
    http_req_failed: ["rate<0.01"],
  },
};

const errorRate = new Rate("errors");

export default function () {
  const responses = http.batch([
    ["GET", `${BASE_URL}/health`, null, { tags: { name: "health" } }],
    ["GET", `${BASE_URL}/ready`, null, { tags: { name: "ready" } }],
    ["GET", `${BASE_URL}/api/v1/ai/status`, null, { tags: { name: "ai-status" } }],
    ["POST", `${BASE_URL}/api/v1/login`, JSON.stringify({
      email: "founder@venturelift.local",
      password: "Founder@123",
    }), { headers: { "Content-Type": "application/json" }, tags: { name: "login" } }],
  ]);

  for (const res of responses) {
    errorRate.add(res.status >= 400);
    check(res, {
      "status is 2xx": (r) => r.status >= 200 && r.status < 300,
      "response time < 500ms": (r) => r.timings.duration < 500,
    });
  }

  sleep(1);
}
