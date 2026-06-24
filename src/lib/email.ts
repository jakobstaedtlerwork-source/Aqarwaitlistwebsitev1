import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const from = process.env.EMAIL_FROM || "noreply@aqar.dev";
const appUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

async function sendEmail(to: string, subject: string, html: string) {
  if (!resend) {
    console.log(`[DEV EMAIL] To: ${to}, Subject: ${subject}`);
    console.log(html);
    return;
  }
  await resend.emails.send({ from, to, subject, html });
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const url = `${appUrl}/reset-password?token=${token}`;
  await sendEmail(
    email,
    "Reset your AQAR password",
    `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #111;">Password Reset</h2>
      <p>Click the link below to reset your password. This link expires in 1 hour.</p>
      <a href="${url}" style="display: inline-block; background: #111; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Reset Password</a>
      <p style="color: #666; font-size: 14px; margin-top: 24px;">If you didn't request this, you can safely ignore this email.</p>
    </div>
  `
  );
}

export async function sendTenantInvitationEmail(
  email: string,
  token: string,
  orgName: string
) {
  const url = `${appUrl}/invite/accept?token=${token}`;
  await sendEmail(
    email,
    `You've been invited to ${orgName} on AQAR`,
    `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #111;">Tenant Invitation</h2>
      <p>You've been invited to manage your tenancy at <strong>${orgName}</strong>.</p>
      <a href="${url}" style="display: inline-block; background: #111; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Accept Invitation</a>
      <p style="color: #666; font-size: 14px; margin-top: 24px;">This invitation expires in 7 days.</p>
    </div>
  `
  );
}

export async function sendDocumentExpiryReminder(
  email: string,
  docTitle: string,
  expiryDate: Date
) {
  const formattedDate = expiryDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  await sendEmail(
    email,
    `Document expiring soon: ${docTitle}`,
    `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #111;">Document Expiring Soon</h2>
      <p>Your document <strong>${docTitle}</strong> is expiring on <strong>${formattedDate}</strong>.</p>
      <a href="${appUrl}/tenant/documents" style="display: inline-block; background: #111; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px;">View Documents</a>
    </div>
  `
  );
}

export async function sendRentDueReminder(
  email: string,
  amount: number,
  dueDate: Date
) {
  const formattedDate = dueDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  await sendEmail(
    email,
    "Rent payment due soon",
    `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #111;">Rent Payment Due</h2>
      <p>Your rent payment of <strong>AED ${amount.toLocaleString()}</strong> is due on <strong>${formattedDate}</strong>.</p>
      <a href="${appUrl}/tenant/dashboard" style="display: inline-block; background: #111; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px;">View Dashboard</a>
    </div>
  `
  );
}
