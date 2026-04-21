import { z } from "zod";
import type { Request, Response, NextFunction } from "express";

const emailSchema = z.string().trim().toLowerCase().email("Invalid email address").max(254);

export const ContactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name too long"),
  email: emailSchema,
  subject: z.string().trim().min(1, "Subject is required").max(200, "Subject too long"),
  message: z.string().trim().min(1, "Message is required").max(5000, "Message too long"),
});

export const AuthLoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required").max(200),
}).strict();

export const AuthRegisterSchema = z.object({
  email: emailSchema,
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
}).strict();

export const AuthCheckEmailSchema = z.object({
  email: emailSchema,
});

export const AuthSendVerificationSchema = z.object({
  email: emailSchema,
});

export const AuthVerifyCodeSchema = z.object({
  email: emailSchema,
  code: z.string().trim().min(1, "Code is required").max(10),
});

export const AuthResetPasswordSchema = z.object({
  email: emailSchema,
  code: z.string().trim().min(1, "Code is required").max(10),
  newPassword: z.string().min(8, "Password must be at least 8 characters").max(200),
});

export const AdminLoginSchema = z.object({
  username: z.string().min(1, "Username is required").max(100),
  password: z.string().min(1, "Password is required").max(200),
});

export const AdminEmailSchema = z.object({
  email: emailSchema,
  adminNote: z.string().max(1000).optional(),
});

export const AdminRejectSchema = z.object({
  email: emailSchema,
  reason: z.string().trim().min(1, "Reject reason is required").max(1000),
  adminNote: z.string().max(1000).optional(),
});

export const AdminResubmitSchema = z.object({
  email: emailSchema,
  fields: z.array(z.string().max(200)).optional(),
  adminNote: z.string().max(1000).optional(),
});

export const AdminCreateUserSchema = z.object({
  email: emailSchema,
  displayName: z.string().trim().min(1, "Display name is required").max(100),
  role: z.string().max(50).optional().default("user"),
});

export const AdminUpdateUserSchema = z.object({
  email: emailSchema,
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  adminNote: z.string().max(1000).optional(),
});

export const AdminAssignRoleSchema = z.object({
  email: emailSchema,
  role: z.string().min(1, "Role is required").max(50),
  adminNote: z.string().max(1000).optional(),
});

export const AdminBanSchema = z.object({
  email: emailSchema,
  reason: z.string().max(1000).optional(),
  adminNote: z.string().max(1000).optional(),
});

export const AdminSetBalanceSchema = z.object({
  email: emailSchema,
  balance: z.number({ coerce: true }).min(0, "Balance cannot be negative"),
  profit: z.number({ coerce: true }),
  adminNote: z.string().trim().min(1, "Admin note is required for balance changes").max(1000),
  transactionType: z.string().max(50).optional(),
});

export const SignupSaveStepSchema = z.object({
  email: emailSchema,
  step: z.string().min(1).max(100),
  data: z.record(z.unknown()),
});

export const SignupCompleteStepSchema = z.object({
  email: emailSchema,
  stepNumber: z.number().int().min(0).max(20),
  stepKey: z.string().min(1).max(100),
  data: z.record(z.unknown()),
});

export const SignupGetProgressSchema = z.object({
  email: emailSchema,
});

export const UploadDocumentSchema = z.object({
  email: emailSchema,
  role: z.string().min(1).max(100),
});

export const ProfileUpdateSchema = z.object({
  email: emailSchema,
  firstName: z.string().max(50).regex(/^[a-zA-Z\s'-]*$/, "Invalid name format").optional(),
  lastName: z.string().max(50).regex(/^[a-zA-Z\s'-]*$/, "Invalid name format").optional(),
  phone: z.string().max(20).regex(/^[0-9()+\-.\s]*$/, "Invalid phone format").optional(),
  country: z.string().max(100).regex(/^[a-zA-Z0-9\s'-]*$/, "Invalid format").optional(),
  state: z.string().max(100).regex(/^[a-zA-Z0-9\s'-]*$/, "Invalid format").optional(),
  city: z.string().max(100).regex(/^[a-zA-Z0-9\s'-]*$/, "Invalid format").optional(),
});

export const ChangePasswordSchema = z.object({
  email: emailSchema,
  currentPassword: z.string().min(1).max(200),
  newPassword: z.string().min(8, "New password must be at least 8 characters").max(200),
});

export const NotificationReadSchema = z.object({
  email: emailSchema,
  ids: z.array(z.string().max(100)).optional(),
});

export const NotificationPrefsSchema = z.object({
  email: emailSchema,
  preferences: z.record(z.boolean()),
});

export const TwoFATokenSchema = z.object({
  email: emailSchema,
  token: z.string().min(1, "Token is required").max(20),
});

export const TwoFADisableSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required").max(200),
  token: z.string().min(1, "Token is required").max(20),
});

export const AiChatSchema = z.object({
  email: emailSchema,
  message: z.string().min(1, "Message is required").max(10000),
});

export const FraudRiskSchema = z.object({
  email: emailSchema,
});

export const KycResubmitSchema = z.object({
  email: emailSchema,
  data: z.record(z.record(z.unknown())).optional(),
});

export const FundRequestSchema = z.object({
  email: emailSchema,
  type: z.enum(["deposit", "withdrawal"]),
  amount: z.number({ coerce: true }).positive("Amount must be positive").max(10_000_000, "Amount exceeds limit"),
  note: z.string().trim().max(500).optional(),
}).strict();

export const OrderSubmitSchema = z.object({
  email: emailSchema,
  symbol: z.string().trim().min(1).max(10),
  side: z.enum(["Buy", "Sell"]),
  type: z.enum(["Market", "Limit", "Stop", "Stop Limit"]),
  qty: z.number({ coerce: true }).positive("Quantity must be positive"),
  price: z.number({ coerce: true }).positive().optional(),
}).strict();

export const AdminFundRequestActionSchema = z.object({
  adminNote: z.string().trim().max(500).optional(),
}).strict();

export function validate<T extends z.ZodSchema>(schema: T) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const source = ["GET", "HEAD"].includes(req.method) ? req.query : req.body;
    const result = schema.safeParse(source);
    if (!result.success) {
      const firstError = result.error.errors[0];
      const message = firstError
        ? `${firstError.path.join(".")}: ${firstError.message}`.replace(/^:\s*/, "")
        : "Invalid input";
      console.warn(`[Validation] Rejected ${req.method} ${req.path} — ${message} — IP: ${req.ip ?? "unknown"}`);
      res.status(400).json({ error: message });
      return;
    }
    if (["GET", "HEAD"].includes(req.method)) {
      (req as Request & { validatedQuery: z.infer<T> }).validatedQuery = result.data;
    } else {
      req.body = result.data;
    }
    next();
  };
}
