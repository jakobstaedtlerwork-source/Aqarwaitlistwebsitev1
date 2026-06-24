"use server";

import { prisma } from "./prisma";
import { Prisma } from "@/generated/prisma/client";
import type { AuditAction } from "@/generated/prisma/client";

export async function createAuditLog(params: {
  organizationId: string;
  userId: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  paymentId?: string;
  metadata?: Record<string, unknown>;
}) {
  return prisma.auditLog.create({
    data: {
      organizationId: params.organizationId,
      userId: params.userId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      paymentId: params.paymentId ?? null,
      metadata: params.metadata
        ? (params.metadata as Prisma.InputJsonValue)
        : Prisma.JsonNull,
    },
  });
}
