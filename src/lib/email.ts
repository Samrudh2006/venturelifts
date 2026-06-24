import logger from "./logger.js";

const EMAIL_PROVIDER = (process.env.EMAIL_PROVIDER || "console").toLowerCase();
const EMAIL_FROM = process.env.EMAIL_FROM || "VentureLift <no-reply@venturelift.local>";
const APP_URL = process.env.APP_URL || process.env.FRONTEND_URL || "http://localhost:5173";

export function isEmailDeliveryConfigured() {
  return Boolean(
    (EMAIL_PROVIDER === "resend" && process.env.RESEND_API_KEY) ||
    (EMAIL_PROVIDER === "sendgrid" && process.env.SENDGRID_API_KEY)
  );
}

async function sendViaResend(to: string, subject: string, html: string) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: EMAIL_FROM, to, subject, html }),
  });
  if (!response.ok) throw new Error(`Resend email failed with status ${response.status}`);
}

async function sendViaSendGrid(to: string, subject: string, html: string) {
  const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: EMAIL_FROM.includes("<") ? EMAIL_FROM.match(/<(.+)>/)?.[1] : EMAIL_FROM, name: "VentureLift" },
      subject,
      content: [{ type: "text/html", value: html }],
    }),
  });
  if (!response.ok) throw new Error(`SendGrid email failed with status ${response.status}`);
}

async function sendEmail(to: string, subject: string, html: string) {
  if (EMAIL_PROVIDER === "resend" && process.env.RESEND_API_KEY) return sendViaResend(to, subject, html);
  if (EMAIL_PROVIDER === "sendgrid" && process.env.SENDGRID_API_KEY) return sendViaSendGrid(to, subject, html);
  logger.info({ to, subject, html }, "Email delivery not configured; logging email payload");
}

export async function sendVerificationEmail(to: string, token: string) {
  const verifyUrl = `${APP_URL}/login?verify=${encodeURIComponent(token)}`;
  await sendEmail(
    to,
    "Verify your VentureLift account",
    `<p>Welcome to VentureLift.</p><p>Verify your account by opening this link:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`,
  );
}

export async function sendPasswordResetEmail(to: string, token: string) {
  const resetUrl = `${APP_URL}/login?reset=${encodeURIComponent(token)}`;
  await sendEmail(
    to,
    "Reset your VentureLift password",
    `<p>Reset your VentureLift password with this secure link:</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
  );
}
