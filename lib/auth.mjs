import crypto from "node:crypto";
import jwt from "jsonwebtoken";

export class AuthService {
  constructor(prisma) {
    this.prisma = prisma;
  }

  // Generate secure random token
  generateToken(length = 32) {
    return crypto.randomBytes(length).toString("hex");
  }

  // Hash password with salt
  hashPassword(password) {
    const salt = crypto.randomBytes(16);
    const hash = crypto.scryptSync(password, salt, 64);
    return `${salt.toString("hex")}:${hash.toString("hex")}`;
  }

  // Verify password against stored hash
  verifyPassword(password, stored) {
    const [salt, hash] = stored.split(":");
    if (!salt || !hash) return false;
    const expected = crypto.scryptSync(password, Buffer.from(salt, "hex"), 64);
    return crypto.timingSafeEqual(Buffer.from(hash, "hex"), expected);
  }

  // Generate JWT access token (15 min) and refresh token (7 days)
  generateTokens(userId) {
    const secret = process.env.JWT_SECRET || "venturelift-local-dev-secret";
    if (secret.length < 32) {
      throw new Error("JWT_SECRET must be at least 32 characters long");
    }

    const accessToken = jwt.sign(
      { userId, type: "access" },
      secret,
      { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
      { userId, type: "refresh" },
      secret,
      { expiresIn: "7d" }
    );

    return { accessToken, refreshToken };
  }

  // Verify JWT token
  verifyToken(token) {
    try {
      const secret = process.env.JWT_SECRET || "venturelift-local-dev-secret";
      return jwt.verify(token, secret);
    } catch (error) {
      return null;
    }
  }

  // Rate limiting key generator
  getRateLimitKey(identifier, endpoint) {
    return `${identifier}:${endpoint}`;
  }

  // Check if request is rate limited (implement in middleware)
  async checkRateLimit(key, limit = 5, windowMs = 300000) {
    // This would be implemented with Redis or database
    // For now, return false (not rate limited)
    return false;
  }

  // Create user with email verification
  async createUser({ name, email, password, role = "founder", expertise = "" }) {
    const normalizedEmail = email.toLowerCase().trim();
    const existing = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      throw new Error("Email already registered");
    }

    const passwordHash = this.hashPassword(password);
    const verificationToken = this.generateToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user
    const user = await this.prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        passwordHash,
        role,
        expertise,
        emailVerified: false,
      },
    });

    // Create email verification token
    await this.prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        token: verificationToken,
        expiresAt,
      },
    });

    // In production: send verification email via SendGrid, AWS SES, etc.
    console.log(`Email verification: ${normalizedEmail}\nToken: ${verificationToken}\nExpires: ${expiresAt.toISOString()}`);

    return user;
  }

  // Verify email with token
  async verifyEmail(token) {
    const tokenRecord = await this.prisma.emailVerificationToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!tokenRecord) {
      throw new Error("Invalid or expired verification token");
    }

    if (tokenRecord.expiresAt < new Date()) {
      await this.prisma.emailVerificationToken.delete({ where: { id: tokenRecord.id } });
      throw new Error("Verification token expired");
    }

    // Update user and clean up token
    await this.prisma.user.update({
      where: { id: tokenRecord.userId },
      data: { emailVerified: true, emailVerifiedAt: new Date() },
    });

    await this.prisma.emailVerificationToken.delete({ where: { id: tokenRecord.id } });

    return tokenRecord.user;
  }

  // Request password reset
  async requestPasswordReset(email) {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      // Don't reveal if email exists
      return { message: "If the email exists, a reset link has been sent" };
    }

    const resetToken = this.generateToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Invalidate previous reset tokens
    await this.prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    // Create new reset token
    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token: resetToken,
        expiresAt,
      },
    });

    // In production: send reset email with token
    console.log(`Password reset: ${normalizedEmail}\nToken: ${resetToken}\nExpires: ${expiresAt.toISOString()}`);

    return { message: "If the email exists, a reset link has been sent" };
  }

  // Reset password with token
  async resetPassword(token, newPassword) {
    const tokenRecord = await this.prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!tokenRecord) {
      throw new Error("Invalid or expired reset token");
    }

    if (tokenRecord.usedAt) {
      throw new Error("Reset token already used");
    }

    if (tokenRecord.expiresAt < new Date()) {
      await this.prisma.passwordResetToken.delete({ where: { id: tokenRecord.id } });
      throw new Error("Reset token expired");
    }

    // Update password and mark token as used
    const passwordHash = this.hashPassword(newPassword);
    await this.prisma.user.update({
      where: { id: tokenRecord.userId },
      data: { passwordHash },
    });

    await this.prisma.passwordResetToken.update({
      where: { id: tokenRecord.id },
      data: { usedAt: new Date() },
    });

    return tokenRecord.user;
  }

  // Create session with refresh token
  async createSession(userId, userAgent, ipAddress) {
    const refreshToken = this.generateToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const session = await this.prisma.session.create({
      data: {
        userId,
        refreshToken,
        userAgent,
        ipAddress,
        expiresAt,
      },
    });

    return { session, refreshToken };
  }

  // Validate refresh token and get new access token
  async refreshAccessToken(refreshToken) {
    const session = await this.prisma.session.findUnique({
      where: { refreshToken },
      include: { user: true },
    });

    if (!session) {
      throw new Error("Invalid refresh token");
    }

    if (session.revokedAt) {
      throw new Error("Session revoked");
    }

    if (session.expiresAt < new Date()) {
      await this.prisma.session.delete({ where: { id: session.id } });
      throw new Error("Session expired");
    }

    // Generate new tokens
    const tokens = this.generateTokens(session.userId);

    // Extend session
    await this.prisma.session.update({
      where: { id: session.id },
      data: { expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    });

    return { user: session.user, accessToken: tokens.accessToken };
  }

  // Revoke session
  async revokeSession(sessionId, userId) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new Error("Session not found");
    }

    if (session.userId !== userId) {
      throw new Error("Unauthorized");
    }

    await this.prisma.session.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });

    return { message: "Session revoked" };
  }

  // Get all user sessions
  async getUserSessions(userId) {
    return this.prisma.session.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        userAgent: true,
        ipAddress: true,
        expiresAt: true,
        createdAt: true,
        revokedAt: true,
      },
    });
  }

  // Generate and store TOTP secret for 2FA
  async setupTwoFactorAuth(userId) {
    const secret = crypto.randomBytes(32).toString("base64");
    const backupCodes = Array.from({ length: 10 }, () => crypto.randomBytes(4).toString("hex"));

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false, // Requires verification
        twoFactorSecret: secret,
      },
    });

    return { secret, backupCodes };
  }

  // Verify TOTP and enable 2FA
  async enableTwoFactorAuth(userId, token, backupCodes) {
    // TODO: Verify TOTP using authenticator apps
    // For now, just enable
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: true,
        twoFactorSecret: null, // Clear after verification
      },
    });

    return { message: "Two-factor authentication enabled" };
  }
}