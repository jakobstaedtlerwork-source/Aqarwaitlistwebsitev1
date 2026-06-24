"use server";

import { prisma } from "./prisma";
import { requireOrg, requireAuth } from "./auth-guard";
import { revalidatePath } from "next/cache";
import {
  propertySchema,
  unitSchema,
  tenantSchema,
  leaseSchema,
  taskSchema,
  organizationSchema,
  tenantInvitationSchema,
  rentScheduleSchema,
} from "./validators";
import { sendTenantInvitationEmail } from "./email";
import { createAuditLog } from "./audit";
import crypto from "crypto";

// ─── Properties ───

export async function createProperty(formData: FormData) {
  const { organizationId } = await requireOrg();
  const data = propertySchema.parse({
    name: formData.get("name"),
    addressLine1: formData.get("addressLine1"),
    city: formData.get("city"),
    country: formData.get("country"),
    notes: formData.get("notes") || null,
  });

  await prisma.property.create({
    data: { ...data, organizationId },
  });

  revalidatePath("/properties");
}

export async function updateProperty(id: string, formData: FormData) {
  const { organizationId } = await requireOrg();
  const data = propertySchema.parse({
    name: formData.get("name"),
    addressLine1: formData.get("addressLine1"),
    city: formData.get("city"),
    country: formData.get("country"),
    notes: formData.get("notes") || null,
  });

  await prisma.property.update({
    where: { id, organizationId },
    data,
  });

  revalidatePath(`/properties/${id}`);
  revalidatePath("/properties");
}

export async function deleteProperty(id: string) {
  const { organizationId } = await requireOrg();
  await prisma.property.delete({
    where: { id, organizationId },
  });
  revalidatePath("/properties");
}

// ─── Units ───

export async function createUnit(formData: FormData) {
  const { organizationId } = await requireOrg();
  const data = unitSchema.parse({
    name: formData.get("name"),
    propertyId: formData.get("propertyId"),
    sizeSqm: formData.get("sizeSqm") || null,
    bedrooms: formData.get("bedrooms") || null,
    bathrooms: formData.get("bathrooms") || null,
    status: formData.get("status") || "vacant",
  });

  // Verify property belongs to org
  const property = await prisma.property.findFirst({
    where: { id: data.propertyId, organizationId },
  });
  if (!property) throw new Error("Property not found");

  await prisma.unit.create({ data });
  revalidatePath(`/properties/${data.propertyId}`);
}

export async function updateUnit(id: string, formData: FormData) {
  const { organizationId } = await requireOrg();
  const data = unitSchema.parse({
    name: formData.get("name"),
    propertyId: formData.get("propertyId"),
    sizeSqm: formData.get("sizeSqm") || null,
    bedrooms: formData.get("bedrooms") || null,
    bathrooms: formData.get("bathrooms") || null,
    status: formData.get("status") || "vacant",
  });

  const unit = await prisma.unit.findFirst({
    where: { id },
    include: { property: true },
  });
  if (!unit || unit.property.organizationId !== organizationId) {
    throw new Error("Unit not found");
  }

  await prisma.unit.update({ where: { id }, data });
  revalidatePath(`/properties/${data.propertyId}`);
  revalidatePath(`/units/${id}`);
}

export async function deleteUnit(id: string) {
  const { organizationId } = await requireOrg();
  const unit = await prisma.unit.findFirst({
    where: { id },
    include: { property: true },
  });
  if (!unit || unit.property.organizationId !== organizationId) {
    throw new Error("Unit not found");
  }

  await prisma.unit.delete({ where: { id } });
  revalidatePath(`/properties/${unit.propertyId}`);
}

// ─── Tenants ───

export async function createTenant(formData: FormData) {
  const { organizationId } = await requireOrg();
  const data = tenantSchema.parse({
    fullName: formData.get("fullName"),
    email: formData.get("email") || null,
    phone: formData.get("phone") || null,
    notes: formData.get("notes") || null,
  });

  const tenant = await prisma.tenant.create({
    data: { ...data, email: data.email || null, organizationId },
  });

  revalidatePath("/tenants");
  return tenant;
}

export async function updateTenant(id: string, formData: FormData) {
  const { organizationId } = await requireOrg();
  const data = tenantSchema.parse({
    fullName: formData.get("fullName"),
    email: formData.get("email") || null,
    phone: formData.get("phone") || null,
    notes: formData.get("notes") || null,
  });

  await prisma.tenant.update({
    where: { id, organizationId },
    data: { ...data, email: data.email || null },
  });

  revalidatePath(`/tenants/${id}`);
  revalidatePath("/tenants");
}

export async function deleteTenant(id: string) {
  const { organizationId } = await requireOrg();
  await prisma.tenant.delete({
    where: { id, organizationId },
  });
  revalidatePath("/tenants");
}

// ─── Leases ───

export async function createLease(formData: FormData) {
  const { organizationId } = await requireOrg();
  const data = leaseSchema.parse({
    unitId: formData.get("unitId"),
    tenantId: formData.get("tenantId"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate") || null,
    rentAmount: formData.get("rentAmount") || null,
    rentCurrency: formData.get("rentCurrency") || "AED",
    depositAmount: formData.get("depositAmount") || null,
    status: formData.get("status") || "draft",
  });

  // Verify unit belongs to org
  const unit = await prisma.unit.findFirst({
    where: { id: data.unitId },
    include: { property: true },
  });
  if (!unit || unit.property.organizationId !== organizationId) {
    throw new Error("Unit not found");
  }

  // Verify tenant belongs to org
  const tenant = await prisma.tenant.findFirst({
    where: { id: data.tenantId, organizationId },
  });
  if (!tenant) throw new Error("Tenant not found");

  const lease = await prisma.lease.create({ data });

  // Update unit status if lease is active
  if (data.status === "active") {
    await prisma.unit.update({
      where: { id: data.unitId },
      data: { status: "occupied" },
    });
  }

  revalidatePath(`/units/${data.unitId}`);
  revalidatePath(`/properties/${unit.propertyId}`);
  revalidatePath(`/tenants/${data.tenantId}`);

  return lease;
}

export async function updateLeaseStatus(id: string, status: "active" | "ended" | "draft") {
  const { organizationId } = await requireOrg();
  const lease = await prisma.lease.findFirst({
    where: { id },
    include: { unit: { include: { property: true } } },
  });
  if (!lease || lease.unit.property.organizationId !== organizationId) {
    throw new Error("Lease not found");
  }

  await prisma.lease.update({ where: { id }, data: { status } });

  if (status === "ended") {
    // Check if unit has any other active leases
    const activeLeases = await prisma.lease.count({
      where: { unitId: lease.unitId, status: "active", id: { not: id } },
    });
    if (activeLeases === 0) {
      await prisma.unit.update({
        where: { id: lease.unitId },
        data: { status: "vacant" },
      });
    }
  } else if (status === "active") {
    await prisma.unit.update({
      where: { id: lease.unitId },
      data: { status: "occupied" },
    });
  }

  revalidatePath(`/units/${lease.unitId}`);
  revalidatePath(`/properties/${lease.unit.propertyId}`);
}

// ─── Tasks ───

export async function createTask(formData: FormData) {
  const { organizationId } = await requireOrg();
  const data = taskSchema.parse({
    title: formData.get("title"),
    description: formData.get("description") || null,
    status: formData.get("status") || "open",
    dueDate: formData.get("dueDate") || null,
    propertyId: formData.get("propertyId") || null,
    unitId: formData.get("unitId") || null,
    tenantId: formData.get("tenantId") || null,
    leaseId: formData.get("leaseId") || null,
  });

  await prisma.task.create({
    data: { ...data, organizationId },
  });

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
}

export async function updateTaskStatus(id: string, status: "open" | "in_progress" | "done") {
  const { organizationId } = await requireOrg();
  await prisma.task.update({
    where: { id, organizationId },
    data: { status },
  });
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
}

export async function deleteTask(id: string) {
  const { organizationId } = await requireOrg();
  await prisma.task.delete({
    where: { id, organizationId },
  });
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
}

// ─── Organization ───

export async function updateOrganization(formData: FormData) {
  const { organizationId } = await requireOrg();
  const data = organizationSchema.parse({
    name: formData.get("name"),
  });

  await prisma.organization.update({
    where: { id: organizationId },
    data,
  });

  revalidatePath("/settings");
}

// ─── Tenant Invitations ───

export async function inviteTenant(formData: FormData) {
  const { organizationId, organization } = await requireOrg();
  const data = tenantInvitationSchema.parse({
    email: formData.get("email"),
    unitId: formData.get("unitId"),
  });

  // Verify unit belongs to org
  const unit = await prisma.unit.findFirst({
    where: { id: data.unitId },
    include: { property: true },
  });
  if (!unit || unit.property.organizationId !== organizationId) {
    throw new Error("Unit not found");
  }

  // Check for existing pending invitation
  const existing = await prisma.tenantInvitation.findFirst({
    where: { email: data.email, unitId: data.unitId, status: "pending" },
  });
  if (existing) throw new Error("Invitation already sent to this email for this unit");

  const token = crypto.randomUUID();

  await prisma.tenantInvitation.create({
    data: {
      organizationId,
      unitId: data.unitId,
      email: data.email,
      token,
    },
  });

  await sendTenantInvitationEmail(data.email, token, organization.name);

  revalidatePath("/invite");

  // Return the invite link so it can be shown in the UI (especially in dev without email)
  const appUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  return { inviteUrl: `${appUrl}/invite/accept?token=${token}` };
}

export async function acceptInvitation(token: string) {
  const session = await requireAuth();

  const invitation = await prisma.tenantInvitation.findUnique({
    where: { token },
    include: { organization: true, unit: true },
  });

  if (!invitation || invitation.status !== "pending") {
    throw new Error("Invalid or expired invitation");
  }

  // Check expiry (7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  if (invitation.createdAt < sevenDaysAgo) {
    await prisma.tenantInvitation.update({
      where: { id: invitation.id },
      data: { status: "expired" },
    });
    throw new Error("Invitation has expired");
  }

  // Set accountType to tenant
  await prisma.user.update({
    where: { id: session.user.id },
    data: { accountType: "tenant" },
  });

  // Create org membership
  await prisma.userOrganization.upsert({
    where: {
      userId_organizationId: {
        userId: session.user.id,
        organizationId: invitation.organizationId,
      },
    },
    create: {
      userId: session.user.id,
      organizationId: invitation.organizationId,
      role: "member",
    },
    update: {},
  });

  // Find or create Tenant record, link to user
  let tenant = await prisma.tenant.findFirst({
    where: {
      email: session.user.email!,
      organizationId: invitation.organizationId,
    },
  });

  if (tenant) {
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: { userId: session.user.id },
    });
  } else {
    tenant = await prisma.tenant.create({
      data: {
        organizationId: invitation.organizationId,
        fullName: session.user.name || session.user.email!.split("@")[0],
        email: session.user.email,
        userId: session.user.id,
      },
    });
  }

  // Update invitation status
  await prisma.tenantInvitation.update({
    where: { id: invitation.id },
    data: { status: "accepted" },
  });
}

// ─── Maintenance Requests ───

export async function updateMaintenanceStatus(
  id: string,
  status: "open" | "in_progress" | "waiting_for_tenant" | "resolved"
) {
  const { organizationId, userId } = await requireOrg();
  const oldRequest = await prisma.maintenanceRequest.findFirst({
    where: { id, organizationId },
  });
  if (!oldRequest) throw new Error("Maintenance request not found");

  await prisma.maintenanceRequest.update({
    where: { id, organizationId },
    data: { status },
  });

  await createAuditLog({
    organizationId,
    userId,
    action: "maintenance_status_changed",
    entityType: "maintenance",
    entityId: id,
    metadata: { oldStatus: oldRequest.status, newStatus: status },
  });

  revalidatePath("/maintenance");
}

// ─── Rent Schedule & Payments ───

export async function createRentSchedule(formData: FormData) {
  const { organizationId, userId } = await requireOrg();
  const data = rentScheduleSchema.parse({
    leaseId: formData.get("leaseId"),
    totalYearlyRent: formData.get("totalYearlyRent"),
    numberOfCheques: formData.get("numberOfCheques"),
  });

  // Verify lease belongs to org
  const lease = await prisma.lease.findFirst({
    where: { id: data.leaseId },
    include: { unit: { include: { property: true } } },
  });
  if (!lease || lease.unit.property.organizationId !== organizationId) {
    throw new Error("Lease not found");
  }

  // Create schedule and auto-generate payments
  const chequeAmount = data.totalYearlyRent / data.numberOfCheques;
  const monthsBetween = 12 / data.numberOfCheques;

  const schedule = await prisma.rentSchedule.create({
    data: {
      leaseId: data.leaseId,
      totalYearlyRent: data.totalYearlyRent,
      numberOfCheques: data.numberOfCheques,
    },
  });

  // Generate payment records
  const startDate = lease.startDate;
  for (let i = 0; i < data.numberOfCheques; i++) {
    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + i * monthsBetween);

    await prisma.rentPayment.create({
      data: {
        rentScheduleId: schedule.id,
        sequenceNumber: i + 1,
        amount: chequeAmount,
        dueDate,
        status: "upcoming",
      },
    });
  }

  await createAuditLog({
    organizationId,
    userId,
    action: "payment_created",
    entityType: "rent_schedule",
    entityId: schedule.id,
    metadata: {
      totalYearlyRent: data.totalYearlyRent,
      numberOfCheques: data.numberOfCheques,
      leaseId: data.leaseId,
    },
  });

  revalidatePath(`/units/${lease.unitId}`);
  revalidatePath("/rent");
  revalidatePath("/dashboard");

  return schedule;
}

export async function updatePaymentStatus(
  paymentId: string,
  newStatus: "cleared" | "bounced",
  comment?: string
) {
  const { organizationId, userId } = await requireOrg();

  const payment = await prisma.rentPayment.findFirst({
    where: { id: paymentId },
    include: {
      rentSchedule: {
        include: { lease: { include: { unit: { include: { property: true } } } } },
      },
    },
  });
  if (
    !payment ||
    payment.rentSchedule.lease.unit.property.organizationId !== organizationId
  ) {
    throw new Error("Payment not found");
  }

  const oldStatus = payment.status;

  await prisma.rentPayment.update({
    where: { id: paymentId },
    data: { status: newStatus, landlordComment: comment ?? null },
  });

  await createAuditLog({
    organizationId,
    userId,
    action: "payment_status_changed",
    entityType: "payment",
    entityId: paymentId,
    paymentId,
    metadata: { oldStatus, newStatus, comment },
  });

  // If bounced, create notification for tenant
  if (newStatus === "bounced") {
    const lease = payment.rentSchedule.lease;
    const tenant = await prisma.tenant.findFirst({
      where: { id: lease.tenantId },
    });
    if (tenant?.userId) {
      await prisma.notification.create({
        data: {
          userId: tenant.userId,
          organizationId,
          title: "Payment marked as bounced",
          message: `Your landlord marked payment #${payment.sequenceNumber} (AED ${payment.amount}) as bounced. If this is incorrect, please upload proof of clearance.`,
          link: "/tenant/rent",
        },
      });
    }
  }

  revalidatePath("/rent");
  revalidatePath("/dashboard");
  revalidatePath("/tenant/rent");
}

export async function resolveDispute(
  paymentId: string,
  resolution: "cleared" | "rejected"
) {
  const { organizationId, userId } = await requireOrg();

  const payment = await prisma.rentPayment.findFirst({
    where: { id: paymentId },
    include: {
      rentSchedule: {
        include: { lease: { include: { unit: { include: { property: true } } } } },
      },
    },
  });
  if (
    !payment ||
    payment.rentSchedule.lease.unit.property.organizationId !== organizationId
  ) {
    throw new Error("Payment not found");
  }

  const newStatus = resolution === "cleared" ? "cleared" : "disputed_unresolved";

  await prisma.rentPayment.update({
    where: { id: paymentId },
    data: { status: newStatus as "cleared" | "disputed_unresolved" },
  });

  await createAuditLog({
    organizationId,
    userId,
    action: "payment_disputed",
    entityType: "payment",
    entityId: paymentId,
    paymentId,
    metadata: {
      resolution,
      oldStatus: payment.status,
      newStatus,
    },
  });

  // Notify tenant
  const lease = payment.rentSchedule.lease;
  const tenant = await prisma.tenant.findFirst({
    where: { id: lease.tenantId },
  });
  if (tenant?.userId) {
    const message =
      resolution === "cleared"
        ? `Payment #${payment.sequenceNumber} has been confirmed as cleared. Thank you.`
        : `Your dispute proof for payment #${payment.sequenceNumber} was reviewed. Status remains unresolved. Please resolve offline or with your property manager.`;

    await prisma.notification.create({
      data: {
        userId: tenant.userId,
        organizationId,
        title:
          resolution === "cleared"
            ? "Payment confirmed"
            : "Dispute unresolved",
        message,
        link: "/tenant/rent",
      },
    });
  }

  revalidatePath("/rent");
  revalidatePath("/dashboard");
  revalidatePath("/tenant/rent");
}

// ─── Maintenance Comments ───

export async function addMaintenanceComment(
  requestId: string,
  content: string,
  isInternal: boolean = false
) {
  const { organizationId, userId } = await requireOrg();

  const request = await prisma.maintenanceRequest.findFirst({
    where: { id: requestId, organizationId },
  });
  if (!request) throw new Error("Maintenance request not found");

  await prisma.maintenanceComment.create({
    data: {
      requestId,
      userId,
      content,
      isInternal,
    },
  });

  await createAuditLog({
    organizationId,
    userId,
    action: "maintenance_comment_added",
    entityType: "maintenance",
    entityId: requestId,
    metadata: { isInternal },
  });

  revalidatePath("/maintenance");
  revalidatePath(`/maintenance/${requestId}`);
  revalidatePath("/tenant/maintenance");
}

// ─── Tenant Onboarding ───

export async function completeOnboardingStep(step: string) {
  const session = await requireAuth();
  const tenant = await prisma.tenant.findFirst({
    where: { userId: session.user.id },
    include: { onboarding: true },
  });
  if (!tenant) throw new Error("Tenant profile not found");

  // Create onboarding record if it doesn't exist
  let onboarding = tenant.onboarding;
  if (!onboarding) {
    onboarding = await prisma.tenantOnboarding.create({
      data: { tenantId: tenant.id },
    });
  }

  // Update the specific step
  const validSteps = [
    "idUploaded",
    "visaUploaded",
    "contactConfirmed",
    "contractCopyUploaded",
  ];
  if (!validSteps.includes(step)) throw new Error("Invalid onboarding step");

  const updateData: Record<string, boolean | Date> = {
    [step]: true,
  };

  // Check if all steps are complete
  const updated = await prisma.tenantOnboarding.update({
    where: { id: onboarding.id },
    data: updateData,
  });

  if (
    updated.idUploaded &&
    updated.contactConfirmed
    // visa and contract are optional
  ) {
    await prisma.tenantOnboarding.update({
      where: { id: onboarding.id },
      data: { completedAt: new Date() },
    });
  }

  // Get org for audit
  const org = await prisma.userOrganization.findFirst({
    where: { userId: session.user.id },
  });
  if (org) {
    await createAuditLog({
      organizationId: org.organizationId,
      userId: session.user.id,
      action: "onboarding_step_completed",
      entityType: "onboarding",
      entityId: onboarding.id,
      metadata: { step },
    });
  }

  revalidatePath("/tenant/dashboard");
  revalidatePath("/tenant/onboarding");
}

// ─── Notifications ───

export async function markNotificationRead(notificationId: string) {
  const session = await requireAuth();
  await prisma.notification.update({
    where: { id: notificationId, userId: session.user.id },
    data: { read: true },
  });
  revalidatePath("/");
}

export async function markAllNotificationsRead() {
  const session = await requireAuth();
  await prisma.notification.updateMany({
    where: { userId: session.user.id, read: false },
    data: { read: true },
  });
  revalidatePath("/");
}
