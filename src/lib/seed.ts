import { authService } from "./auth.js";
import logger from "./logger.js";
import prisma from "./prisma.js";

const demoUsers = [
  { name: "Admin User", email: "admin@venturelift.local", password: "Admin@123", role: "admin" as const, expertise: "Platform operations" },
  { name: "Founder Demo", email: "founder@venturelift.local", password: "Founder@123", role: "founder" as const, expertise: "AI startups" },
  { name: "Mentor Demo", email: "mentor@venturelift.local", password: "Mentor@123", role: "mentor" as const, expertise: "Fundraising, product strategy" },
];

export async function seedDemoUsers() {
  if (process.env.SEED_DEMO_USERS === "false") return;
  if (process.env.NODE_ENV === "production" && process.env.SEED_DEMO_USERS !== "true") return;

  for (const demo of demoUsers) {
    const existing = await prisma.user.findUnique({ where: { email: demo.email } });
    if (existing) continue;
    await prisma.user.create({
      data: {
        name: demo.name,
        email: demo.email,
        passwordHash: authService.hashPassword(demo.password),
        role: demo.role,
        expertise: demo.expertise,
        emailVerified: true,
        emailVerifiedAt: new Date(),
      },
    });
  }
  logger.info("Demo users ensured for local login");
}
