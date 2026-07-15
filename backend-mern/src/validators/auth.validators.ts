import { z } from "zod";

export const signupSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.string().trim().toLowerCase().email("Enter a valid email."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email."),
  password: z.string().min(1, "Password is required."),
});

export const verifyOtpSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  code: z.string().trim().length(6, "Code must be 6 digits."),
});

export const resendOtpSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

export const updateRoleSchema = z.object({
  role: z.enum(["user", "manager"], { message: "Role must be 'user' or 'manager'." }),
});
