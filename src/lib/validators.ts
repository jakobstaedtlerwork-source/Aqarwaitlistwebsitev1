import { z } from "zod";

// ─── Auth Schemas ───

export const signupSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email"),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

// ─── Entity Schemas ───

export const propertySchema = z.object({
  name: z.string().min(1, "Name is required"),
  addressLine1: z.string().optional().default(""),
  city: z.string().optional().default(""),
  country: z.string().optional().default(""),
  notes: z.string().optional().nullable(),
});

export const unitSchema = z.object({
  name: z.string().min(1, "Unit name/number is required"),
  propertyId: z.string().min(1, "Property is required"),
  sizeSqm: z.coerce.number().positive().optional().nullable(),
  bedrooms: z.coerce.number().int().min(0).optional().nullable(),
  bathrooms: z.coerce.number().int().min(0).optional().nullable(),
  status: z.enum(["occupied", "vacant"]).optional().default("vacant"),
});

export const tenantSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email().optional().nullable().or(z.literal("")),
  phone: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const leaseSchema = z.object({
  unitId: z.string().min(1, "Unit is required"),
  tenantId: z.string().min(1, "Tenant is required"),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional().nullable(),
  rentAmount: z.coerce.number().positive().optional().nullable(),
  rentCurrency: z.string().optional().default("AED"),
  depositAmount: z.coerce.number().positive().optional().nullable(),
  status: z.enum(["active", "ended", "draft"]).optional().default("draft"),
});

export const taskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional().nullable(),
  status: z.enum(["open", "in_progress", "done"]).optional().default("open"),
  dueDate: z.coerce.date().optional().nullable(),
  propertyId: z.string().optional().nullable(),
  unitId: z.string().optional().nullable(),
  tenantId: z.string().optional().nullable(),
  leaseId: z.string().optional().nullable(),
});

export const documentUploadSchema = z.object({
  title: z.string().min(1, "Title is required"),
  type: z.enum(["contract", "id", "invoice", "other"]).optional().default("other"),
  documentCategory: z
    .enum(["tenancy_contract", "id_visa", "rent_payment", "ejari", "other"])
    .optional()
    .default("other"),
  expiryDate: z.coerce.date().optional().nullable(),
  propertyId: z.string().optional().nullable(),
  unitId: z.string().optional().nullable(),
  tenantId: z.string().optional().nullable(),
  leaseId: z.string().optional().nullable(),
});

export const organizationSchema = z.object({
  name: z.string().min(1, "Organization name is required"),
});

// ─── New MVP 0.2 Schemas ───

export const maintenanceRequestSchema = z.object({
  unitId: z.string().min(1, "Unit is required"),
  description: z.string().min(10, "Please describe the issue in detail"),
});

export const tenantInvitationSchema = z.object({
  email: z.string().email("Invalid email"),
  unitId: z.string().min(1, "Unit is required"),
});

// ─── Functional Spec Schemas ───

export const rentScheduleSchema = z.object({
  leaseId: z.string().min(1, "Lease is required"),
  totalYearlyRent: z.coerce.number().positive("Must be a positive amount"),
  numberOfCheques: z.coerce
    .number()
    .int()
    .refine((n) => [1, 2, 4, 6, 12].includes(n), "Must be 1, 2, 4, 6 or 12"),
});

export const rentPaymentUpdateSchema = z.object({
  paymentId: z.string().min(1, "Payment is required"),
  status: z.enum([
    "upcoming",
    "due",
    "pending_verification",
    "cleared",
    "bounced",
    "disputed_pending",
    "disputed_unresolved",
    "disputed_rejected",
  ]),
  comment: z.string().optional().nullable(),
});

export const paymentProofUploadSchema = z.object({
  paymentId: z.string().min(1, "Payment is required"),
  note: z.string().optional().nullable(),
  isDisputeProof: z.boolean().optional().default(false),
});

export const maintenanceCommentSchema = z.object({
  requestId: z.string().min(1, "Request is required"),
  content: z.string().min(1, "Comment cannot be empty"),
  isInternal: z.boolean().optional().default(false),
});

export const tenantOnboardingStepSchema = z.object({
  step: z.enum(["idUploaded", "visaUploaded", "contactConfirmed", "contractCopyUploaded"]),
});

export const documentUploadWithVisibilitySchema = documentUploadSchema.extend({
  visibility: z.enum(["shared", "landlord_only"]).optional().default("shared"),
  replacesDocumentId: z.string().optional().nullable(),
});
