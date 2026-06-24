"use server";

import { prisma } from "./prisma";
import { requireAuth } from "./auth-guard";
import { hashPassword, verifyPassword } from "./password";
import { sendPasswordResetEmail } from "./email";
import { signupSchema, forgotPasswordSchema, changePasswordSchema } from "./validators";
import crypto from "crypto";

// ─── Sign Up ───

export async function signUpAction(formData: FormData) {
  const data = signupSchema.parse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  const email = data.email.toLowerCase().trim();

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return { error: "An account with this email already exists" };
  }

  const passwordHash = await hashPassword(data.password);

  await prisma.user.create({
    data: {
      name: data.name,
      email,
      passwordHash,
      emailVerified: new Date(), // Skip email verification for MVP
    },
  });

  return { success: true };
}

// ─── Forgot Password ───

export async function forgotPasswordAction(formData: FormData) {
  const data = forgotPasswordSchema.parse({
    email: formData.get("email"),
  });

  const email = data.email.toLowerCase().trim();

  // Always return success to prevent email enumeration
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { success: true };
  }

  // Delete any existing reset tokens for this user
  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

  // Generate token with 1-hour expiry
  const token = crypto.randomUUID();
  await prisma.passwordResetToken.create({
    data: {
      token,
      userId: user.id,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    },
  });

  await sendPasswordResetEmail(email, token);

  return { success: true };
}

// ─── Reset Password ───

export async function resetPasswordAction(formData: FormData) {
  const token = formData.get("token") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!token) {
    return { error: "Invalid reset link" };
  }

  if (!password || password.length < 8) {
    return { error: "Password must be at least 8 characters" };
  }

  if (password !== confirmPassword) {
    return { error: "Passwords don't match" };
  }

  // Find token
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
  });

  if (!resetToken) {
    return { error: "Invalid or expired reset link" };
  }

  if (resetToken.expiresAt < new Date()) {
    await prisma.passwordResetToken.delete({ where: { id: resetToken.id } });
    return { error: "Reset link has expired. Please request a new one." };
  }

  // Hash and update password
  const passwordHash = await hashPassword(password);
  await prisma.user.update({
    where: { id: resetToken.userId },
    data: { passwordHash },
  });

  // Delete the token
  await prisma.passwordResetToken.delete({ where: { id: resetToken.id } });

  return { success: true };
}

// ─── Set Account Type (Onboarding) ───

export async function setAccountTypeAction(accountType: "landlord" | "tenant") {
  const session = await requireAuth();
  const userId = session.user.id;

  // Update user's account type
  await prisma.user.update({
    where: { id: userId },
    data: { accountType },
  });

  // If landlord, create an organization
  if (accountType === "landlord") {
    const existingMembership = await prisma.userOrganization.findFirst({
      where: { userId },
    });

    if (!existingMembership) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });

      await prisma.organization.create({
        data: {
          name: `${user?.email?.split("@")[0] || "My"}'s Workspace`,
          members: {
            create: {
              userId,
              role: "owner",
            },
          },
        },
      });
    }
  }

  return { success: true, accountType };
}

// ─── Change Password ───

export async function changePasswordAction(formData: FormData) {
  const session = await requireAuth();

  const data = changePasswordSchema.parse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { passwordHash: true },
  });

  if (!user?.passwordHash) {
    return { error: "Cannot change password for social login accounts" };
  }

  const valid = await verifyPassword(data.currentPassword, user.passwordHash);
  if (!valid) {
    return { error: "Current password is incorrect" };
  }

  const passwordHash = await hashPassword(data.newPassword);
  await prisma.user.update({
    where: { id: session.user.id },
    data: { passwordHash },
  });

  return { success: true };
}
