import { describe, it, expect, beforeAll, afterAll } from "vitest";

async function inject(method: string, url: string, payload?: any, token?: string) {
  const { connectDatabase, disconnectDatabase } = await import("../../src/lib/prisma.js");
  await connectDatabase();
  const { buildServer } = await import("../../src/server.js");
  const server = await buildServer();
  await server.ready();

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const response = await server.inject({ method: method as any, url, headers, payload: payload ? JSON.stringify(payload) : undefined });
  const text = response.body;
  const data = text ? JSON.parse(text) : {};

  await server.close();
  await disconnectDatabase();
  return { status: response.statusCode, headers: response.headers, data };
}

describe("API Integration Tests", () => {
  it("health endpoint returns ok", async () => {
    const { status, data } = await inject("GET", "/health");
    expect(status).toBe(200);
    expect(data.status).toBe("ok");
  });

  it("registration creates a new user", async () => {
    const testEmail = `test-${Date.now()}@example.com`;
    const { status, data } = await inject("POST", "/api/v1/register", { name: "Test User", email: testEmail, password: "TestPass123!" });
    expect(status).toBe(201);
    expect(data.user.email).toBe(testEmail);
  });

  it("login with valid credentials returns tokens", async () => {
    const { status, data } = await inject("POST", "/api/v1/login", { email: "founder@venturelift.local", password: "Founder@123" });
    expect(status).toBe(200);
    expect(data.accessToken).toBeTruthy();
    expect(data.user.role).toBe("founder");
  });

  it("invalid login returns 401", async () => {
    const { status } = await inject("POST", "/api/v1/login", { email: "wrong@email.com", password: "wrong" });
    expect(status).toBe(401);
  });

  it("authenticated venture list returns ventures", async () => {
    const login = await inject("POST", "/api/v1/login", { email: "founder@venturelift.local", password: "Founder@123" });
    const token = login.data.accessToken;

    const { status, data } = await inject("GET", "/api/v1/ventures", undefined, token);
    expect(status).toBe(200);
    expect(Array.isArray(data.ventures)).toBe(true);
  });

  it("ai status returns provider info", async () => {
    const { status, data } = await inject("GET", "/api/v1/ai/status");
    expect(status).toBe(200);
    expect(typeof data.enabled).toBe("boolean");
  });

  it("comment creation and retrieval works", async () => {
    const login = await inject("POST", "/api/v1/login", { email: "founder@venturelift.local", password: "Founder@123" });
    const token = login.data.accessToken;

    const ventures = await inject("GET", "/api/v1/ventures", undefined, token);
    const firstVenture = ventures.data.ventures?.[0];
    if (!firstVenture) return;

    const create = await inject("POST", "/api/v1/comments", { ventureId: firstVenture.id, content: "Integration test comment" }, token);
    expect(create.status).toBe(201);
    expect(create.data.comment.content).toBe("Integration test comment");

    const list = await inject("GET", `/api/v1/comments/${firstVenture.id}`, undefined, token);
    expect(list.status).toBe(200);
    expect(Array.isArray(list.data.comments)).toBe(true);
    expect(list.data.comments.length).toBeGreaterThanOrEqual(1);
  });
});
