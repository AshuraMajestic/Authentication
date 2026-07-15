import nodemailer, { type Transporter } from "nodemailer";
import { env, isProd } from "../config/env.js";

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT ?? 587,
      secure: env.SMTP_PORT === 465,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    });
  }
  return transporter;
}

export async function sendOtpEmail(to: string, code: string, purpose: "login" | "signup") {
  const subject =
    purpose === "signup" ? "Confirm your SecureGate account" : "Your SecureGate sign-in code";
  const body = `Your one-time code is ${code}. It expires in ${env.OTP_TTL_MINUTES} minutes. If you didn't request this, you can ignore this email.`;

  const client = getTransporter();

  if (!client) {
    console.log(`[mailer] (no SMTP configured) OTP for ${to}: ${code}`);
    return;
  }

  await client.sendMail({
    from: env.MAIL_FROM,
    to,
    subject,
    text: body,
  });
}

export function canEchoOtpInResponse(): boolean {
  return !isProd && !getTransporter();
}
