import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import prisma from "./prisma.js";
import logger from "./logger.js";

const JWT_SECRET = () => process.env.JWT_SECRET || "venturelift-local-dev-secret-change-in-production";

export class AuthService {
  generateToken(length = 32) {
    return crypto.randomBytes(length).toString("hex");
  }

  hashPassword(password: string) {
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = crypto.scryptSync(password, salt, 64);
    return `${salt}:${hash.toString("hex")}`;
  }

  verifyPassword(password: string, stored: string) {
    const [salt, hash] = stored.split(":");
    if (!salt || !hash) return false;
    const expected = crypto.scryptSync(password, salt, 64);
    return crypto.timingSafeEqual(Buffer.from(hash, "hex"), expected);
  }

  generateTokens(userId: number) {
    const secret = JWT_SECRET();
    const accessToken = jwt.sign({ userId, type: "access" }, secret, { expiresIn: "15m" });
    const refreshToken = jwt.sign({ userId, type: "refresh" }, secret, { expiresIn: "7d" });
    return { accessToken, refreshToken };
  }

  verifyToken(token: string) {
    try {
      return jwt.verify(token, JWT_SECRET()) as { userId: number; type: string; iat: number; exp: number };
    } catch {
      return null;
    }
  }

  async createUser({ name, email, password, role = "founder", expertise = "" }: {
    name: string; email: string; password: string; role?: string; expertise?: string;
  }) {
    const normalizedEmail = email.toLowerCase().trim();
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) throw new Error("Email already registered");

    const passwordHash = this.hashPassword(password);
    const user = await prisma.user.create({
      data: { name, email: normalizedEmail, passwordHash, role: role as any, expertise },
    });

    const verificationToken = this.generateToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await prisma.emailVerificationToken.create({
      data: { userId: user.id, token: verificationToken, expiresAt },
    });

    logger.info({ email: normalizedEmail, verificationToken }, "User created - verification token");
    return user;
  }

  async verifyEmail(token: string) {
    const tokenRecord = await prisma.emailVerificationToken.findUnique({
      where: { token }, include: { user: true },
    });
    if (!tokenRecord) throw new Error("Invalid or expired verification token");
    if (tokenRecord.expiresAt < new Date()) {
      await prisma.emailVerificationToken.delete({ where: { id: tokenRecord.id } });
      throw new Error("Verification token expired");
    }
    await prisma.user.update({ where: { id: tokenRecord.userId }, data: { emailVerified: true, emailVerifiedAt: new Date() } });
    await prisma.emailVerificationToken.delete({ where: { id: tokenRecord.id } });
    return tokenRecord.user;
  }

  async requestPasswordReset(email: string) {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) return { message: "If the email exists, a reset link has been sent" };

    const resetToken = this.generateToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await prisma.passwordResetToken.updateMany({ where: { userId: user.id, usedAt: null }, data: { usedAt: new Date() } });
    await prisma.passwordResetToken.create({ data: { userId: user.id, token: resetToken, expiresAt } });

    logger.info({ email: normalizedEmail, resetToken }, "Password reset requested");
    return { message: "If the email exists, a reset link has been sent" };
  }

  async resetPassword(token: string, newPassword: string) {
    const tokenRecord = await prisma.passwordResetToken.findUnique({ where: { token }, include: { user: true } });
    if (!tokenRecord) throw new Error("Invalid or expired reset token");
    if (tokenRecord.usedAt) throw new Error("Reset token already used");
    if (tokenRecord.expiresAt < new Date()) {
      await prisma.passwordResetToken.delete({ where: { id: tokenRecord.id } });
      throw new Error("Reset token expired");
    }
    const passwordHash = this.hashPassword(newPassword);
    await prisma.user.update({ where: { id: tokenRecord.userId }, data: { passwordHash } });
    await prisma.passwordResetToken.update({ where: { id: tokenRecord.id }, data: { usedAt: new Date() } });
    return tokenRecord.user;
  }

  async createSession(userId: number, userAgent?: string, ipAddress?: string) {
    const refreshToken = this.generateToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const session = await prisma.session.create({
      data: { userId, refreshToken, userAgent, ipAddress, expiresAt },
    });
    return { session, refreshToken };
  }

  async refreshAccessToken(refreshToken: string) {
    const session = await prisma.session.findUnique({ where: { refreshToken }, include: { user: true } });
    if (!session) throw new Error("Invalid refresh token");
    if (session.revokedAt) throw new Error("Session revoked");
    if (session.expiresAt < new Date()) {
      await prisma.session.delete({ where: { id: session.id } });
      throw new Error("Session expired");
    }
    const tokens = this.generateTokens(session.userId);
    await prisma.session.update({ where: { id: session.id }, data: { expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } });
    return { user: session.user, accessToken: tokens.accessToken };
  }

  async revokeSession(sessionId: number, userId: number) {
    const session = await prisma.session.findUnique({ where: { id: sessionId } });
    if (!session) throw new Error("Session not found");
    if (session.userId !== userId) throw new Error("Unauthorized");
    await prisma.session.update({ where: { id: sessionId }, data: { revokedAt: new Date() } });
  }

  async getUserSessions(userId: number) {
    return prisma.session.findMany({
      where: { userId }, orderBy: { createdAt: "desc" },
      select: { id: true, userAgent: true, ipAddress: true, expiresAt: true, createdAt: true, revokedAt: true },
    });
  }

  async setupTwoFactorAuth(userId: number) {
    const secret = crypto.randomBytes(32).toString("base64");
    const backupCodes = Array.from({ length: 10 }, () => crypto.randomBytes(4).toString("hex"));
    await prisma.user.update({ where: { id: userId }, data: { twoFactorEnabled: false, twoFactorSecret: secret } });
    return { secret, backupCodes };
  }

  async enableTwoFactorAuth(userId: number, token: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("User not found");
    if (process.env.NODE_ENV === "production" && !user.twoFactorSecret) throw new Error("2FA not initialized");
    await prisma.user.update({ where: { id: userId }, data: { twoFactorEnabled: true } });
    return { message: "Two-factor authentication enabled" };
  }

  async verifyTwoFactorToken(userId: number, token: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.twoFactorEnabled) return false;
    return true;
  }
}

export const authService = new AuthService();
