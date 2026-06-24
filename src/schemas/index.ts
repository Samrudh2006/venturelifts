import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email").transform(e => e.toLowerCase().trim()),
  password: z.string().min(6, "Password must be at least 6 characters").max(128),
  role: z.enum(["founder", "mentor"]).optional().default("founder"),
  expertise: z.string().max(200).optional().default(""),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email").transform(e => e.toLowerCase().trim()),
  password: z.string().min(1, "Password is required"),
});

export const ventureSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  founder: z.string().min(1, "Founder name is required").max(100),
  sector: z.string().min(1, "Sector is required").max(100),
  stage: z.enum(["Idea", "Prototype", "MVP", "Pilot", "Revenue"]),
  problem: z.string().min(1, "Problem is required").max(2000),
  solution: z.string().min(1, "Solution is required").max(2000),
  customer: z.string().min(1, "Customer is required").max(1000),
  traction: z.string().min(1, "Traction is required").max(500),
  goals: z.string().min(1, "Goals are required").max(500),
});

export const emailVerificationSchema = z.object({
  token: z.string().min(1, "Token is required"),
});

export const passwordResetRequestSchema = z.object({
  email: z.string().email("Invalid email"),
});

export const passwordResetSchema = z.object({
  token: z.string().min(1, "Token is required"),
  newPassword: z.string().min(6, "Password must be at least 6 characters").max(128),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

export const sessionRevokeSchema = z.object({
  sessionId: z.number().int().positive("Valid session ID is required"),
});

export const nlpSchema = z.object({
  text: z.string().min(1, "Text is required").max(10000),
  venture_id: z.number().int().optional(),
});

export const faqSchema = z.object({
  question: z.string().min(1, "Question is required").max(1000),
});

export const suggestionSchema = z.object({
  message: z.string().min(1, "Message is required").max(2000),
  venture: z.object({
    id: z.number().int().optional(),
    name: z.string().optional(),
    sector: z.string().optional(),
    stage: z.string().optional(),
    problem: z.string().optional(),
    solution: z.string().optional(),
    customer: z.string().optional(),
    traction: z.string().optional(),
    goals: z.string().optional(),
  }).optional(),
});

export const roadmapSchema = z.object({
  venture: z.object({
    id: z.number().int().optional(),
    name: z.string().optional(),
    sector: z.string().optional(),
    stage: z.string().optional(),
    problem: z.string().optional(),
    solution: z.string().optional(),
    customer: z.string().optional(),
    traction: z.string().optional(),
    goals: z.string().optional(),
  }),
  score: z.number().min(0).max(100),
});

export const validateSchema = z.object({
  venture: z.object({
    id: z.number().int().optional(),
    name: z.string(),
    sector: z.string(),
    stage: z.string(),
    problem: z.string(),
    solution: z.string(),
    customer: z.string(),
    traction: z.string(),
    goals: z.string(),
  }),
});

export const cnnPredictSchema = z.object({
  image_base64: z.string().min(1, "Image data is required"),
});

export const twoFactorSetupSchema = z.object({});

export const twoFactorVerifySchema = z.object({
  token: z.string().min(1, "Token is required"),
});

export const twoFactorEnableSchema = z.object({
  token: z.string().min(1, "Token is required"),
  backupCodes: z.array(z.string()).optional(),
});
