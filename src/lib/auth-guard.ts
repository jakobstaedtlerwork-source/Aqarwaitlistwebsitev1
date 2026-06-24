import { auth } from "./auth";
import { prisma } from "./prisma";
import { redirect } from "next/navigation";

export async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  return session;
}

export async function requireOnboarded() {
  const session = await requireAuth();
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { accountType: true },
  });
  if (!user?.accountType) {
    redirect("/onboarding");
  }
  return { session, accountType: user.accountType };
}

export async function requireLandlord() {
  const session = await requireAuth();
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { accountType: true },
  });

  // Treat null accountType as landlord for backward compatibility
  if (user?.accountType === "tenant") {
    redirect("/tenant/dashboard");
  }

  // If no accountType set, check if existing user from MVP 0.1
  if (!user?.accountType) {
    const membership = await prisma.userOrganization.findFirst({
      where: { userId: session.user.id },
    });
    if (!membership) {
      redirect("/onboarding");
    }
  }

  return requireOrg();
}

export async function requireOrg() {
  const session = await requireAuth();
  const userId = session.user.id;

  const membership = await prisma.userOrganization.findFirst({
    where: { userId },
    include: { organization: true },
    orderBy: { createdAt: "asc" },
  });

  if (!membership) {
    const org = await prisma.organization.create({
      data: {
        name: `${session.user.email?.split("@")[0] || "My"}'s Workspace`,
        members: {
          create: {
            userId,
            role: "owner",
          },
        },
      },
      include: { members: true },
    });
    return {
      session,
      userId,
      organizationId: org.id,
      organization: org,
      role: "owner" as const,
    };
  }

  return {
    session,
    userId,
    organizationId: membership.organizationId,
    organization: membership.organization,
    role: membership.role,
  };
}

export async function requireTenant() {
  const session = await requireAuth();
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { accountType: true },
  });

  if (user?.accountType !== "tenant") {
    redirect("/dashboard");
  }

  const userId = session.user.id;
  const membership = await prisma.userOrganization.findFirst({
    where: { userId },
    include: { organization: true },
  });

  return {
    session,
    userId,
    organizationId: membership?.organizationId ?? null,
    organization: membership?.organization ?? null,
    role: (membership?.role ?? "member") as "owner" | "member",
  };
}

export async function requireTenantWithProfile() {
  const ctx = await requireTenant();
  if (!ctx.organizationId) {
    return { ...ctx, tenant: null };
  }
  const tenant = await prisma.tenant.findFirst({
    where: { userId: ctx.userId, organizationId: ctx.organizationId },
  });
  return { ...ctx, tenant };
}
