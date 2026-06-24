import { describe, it, expect, beforeAll } from "vitest";

const JWT_SECRET = "test-secret-for-unit-tests-min-32-chars!!";
process.env.JWT_SECRET = JWT_SECRET;

describe("Auth Service", () => {
  it("should hash and verify passwords correctly", async () => {
    const { AuthService } = await import("../../src/lib/auth.js");
    const auth = new AuthService();
    const password = "TestPassword123!";
    const hash = auth.hashPassword(password);
    expect(hash).toContain(":");
    expect(auth.verifyPassword(password, hash)).toBe(true);
    expect(auth.verifyPassword("WrongPassword", hash)).toBe(false);
  });

  it("should generate and verify JWT tokens", async () => {
    const { AuthService } = await import("../../src/lib/auth.js");
    const auth = new AuthService();
    const tokens = auth.generateTokens(1);
    expect(tokens.accessToken).toBeTruthy();
    expect(tokens.refreshToken).toBeTruthy();

    const decoded = auth.verifyToken(tokens.accessToken);
    expect(decoded).not.toBeNull();
    expect(decoded!.userId).toBe(1);
    expect(decoded!.type).toBe("access");
  });

  it("should reject expired tokens", async () => {
    const { AuthService } = await import("../../src/lib/auth.js");
    const auth = new AuthService();
    const invalidToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInR5cGUiOiJhY2Nlc3MiLCJpYXQiOjE1MTYyMzkwMjIsImV4cCI6MTUxNjIzOTAyMn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
    const decoded = auth.verifyToken(invalidToken);
    expect(decoded).toBeNull();
  });

  it("should generate secure random tokens", async () => {
    const { AuthService } = await import("../../src/lib/auth.js");
    const auth = new AuthService();
    const token1 = auth.generateToken();
    const token2 = auth.generateToken();
    expect(token1).not.toBe(token2);
    expect(token1.length).toBe(64);
  });
});
