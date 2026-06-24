import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Clean existing data (order matters for foreign keys)
  await prisma.auditLog.deleteMany();
  await prisma.paymentProof.deleteMany();
  await prisma.rentPayment.deleteMany();
  await prisma.rentSchedule.deleteMany();
  await prisma.maintenanceComment.deleteMany();
  await prisma.tenantOnboarding.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.maintenancePhoto.deleteMany();
  await prisma.maintenanceRequest.deleteMany();
  await prisma.tenantInvitation.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.task.deleteMany();
  await prisma.document.deleteMany();
  await prisma.lease.deleteMany();
  await prisma.tenant.deleteMany();
  await prisma.unit.deleteMany();
  await prisma.property.deleteMany();
  await prisma.userOrganization.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  // Hash demo passwords
  const passwordHash = await bcrypt.hash("demo1234", 12);

  // ─── Create Organization ───
  const org = await prisma.organization.create({
    data: { name: "AQAR Demo Workspace" },
  });

  // ─── Create Landlord User ───
  const landlord = await prisma.user.create({
    data: {
      email: "demo@aqar.dev",
      name: "Demo Landlord",
      emailVerified: new Date(),
      passwordHash,
      accountType: "landlord",
    },
  });

  await prisma.userOrganization.create({
    data: {
      userId: landlord.id,
      organizationId: org.id,
      role: "owner",
    },
  });

  // ─── Create Tenant User ───
  const tenantUser = await prisma.user.create({
    data: {
      email: "tenant@aqar.dev",
      name: "Ahmed Al Maktoum",
      emailVerified: new Date(),
      passwordHash,
      accountType: "tenant",
    },
  });

  await prisma.userOrganization.create({
    data: {
      userId: tenantUser.id,
      organizationId: org.id,
      role: "member",
    },
  });

  // ─── Create Properties ───
  const prop1 = await prisma.property.create({
    data: {
      organizationId: org.id,
      name: "Marina Tower",
      addressLine1: "Dubai Marina, Plot 123",
      city: "Dubai",
      country: "UAE",
      notes: "Premium waterfront property",
    },
  });

  const prop2 = await prisma.property.create({
    data: {
      organizationId: org.id,
      name: "Business Bay Offices",
      addressLine1: "Business Bay, Tower B",
      city: "Dubai",
      country: "UAE",
    },
  });

  // ─── Create Units ───
  const unit1 = await prisma.unit.create({
    data: {
      propertyId: prop1.id,
      name: "Unit 101",
      sizeSqm: 85,
      bedrooms: 1,
      bathrooms: 1,
      status: "occupied",
    },
  });

  const unit2 = await prisma.unit.create({
    data: {
      propertyId: prop1.id,
      name: "Unit 202",
      sizeSqm: 120,
      bedrooms: 2,
      bathrooms: 2,
      status: "occupied",
    },
  });

  const unit3 = await prisma.unit.create({
    data: {
      propertyId: prop1.id,
      name: "Unit 303",
      sizeSqm: 150,
      bedrooms: 3,
      bathrooms: 2,
      status: "vacant",
    },
  });

  const unit4 = await prisma.unit.create({
    data: {
      propertyId: prop2.id,
      name: "Office A",
      sizeSqm: 200,
      status: "occupied",
    },
  });

  const unit5 = await prisma.unit.create({
    data: {
      propertyId: prop2.id,
      name: "Office B",
      sizeSqm: 150,
      status: "vacant",
    },
  });

  // ─── Create Tenants (linked to users where applicable) ───
  const tenant1 = await prisma.tenant.create({
    data: {
      organizationId: org.id,
      fullName: "Ahmed Al Maktoum",
      email: "tenant@aqar.dev",
      phone: "+971501234567",
      userId: tenantUser.id,
    },
  });

  const tenant2 = await prisma.tenant.create({
    data: {
      organizationId: org.id,
      fullName: "Sarah Johnson",
      email: "sarah@example.com",
      phone: "+971509876543",
      notes: "Corporate tenant - tech company",
    },
  });

  // ─── Create Leases ───
  const lease1 = await prisma.lease.create({
    data: {
      unitId: unit1.id,
      tenantId: tenant1.id,
      startDate: new Date("2024-01-01"),
      endDate: new Date("2025-12-31"),
      rentAmount: 8500,
      rentCurrency: "AED",
      depositAmount: 17000,
      status: "active",
    },
  });

  await prisma.lease.create({
    data: {
      unitId: unit2.id,
      tenantId: tenant2.id,
      startDate: new Date("2024-06-01"),
      endDate: new Date("2025-05-31"),
      rentAmount: 12000,
      rentCurrency: "AED",
      depositAmount: 24000,
      status: "active",
    },
  });

  await prisma.lease.create({
    data: {
      unitId: unit4.id,
      tenantId: tenant2.id,
      startDate: new Date("2023-06-01"),
      endDate: new Date("2024-05-31"),
      rentAmount: 15000,
      rentCurrency: "AED",
      depositAmount: 30000,
      status: "ended",
    },
  });

  // ─── Create Tasks ───
  await prisma.task.create({
    data: {
      organizationId: org.id,
      propertyId: prop1.id,
      unitId: unit3.id,
      title: "Paint vacant unit",
      description: "Unit 303 needs fresh paint before new tenant moves in",
      status: "open",
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.task.create({
    data: {
      organizationId: org.id,
      propertyId: prop1.id,
      title: "Annual fire safety inspection",
      description: "Schedule with Dubai Civil Defence",
      status: "in_progress",
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.task.create({
    data: {
      organizationId: org.id,
      propertyId: prop2.id,
      tenantId: tenant2.id,
      title: "Collect overdue rent",
      description: "Follow up on last month payment",
      status: "open",
    },
  });

  await prisma.task.create({
    data: {
      organizationId: org.id,
      propertyId: prop1.id,
      unitId: unit1.id,
      tenantId: tenant1.id,
      title: "Submit Ejari registration",
      description: "Ejari needs to be registered for unit 101",
      status: "open",
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
  });

  // ─── Create Documents with categories + expiry dates ───
  await prisma.document.create({
    data: {
      organizationId: org.id,
      propertyId: prop1.id,
      unitId: unit1.id,
      tenantId: tenant1.id,
      title: "Tenancy Contract - Ahmed",
      type: "contract",
      documentCategory: "tenancy_contract",
      expiryDate: new Date("2025-12-31"),
      fileKey: "seed-contract-ahmed.pdf",
      fileName: "tenancy_contract_ahmed.pdf",
      mimeType: "application/pdf",
      sizeBytes: 245000,
    },
  });

  await prisma.document.create({
    data: {
      organizationId: org.id,
      propertyId: prop1.id,
      unitId: unit1.id,
      tenantId: tenant1.id,
      title: "Emirates ID - Ahmed",
      type: "id",
      documentCategory: "id_visa",
      expiryDate: new Date("2026-06-15"),
      fileKey: "seed-id-ahmed.pdf",
      fileName: "emirates_id_ahmed.pdf",
      mimeType: "application/pdf",
      sizeBytes: 180000,
    },
  });

  await prisma.document.create({
    data: {
      organizationId: org.id,
      propertyId: prop1.id,
      unitId: unit1.id,
      tenantId: tenant1.id,
      title: "Ejari Certificate - Unit 101",
      type: "other",
      documentCategory: "ejari",
      expiryDate: new Date("2025-12-31"),
      fileKey: "seed-ejari-101.pdf",
      fileName: "ejari_certificate_101.pdf",
      mimeType: "application/pdf",
      sizeBytes: 95000,
    },
  });

  await prisma.document.create({
    data: {
      organizationId: org.id,
      propertyId: prop1.id,
      unitId: unit1.id,
      tenantId: tenant1.id,
      title: "Rent Payment Receipt - Jan 2025",
      type: "invoice",
      documentCategory: "rent_payment",
      fileKey: "seed-rent-jan.pdf",
      fileName: "rent_receipt_jan_2025.pdf",
      mimeType: "application/pdf",
      sizeBytes: 65000,
    },
  });

  // Document expiring soon (within 30 days)
  await prisma.document.create({
    data: {
      organizationId: org.id,
      propertyId: prop1.id,
      unitId: unit2.id,
      tenantId: tenant2.id,
      title: "Visa Copy - Sarah",
      type: "id",
      documentCategory: "id_visa",
      expiryDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
      fileKey: "seed-visa-sarah.pdf",
      fileName: "visa_sarah_johnson.pdf",
      mimeType: "application/pdf",
      sizeBytes: 150000,
    },
  });

  await prisma.document.create({
    data: {
      organizationId: org.id,
      propertyId: prop2.id,
      title: "Building Insurance Certificate",
      type: "other",
      documentCategory: "other",
      expiryDate: new Date("2025-09-30"),
      fileKey: "seed-insurance-cert.pdf",
      fileName: "insurance_certificate_2024.pdf",
      mimeType: "application/pdf",
      sizeBytes: 120000,
    },
  });

  // ─── Create Maintenance Requests ───
  const maint1 = await prisma.maintenanceRequest.create({
    data: {
      organizationId: org.id,
      unitId: unit1.id,
      tenantUserId: tenantUser.id,
      title: "Kitchen Faucet Leak",
      description:
        "The kitchen faucet has been leaking for the past two days. Water drips constantly even when the tap is fully closed.",
      status: "open",
    },
  });

  const maint2 = await prisma.maintenanceRequest.create({
    data: {
      organizationId: org.id,
      unitId: unit1.id,
      tenantUserId: tenantUser.id,
      title: "AC Unit Noise & Cooling Issue",
      description:
        "AC unit in the living room is making a loud rattling noise and not cooling properly.",
      status: "in_progress",
    },
  });

  // ─── Create Notifications ───
  await prisma.notification.create({
    data: {
      userId: landlord.id,
      organizationId: org.id,
      title: "New Maintenance Request",
      message:
        "Ahmed Al Maktoum submitted a maintenance request for Unit 101 - Kitchen faucet leak.",
      link: "/maintenance",
      read: false,
    },
  });

  await prisma.notification.create({
    data: {
      userId: landlord.id,
      organizationId: org.id,
      title: "Document Expiring Soon",
      message: "Visa Copy for Sarah Johnson expires in 20 days.",
      link: "/documents",
      read: false,
    },
  });

  await prisma.notification.create({
    data: {
      userId: tenantUser.id,
      organizationId: org.id,
      title: "Maintenance Update",
      message: "Your AC maintenance request is now being worked on.",
      link: "/tenant/maintenance",
      read: false,
    },
  });

  await prisma.notification.create({
    data: {
      userId: tenantUser.id,
      organizationId: org.id,
      title: "Task Assigned",
      message: "You have a new task: Submit Ejari registration.",
      link: "/tenant/tasks",
      read: true,
    },
  });

  // ─── Create Rent Schedule + Payments for Ahmed's lease ───
  const rentSchedule = await prisma.rentSchedule.create({
    data: {
      leaseId: lease1.id,
      totalYearlyRent: 102000, // 8500 AED x 12 months
      numberOfCheques: 4,
      currency: "AED",
    },
  });

  const chequeAmount = 102000 / 4; // 25,500 AED per cheque
  const paymentStatuses: Array<{ status: "cleared" | "cleared" | "pending_verification" | "upcoming"; dueDate: Date }> = [
    { status: "cleared", dueDate: new Date("2024-01-01") },
    { status: "cleared", dueDate: new Date("2024-04-01") },
    { status: "pending_verification", dueDate: new Date("2024-07-01") },
    { status: "upcoming", dueDate: new Date("2024-10-01") },
  ];

  const payments = [];
  for (let i = 0; i < paymentStatuses.length; i++) {
    const payment = await prisma.rentPayment.create({
      data: {
        rentScheduleId: rentSchedule.id,
        sequenceNumber: i + 1,
        amount: chequeAmount,
        dueDate: paymentStatuses[i].dueDate,
        status: paymentStatuses[i].status,
        landlordComment: paymentStatuses[i].status === "cleared" ? "Cheque deposited and cleared" : undefined,
      },
    });
    payments.push(payment);
  }

  // ─── Create Tenant Onboarding ───
  await prisma.tenantOnboarding.create({
    data: {
      tenantId: tenant1.id,
      idUploaded: true,
      visaUploaded: false,
      contactConfirmed: true,
      contractCopyUploaded: false,
    },
  });

  // ─── Create Maintenance Comments ───
  await prisma.maintenanceComment.create({
    data: {
      requestId: maint2.id,
      userId: tenantUser.id,
      content: "The rattling sound gets worse at night when it's running on full power.",
      isInternal: false,
    },
  });

  await prisma.maintenanceComment.create({
    data: {
      requestId: maint2.id,
      userId: landlord.id,
      content: "Technician scheduled for next Tuesday between 10am-12pm.",
      isInternal: false,
    },
  });

  await prisma.maintenanceComment.create({
    data: {
      requestId: maint2.id,
      userId: landlord.id,
      content: "Vendor quoted 850 AED for compressor check. Approve?",
      isInternal: true,
    },
  });

  // ─── Create Audit Log entries ───
  await prisma.auditLog.create({
    data: {
      organizationId: org.id,
      userId: landlord.id,
      action: "payment_created",
      entityType: "RentSchedule",
      entityId: rentSchedule.id,
      metadata: { totalYearlyRent: 102000, numberOfCheques: 4 },
    },
  });

  await prisma.auditLog.create({
    data: {
      organizationId: org.id,
      userId: landlord.id,
      action: "payment_status_changed",
      entityType: "RentPayment",
      entityId: payments[0].id,
      paymentId: payments[0].id,
      metadata: { from: "upcoming", to: "cleared" },
    },
  });

  await prisma.auditLog.create({
    data: {
      organizationId: org.id,
      userId: tenantUser.id,
      action: "onboarding_step_completed",
      entityType: "TenantOnboarding",
      entityId: tenant1.id,
      metadata: { step: "upload_id" },
    },
  });

  await prisma.auditLog.create({
    data: {
      organizationId: org.id,
      userId: tenantUser.id,
      action: "maintenance_comment_added",
      entityType: "MaintenanceRequest",
      entityId: maint2.id,
      metadata: { comment: "Rattling sound description" },
    },
  });

  console.log("Seed data created successfully!");
  console.log(`  Organization: ${org.name}`);
  console.log(`  Landlord: ${landlord.email} (password: demo1234)`);
  console.log(`  Tenant: ${tenantUser.email} (password: demo1234)`);
  console.log(`  Properties: 2`);
  console.log(`  Units: 5`);
  console.log(`  Tenants: 2`);
  console.log(`  Leases: 3`);
  console.log(`  Tasks: 4`);
  console.log(`  Documents: 6`);
  console.log(`  Maintenance Requests: 2`);
  console.log(`  Maintenance Comments: 3`);
  console.log(`  Rent Schedule: 1 (4 cheques)`);
  console.log(`  Tenant Onboarding: 1 (50% done)`);
  console.log(`  Audit Logs: 4`);
  console.log(`  Notifications: 4`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
