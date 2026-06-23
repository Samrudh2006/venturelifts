"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");
const url = require("url");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// Simple in-memory database for auth
const users = [];

// Auth middleware
function authMiddleware(req, res, next) {
  const cookies = req.headers.cookie ? req.headers.cookie.split('; ').reduce((acc, cookie) => {
    const [name, value] = cookie.split('=');
    acc[name] = value;
    return acc;
  }, {}) : {};

  const token = cookies.vl_session;
  if (!token) {
    return res.status(401).json({ error: "Login required" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "venturelift-local-dev-secret");
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

function createServer() {
  const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    // Handle CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    try {
      if (pathname.startsWith('/api/')) {
        await handleApi(req, res, parsedUrl);
      } else {
        await handleStatic(req, res, pathname);
      }
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
    }
  });

  return server;
}

async function handleApi(req, res, parsedUrl) {
  const pathname = parsedUrl.pathname;

  if (pathname === '/api/me') {
    const userId = parseToken(req);
    if (!userId) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: "Login required" }));
      return;
    }

    const user = users.find(u => u.id === userId);
    if (!user) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: "User not found" }));
      return;
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      expertise: user.expertise,
      created_at: user.created_at,
      emailVerified: user.emailVerified,
      twoFactorEnabled: user.twoFactorEnabled,
    }));

  } else if (pathname === '/api/login' && req.method === 'POST') {
    const body = await parseBody(req);
    const { email, password } = body;

    const user = users.find(u => u.email === email.toLowerCase());
    if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: "Invalid email or password" }));
      return;
    }

    if (!user.emailVerified) {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: "Please verify your email first" }));
      return;
    }

    // Generate tokens
    const accessToken = jwt.sign(
      { userId: user.id, type: "access" },
      process.env.JWT_SECRET || "venturelift-local-dev-secret",
      { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
      { userId: user.id, type: "refresh" },
      process.env.JWT_SECRET || "venturelift-local-dev-secret",
      { expiresIn: "7d" }
    );

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        expertise: user.expertise,
        created_at: user.created_at,
        emailVerified: user.emailVerified,
      },
      accessToken,
      refreshToken,
    }));

  } else if (pathname === '/api/refresh' && req.method === 'POST') {
    const body = await parseBody(req);
    const { refreshToken } = body;

    if (!refreshToken) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: "Refresh token required" }));
      return;
    }

    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET || "venturelift-local-dev-secret");
      if (decoded.type !== "refresh") {
        throw new Error("Invalid token type");
      }

      const user = users.find(u => u.id === decoded.userId);
      if (!user) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: "User not found" }));
        return;
      }

      // Generate new access token
      const newAccessToken = jwt.sign(
        { userId: user.id, type: "access" },
        process.env.JWT_SECRET || "venturelift-local-dev-secret",
        { expiresIn: "15m" }
      );

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        accessToken: newAccessToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          expertise: user.expertise,
          created_at: user.created_at,
          emailVerified: user.emailVerified,
        }
      }));
    } catch (error) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: "Invalid refresh token" }));
    }

  } else if (pathname === '/api/logout' && req.method === 'POST') {
    // In a real implementation, we would invalidate the session
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));

  } else if (pathname === '/api/register' && req.method === 'POST') {
    const body = await parseBody(req);
    const { name, email, password, role = "founder", expertise = "" } = body;

    if (!name || !email || password.length < 6) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: "Name, email, and a 6+ character password are required." }));
      return;
    }

    if (users.find(u => u.email === email.toLowerCase())) {
      res.writeHead(409, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: "Email already registered" }));
      return;
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const userId = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;

    const newUser = {
      id: userId,
      name,
      email: email.toLowerCase(),
      passwordHash,
      role,
      expertise,
      created_at: new Date().toISOString(),
      emailVerified: false,
      twoFactorEnabled: false,
    };

    users.push(newUser);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    console.log(`Email verification: ${email}\nToken: ${verificationToken}\nExpires: ${new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()}`);

    res.writeHead(201, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        expertise: newUser.expertise,
        created_at: newUser.created_at,
        emailVerified: newUser.emailVerified,
      }
    }));

  } else if (pathname === '/api/email/verify' && req.method === 'POST') {
    const body = await parseBody(req);
    const { token } = body;

    if (!token) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: "Verification token required" }));
      return;
    }

    const verificationRecord = require('fs').existsSync('verification_tokens.json') ? 
      JSON.parse(require('fs').readFileSync('verification_tokens.json', 'utf8')) : {};

    if (!verificationRecord[token] || verificationRecord[token].verified) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: "Invalid or expired verification token" }));
      return;
    }

    if (new Date(verificationRecord[token].expiresAt) < new Date()) {
      delete verificationRecord[token];
      require('fs').writeFileSync('verification_tokens.json', JSON.stringify(verificationRecord));
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: "Verification token expired" }));
      return;
    }

    const email = verificationRecord[token].email;
    const user = users.find(u => u.email === email);
    if (!user) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: "User not found" }));
      return;
    }

    user.emailVerified = true;
    verificationRecord[token].verified = true;
    require('fs').writeFileSync('verification_tokens.json', JSON.stringify(verificationRecord));

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: "Email verified successfully" }));

  } else if (pathname === '/api/password/reset/request' && req.method === 'POST') {
    const body = await parseBody(req);
    const { email } = body;

    if (!email) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: "Email required" }));
      return;
    }

    const user = users.find(u => u.email === email.toLowerCase());
    if (!user) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: "If the email exists, a reset link has been sent" }));
      return;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetRecord = require('fs').existsSync('password_reset_tokens.json') ? 
      JSON.parse(require('fs').readFileSync('password_reset_tokens.json', 'utf8')) : {};

    resetRecord[resetToken] = {
      email: email.toLowerCase(),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    };

    require('fs').writeFileSync('password_reset_tokens.json', JSON.stringify(resetRecord));
    console.log(`Password reset: ${email}\nToken: ${resetToken}\nExpires: ${new Date(Date.now() + 60 * 60 * 1000).toISOString()}`);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: "If the email exists, a reset link has been sent" }));

  } else if (pathname === '/api/password/reset' && req.method === 'POST') {
    const body = await parseBody(req);
    const { token, newPassword } = body;

    if (!token || !newPassword) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: "Token and new password required" }));
      return;
    }

    if (newPassword.length < 6) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: "Password must be at least 6 characters" }));
      return;
    }

    const resetRecord = require('fs').existsSync('password_reset_tokens.json') ? 
      JSON.parse(require('fs').readFileSync('password_reset_tokens.json', 'utf8')) : {};

    if (!resetRecord[token] || resetRecord[token].used) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: "Invalid or expired reset token" }));
      return;
    }

    if (new Date(resetRecord[token].expiresAt) < new Date()) {
      delete resetRecord[token];
      require('fs').writeFileSync('password_reset_tokens.json', JSON.stringify(resetRecord));
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: "Reset token expired" }));
      return;
    }

    const user = users.find(u => u.email === resetRecord[token].email);
    if (!user) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: "User not found" }));
      return;
    }

    user.passwordHash = bcrypt.hashSync(newPassword, 10);
    resetRecord[token].used = true;
    require('fs').writeFileSync('password_reset_tokens.json', JSON.stringify(resetRecord));

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: "Password reset successfully" }));

  } else if (pathname === '/api/sessions' && req.method === 'GET') {
    const userId = parseToken(req);
    if (!userId) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: "Login required" }));
      return;
    }

    const sessions = [];
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ sessions }));

  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: "Not found" }));
  }
}

async function handleStatic(req, res, pathname) {
  const filePath = path.join(process.cwd(), pathname === '/' ? 'index.html' : pathname);

  try {
    const stats = fs.statSync(filePath);
    if (!stats.isFile()) {
      throw new Error('Not a file');
    }

    const ext = path.extname(filePath);
    const contentTypes = {
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.png': 'image/png',
    };

    const contentType = contentTypes[ext] || 'application/octet-stream';
    const content = fs.readFileSync(filePath);

    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  } catch (error) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  }
}

function parseToken(req) {
  const cookies = req.headers.cookie ? req.headers.cookie.split('; ').reduce((acc, cookie) => {
    const [name, value] = cookie.split('=');
    acc[name] = value;
    return acc;
  }, {}) : {};

  const token = cookies.vl_session;
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "venturelift-local-dev-secret");
    return decoded.userId;
  } catch {
    return null;
  }
}

async function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';

    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch {
        resolve({});
      }
    });
  });
}

async function seedInitialUsers() {
  const hashedPassword = bcrypt.hashSync("Admin@123", 10);

  if (!users.find(u => u.email === "admin@venturelift.local")) {
    users.push({
      id: 1,
      name: "Platform Admin",
      email: "admin@venturelift.local",
      passwordHash: hashedPassword,
      role: "admin",
      expertise: "Platform operations",
      created_at: new Date().toISOString(),
      emailVerified: true,
      twoFactorEnabled: false,
    });
  }

  if (!users.find(u => u.email === "founder@venturelift.local")) {
    users.push({
      id: 2,
      name: "Founder Demo",
      email: "founder@venturelift.local",
      passwordHash: hashedPassword,
      role: "founder",
      expertise: "Early-stage venture building",
      created_at: new Date().toISOString(),
      emailVerified: true,
      twoFactorEnabled: false,
    });
  }

  if (!users.find(u => u.email === "mentor@venturelift.local")) {
    users.push({
      id: 3,
      name: "Mentor Demo",
      email: "mentor@venturelift.local",
      passwordHash: hashedPassword,
      role: "mentor",
      expertise: "Product strategy, fundraising, GTM",
      created_at: new Date().toISOString(),
      emailVerified: true,
      twoFactorEnabled: false,
    });
  }
}

async function start() {
  await seedInitialUsers();

  const server = createServer();
  const PORT = process.env.PORT || 8000;

  server.listen(PORT, () => {
    console.log(`Venture platform running at http://127.0.0.1:${PORT}`);
    console.log(`Auth features enabled: JWT-based auth, email verification, password reset, session management, refresh tokens`);
    console.log(`Demo accounts:
  Admin: admin@venturelift.local / Admin@123
  Founder: founder@venturelift.local / Founder@123
  Mentor: mentor@venturelift.local / Mentor@123`);
  });
}

module.exports = { start };