import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const PUBLIC = resolve(ROOT, "public");
const DB_PATH = process.env.SUPABASE_URL
  ? null
  : process.env.DB_PATH || (process.env.VERCEL ? "/tmp/venture_platform.db" : resolve(ROOT, "venture_platform.db"));

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.env.ADVANCED_AI_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const AI_PROVIDER = OPENAI_API_KEY ? "openai" : GROQ_API_KEY ? "groq" : null;
const AI_MODEL = process.env.AI_MODEL || (AI_PROVIDER === "groq" ? "llama3-8b-8192" : "gpt-5.4-mini");
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const supabase = SUPABASE_URL && SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } }) : null;
const USE_SUPABASE = Boolean(supabase);

let prisma = null;
let authService = null;

function loadDotEnv(path) {
  if (!existsSync(path)) return;
  const text = readFileSync(path, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

loadDotEnv(resolve(ROOT, ".env"));

async function initBackend() {
  if (!prisma) {
    const { PrismaClient } = await import("@prisma/client");
    const { PrismaBetterSqlite3 } = await import("@prisma/adapter-better-sqlite3");
    const adapter = new PrismaBetterSqlite3({ url: "file:./venture_platform.db" });
    prisma = new PrismaClient({ adapter });
    authService = new (await import("./auth.mjs")).AuthService(prisma);

    await prisma.$connect();

    // Seed initial data
    await seedInitialData();
  }
}

async function seedInitialData() {
  const existingUsers = await prisma.user.count();
  if (existingUsers > 0) return;

  // Create initial users with secure passwords
  const seedUsers = [
    {
      name: "Platform Admin",
      email: "admin@venturelift.local",
      password: "Admin@123",
      role: "admin",
      expertise: "Platform operations",
    },
    {
      name: "Mentor Demo",
      email: "mentor@venturelift.local",
      password: "Mentor@123",
      role: "mentor",
      expertise: "Product strategy, fundraising, GTM",
    },
    {
      name: "Founder Demo",
      email: "founder@venturelift.local",
      password: "Founder@123",
      role: "founder",
      expertise: "Early-stage venture building",
    },
    {
      name: "Ananya Rao",
      email: "ananya.rao@venturelift.local",
      password: "Mentor@123",
      role: "mentor",
      expertise: "Healthtech, clinical pilots, hospital partnerships, regulatory strategy",
    },
    {
      name: "Marcus Bennett",
      email: "marcus.bennett@venturelift.local",
      password: "Mentor@123",
      role: "mentor",
      expertise: "Fintech, payments, pricing, B2B SaaS sales, investor readiness",
    },
    {
      name: "Leah Mensah",
      email: "leah.mensah@venturelift.local",
      password: "Mentor@123",
      role: "mentor",
      expertise: "Climate tech, circular economy, impact metrics, grant applications",
    },
    {
      name: "David Chen",
      email: "david.chen@venturelift.local",
      password: "Mentor@123",
      role: "mentor",
      expertise: "AI products, NLP, data platforms, MVP architecture, product analytics",
    },
    {
      name: "Priya Kapoor",
      email: "priya.kapoor@venturelift.local",
      password: "Mentor@123",
      role: "mentor",
      expertise: "Edtech, learning design, university incubators, community growth",
    },
  ];

  for (const seedUser of seedUsers) {
    await authService.createUser(seedUser);
  }

  // Create demo ventures
  const founder = await prisma.user.findUnique({
    where: { email: "founder@venturelift.local" },
  });

  if (founder) {
    const seedVentures = [
      {
        name: "CarePulse AI",
        founder: "Neha Sharma",
        sector: "Healthtech",
        stage: "MVP",
        problem: "Small clinics lose follow-up patients because reminders, triage notes, and care instructions are handled manually.",
        solution: "An AI assistant that summarizes visits, sends multilingual follow-up reminders, and flags high-risk patients for clinic staff.",
        customer: "Independent clinics and outpatient care centers",
        traction: "Pilot with 3 clinics and 420 patient reminders sent",
        goals: "Convert two pilots into paid monthly subscriptions",
      },
      {
        name: "LedgerLite",
        founder: "Arjun Mehta",
        sector: "Fintech",
        stage: "Prototype",
        problem: "Micro retailers struggle to track cash flow, credit sales, and supplier dues in one simple system.",
        solution: "A mobile-first bookkeeping and credit reminder app with invoice capture, WhatsApp nudges, and weekly cash-flow summaries.",
        customer: "Small grocery stores, local distributors, and solo retailers",
        traction: "85 retailer interviews and 19 prototype testers",
        goals: "Launch paid beta with 50 shops in one city",
      },
      {
        name: "ReLoop Materials",
        founder: "Maya Iyer",
        sector: "Climate tech",
        stage: "Pilot",
        problem: "Restaurants and cafes generate packaging waste but lack a reliable reverse logistics partner for reusable containers.",
        solution: "A reusable packaging network with QR tracking, deposit payments, and scheduled pickup from partner restaurants.",
        customer: "Urban cafes, cloud kitchens, and eco-conscious food brands",
        traction: "Pilot with 12 restaurants and 8,700 container rotations",
        goals: "Secure grant funding and expand to 50 restaurant partners",
      },
      {
        name: "SkillBridge Campus",
        founder: "Riya Nair",
        sector: "Edtech",
        stage: "Revenue",
        problem: "College students complete courses but lack mentor feedback, startup exposure, and proof of practical skills.",
        solution: "A project-based learning platform that matches students with mentors, live venture briefs, and portfolio reviews.",
        customer: "Universities, entrepreneurship cells, and final-year students",
        traction: "Paid programs at 2 colleges with 310 learners",
        goals: "Build mentor marketplace and sign 5 more campuses",
      },
      {
        name: "FarmRoute",
        founder: "Karan Patel",
        sector: "Supply chain",
        stage: "Idea",
        problem: "Small farmers lose margin because produce aggregation, transport pricing, and buyer discovery are fragmented.",
        solution: "A logistics coordination tool that groups nearby harvests, compares transport bids, and connects farmers to verified buyers.",
        customer: "Farmer producer organizations and rural aggregators",
        traction: "Discovery calls with 6 FPOs and 4 transport operators",
        goals: "Run a manual pilot for one crop season",
      },
    ];

    await prisma.venture.createMany({
      data: seedVentures.map((venture) => ({
        ...venture,
        userId: founder.id,
      })),
    });
  }
}

function nowIso() {
  return new Date().toISOString();
}

function sendJson(response, status, payload) {
  const body = JSON.stringify(payload, null, 2);
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
  });
  response.end(body);
}

function createJwt(payload) {
  const crypto = require("crypto");
  const data = JSON.stringify(payload);
  const encoded = Buffer.from(data).toString("base64url");
  const signature = crypto.createHmac("sha256", process.env.JWT_SECRET || "venturelift-local-dev-secret").update(encoded).digest("base64url");
  return `${encoded}.${signature}`;
}

function verifyJwt(token) {
  const crypto = require("crypto");
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [encoded, signature] = parts;
  const expected = crypto.createHmac("sha256", process.env.JWT_SECRET || "venturelift-local-dev-secret").update(encoded).digest("base64url");
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;

  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
    if (!payload || !payload.userId || !payload.expiresAt) return null;
    if (Date.now() > payload.expiresAt) return null;
    return payload;
  } catch {
    return null;
  }
}

function hashPassword(password) {
  const crypto = require("crypto");
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const crypto = require("crypto");
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const expected = Buffer.from(hash, "hex");
  const actual = crypto.scryptSync(password, Buffer.from(salt, "hex"), 64);
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

function parseCookies(request) {
  const header = request.headers.cookie || "";
  return Object.fromEntries(
    header
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const index = part.indexOf("=");
        return [part.slice(0, index), decodeURIComponent(part.slice(index + 1))];
      }),
  );
}

async function getCurrentUser(request) {
  const cookies = parseCookies(request);
  const token = cookies.vl_session;
  if (!token) return null;
  const payload = verifyJwt(token);
  if (!payload) return null;
  return prisma.user.findUnique({
    where: { id: payload.userId },
  });
}

function setSessionCookie(response, token, expiresAt) {
  response.setHeader(
    "Set-Cookie",
    `vl_session=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Expires=${new Date(expiresAt).toUTCString()}`,
  );
}

function clearSessionCookie(response) {
  response.setHeader("Set-Cookie", "vl_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0");
}

async function getUserByEmail(email) {
  const normalized = String(email || "").trim().toLowerCase();
  return prisma.user.findUnique({
    where: { email: normalized },
  });
}

async function createUser({ name, email, password, role = "founder", expertise = "" }) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });
  if (existing) {
    throw new Error("Email already registered");
  }

  const passwordHash = hashPassword(password);
  const user = await prisma.user.create({
    data: {
      name,
      email: normalizedEmail,
      passwordHash,
      role,
      expertise,
    },
  });

  return user;
}

async function requireUser(request, response) {
  const user = await getCurrentUser(request);
  if (!user) {
    sendJson(response, 401, { error: "Login required" });
    return null;
  }
  return user;
}

async function requireRole(request, response, roles) {
  const user = await requireUser(request, response);
  if (!user) return null;
  if (!roles.includes(user.role)) {
    sendJson(response, 403, { error: "You do not have permission for this action." });
    return null;
  }
  return user;
}

async function readJson(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

async function routeApi(request, response, url) {
  const pathname = url.pathname;
  const query = url.searchParams.get("q") || "";

  await initBackend();

  if (request.method === "GET" && pathname === "/api/me") {
    const user = await getCurrentUser(request);
    sendJson(response, 200, { user: user ? {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      expertise: user.expertise,
      created_at: user.created_at,
      emailVerified: user.emailVerified,
    } : null });
    return true;
  }

  if (request.method === "POST" && pathname === "/api/login") {
    const payload = await readJson(request);
    const email = String(payload.email || "").trim().toLowerCase();
    const password = String(payload.password || "");

    const user = await getUserByEmail(email);
    if (!user || !verifyPassword(password, user.password_hash)) {
      sendJson(response, 401, { error: "Invalid email or password" });
      return true;
    }

    // Check email verification
    if (!user.emailVerified) {
      sendJson(response, 403, { error: "Please verify your email first" });
      return true;
    }

    // Generate secure tokens
    const accessToken = require("crypto").randomBytes(32).toString("hex");
    const refreshToken = require("crypto").randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Store refresh token
    await prisma.session.create({
      data: {
        userId: user.id,
        refreshToken,
        userAgent: request.headers["user-agent"],
        ipAddress: request.socket.remoteAddress,
        expiresAt,
      },
    });

    sendJson(response, 200, { user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      expertise: user.expertise,
      created_at: user.created_at,
      emailVerified: user.emailVerified,
    }, accessToken, refreshToken });
    return true;
  }

  if (request.method === "POST" && pathname === "/api/refresh") {
    const payload = await readJson(request);
    const refreshToken = String(payload.refreshToken || "");

    if (!refreshToken) {
      sendJson(response, 400, { error: "Refresh token required" });
      return true;
    }

    try {
      const session = await prisma.session.findUnique({
        where: { refreshToken },
        include: { user: true },
      });

      if (!session) {
        sendJson(response, 401, { error: "Invalid refresh token" });
        return true;
      }

      if (session.revokedAt) {
        sendJson(response, 401, { error: "Session revoked" });
        return true;
      }

      if (session.expiresAt < new Date()) {
        await prisma.session.delete({ where: { id: session.id } });
        sendJson(response, 401, { error: "Session expired" });
        return true;
      }

      // Generate new access token
      const accessToken = require("crypto").randomBytes(32).toString("hex");

      // Extend session
      await prisma.session.update({
        where: { id: session.id },
        data: { expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
      });

      sendJson(response, 200, { accessToken, user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
        expertise: session.user.expertise,
        created_at: session.user.created_at,
        emailVerified: session.user.emailVerified,
      } });
      return true;
    } catch (error) {
      sendJson(response, 500, { error: error.message });
      return true;
    }
  }

  if (request.method === "POST" && pathname === "/api/logout") {
    const payload = await readJson(request);
    const refreshToken = String(payload.refreshToken || "");

    if (refreshToken) {
      await prisma.session.updateMany({
        where: { refreshToken },
        data: { revokedAt: new Date() },
      });
    }

    clearSessionCookie(response);
    sendJson(response, 200, { ok: true });
    return true;
  }

  if (request.method === "POST" && pathname === "/api/register") {
    try {
      const payload = await readJson(request);
      const name = String(payload.name || "").trim();
      const email = String(payload.email || "").trim().toLowerCase();
      const password = String(payload.password || "");
      const role = ["founder", "mentor"].includes(payload.role) ? payload.role : "founder";
      const expertise = String(payload.expertise || "").trim();

      if (!name || !email || password.length < 6) {
        sendJson(response, 400, { error: "Name, email, and a 6+ character password are required." });
        return true;
      }

      const user = await createUser({ name, email, password, role, expertise });

      // Generate email verification token
      const verificationToken = require("crypto").randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await prisma.emailVerificationToken.create({
        data: {
          userId: user.id,
          token: verificationToken,
          expiresAt,
        },
      });

      console.log(`Email verification: ${email}\nToken: ${verificationToken}\nExpires: ${expiresAt.toISOString()}`);

      sendJson(response, 201, { user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        expertise: user.expertise,
        created_at: user.created_at,
        emailVerified: user.emailVerified,
      } });
      return true;
    } catch (error) {
      sendJson(response, 409, { error: error.message });
      return true;
    }
  }

  if (request.method === "POST" && pathname === "/api/email/verify") {
    const payload = await readJson(request);
    const token = String(payload.token || "");

    if (!token) {
      sendJson(response, 400, { error: "Verification token required" });
      return true;
    }

    try {
      const tokenRecord = await prisma.emailVerificationToken.findUnique({
        where: { token },
        include: { user: true },
      });

      if (!tokenRecord) {
        sendJson(response, 400, { error: "Invalid or expired verification token" });
        return true;
      }

      if (tokenRecord.expiresAt < new Date()) {
        await prisma.emailVerificationToken.delete({ where: { id: tokenRecord.id } });
        sendJson(response, 400, { error: "Verification token expired" });
        return true;
      }

      await prisma.user.update({
        where: { id: tokenRecord.userId },
        data: { emailVerified: true, emailVerifiedAt: new Date() },
      });

      await prisma.emailVerificationToken.delete({ where: { id: tokenRecord.id } });

      sendJson(response, 200, { message: "Email verified successfully" });
      return true;
    } catch (error) {
      sendJson(response, 500, { error: error.message });
      return true;
    }
  }

  if (request.method === "POST" && pathname === "/api/password/reset/request") {
    const payload = await readJson(request);
    const email = String(payload.email || "").trim();

    if (!email) {
      sendJson(response, 400, { error: "Email required" });
      return true;
    }

    try {
      const user = await getUserByEmail(email);
      if (!user) {
        sendJson(response, 200, { message: "If the email exists, a reset link has been sent" });
        return true;
      }

      const resetToken = require("crypto").randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      await prisma.passwordResetToken.deleteMany({
        where: { userId: user.id, usedAt: null },
      });

      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          token: resetToken,
          expiresAt,
        },
      });

      console.log(`Password reset: ${email}\nToken: ${resetToken}\nExpires: ${expiresAt.toISOString()}`);

      sendJson(response, 200, { message: "If the email exists, a reset link has been sent" });
      return true;
    } catch (error) {
      sendJson(response, 500, { error: error.message });
      return true;
    }
  }

  if (request.method === "POST" && pathname === "/api/password/reset") {
    const payload = await readJson(request);
    const token = String(payload.token || "");
    const newPassword = String(payload.newPassword || "");

    if (!token || !newPassword) {
      sendJson(response, 400, { error: "Token and new password required" });
      return true;
    }

    if (newPassword.length < 6) {
      sendJson(response, 400, { error: "Password must be at least 6 characters" });
      return true;
    }

    try {
      const tokenRecord = await prisma.passwordResetToken.findUnique({
        where: { token },
        include: { user: true },
      });

      if (!tokenRecord) {
        sendJson(response, 400, { error: "Invalid or expired reset token" });
        return true;
      }

      if (tokenRecord.usedAt) {
        sendJson(response, 400, { error: "Reset token already used" });
        return true;
      }

      if (tokenRecord.expiresAt < new Date()) {
        await prisma.passwordResetToken.delete({ where: { id: tokenRecord.id } });
        sendJson(response, 400, { error: "Reset token expired" });
        return true;
      }

      const passwordHash = hashPassword(newPassword);
      await prisma.user.update({
        where: { id: tokenRecord.userId },
        data: { passwordHash },
      });

      await prisma.passwordResetToken.update({
        where: { id: tokenRecord.id },
        data: { usedAt: new Date() },
      });

      sendJson(response, 200, { message: "Password reset successfully" });
      return true;
    } catch (error) {
      sendJson(response, 500, { error: error.message });
      return true;
    }
  }

  if (request.method === "GET" && pathname === "/api/sessions") {
    const user = await requireUser(request, response);
    if (!user) return true;

    const sessions = await prisma.session.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        userAgent: true,
        ipAddress: true,
        expiresAt: true,
        createdAt: true,
        revokedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    sendJson(response, 200, { sessions });
    return true;
  }

  if (request.method === "POST" && pathname === "/api/sessions/revoke") {
    const payload = await readJson(request);
    const sessionId = Number(payload.sessionId);
    const user = await requireUser(request, response);
    if (!user) return true;

    if (!sessionId) {
      sendJson(response, 400, { error: "Session ID required" });
      return true;
    }

    try {
      const session = await prisma.session.findUnique({
        where: { id: sessionId },
      });

      if (!session) {
        sendJson(response, 404, { error: "Session not found" });
        return true;
      }

      if (session.userId !== user.id) {
        sendJson(response, 403, { error: "Unauthorized" });
        return true;
      }

      await prisma.session.update({
        where: { id: sessionId },
        data: { revokedAt: new Date() },
      });

      sendJson(response, 200, { message: "Session revoked" });
      return true;
    } catch (error) {
      sendJson(response, 500, { error: error.message });
      return true;
    }
  }

  return false;
}

function publicFilePath(pathname) {
  const requested = pathname === "/" ? "index.html" : pathname.slice(1);
  return resolve(join(PUBLIC, requested));
}

export { routeApi, publicFilePath, initBackend };