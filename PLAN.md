# AQAR MVP – Functional Specification Upgrade Plan

## Overview

Upgrade from MVP 0.2 (basic dual-role system) to full functional spec covering:
- **Rent payment tracking** with cheque schedules, proof uploads, and dispute flow
- **Document versioning** with upload ownership, visibility rules, immutability
- **Tenant onboarding** with guided checklist and progress bar
- **Maintenance comments** (tenant-visible) and internal notes (landlord-only)
- **Full audit trail** for status changes, uploads, disputes
- **Notification triggers** for expiry thresholds (30/14/7/3/0 days)
- **Multi-unit tenant support** with unit switcher

---

## Phase 1: Schema Foundation

### 1A. New Enums
```
DocumentVisibility: shared, landlord_only
PaymentStatus: upcoming, due, pending_verification, cleared, bounced, disputed_pending, disputed_unresolved, disputed_rejected
AuditAction: payment_created, payment_status_changed, payment_proof_uploaded, payment_disputed, document_uploaded, document_replaced, maintenance_status_changed, maintenance_comment_added, onboarding_step_completed
```

### 1B. Document Model Additions
- `uploadedByUserId` (String?) – who uploaded this doc
- `visibility` (DocumentVisibility, default: shared)
- `replacedByDocumentId` (String?, unique) – points to newer version
- `replacesDocumentId` (String?, unique) – points to older version
- `version` (Int, default: 1)
- Self-referential `DocumentVersion` relation for version chain

### 1C. New Payment Models
- **RentSchedule**: leaseId, totalYearlyRent, numberOfCheques, currency
- **RentPayment**: rentScheduleId, sequenceNumber, amount, dueDate, status (PaymentStatus)
- **PaymentProof**: paymentId, uploadedByUserId, fileKey, fileName, mimeType, sizeBytes, note, isDisputeProof

### 1D. Maintenance Enhancements
- Add `waiting_for_tenant` to MaintenanceStatus enum
- Add `title` field to MaintenanceRequest
- New **MaintenanceComment** model: requestId, userId, content, isInternal (bool)

### 1E. Tenant Onboarding
- **TenantOnboarding** model: tenantId (unique), idUploaded, visaUploaded, contactConfirmed, contractCopyUploaded, completedAt

### 1F. Audit Log
- **AuditLog** model: organizationId, userId, action (AuditAction), entityType, entityId, paymentId?, metadata (Json?)

### Migration Summary
- 3 new enums, 1 modified enum
- 6 new models (RentSchedule, RentPayment, PaymentProof, MaintenanceComment, TenantOnboarding, AuditLog)
- 4 modified models (Document, MaintenanceRequest, User, Lease)

---

## Phase 2: Validators & Server Actions

### 2A. New Zod Validators
- rentScheduleSchema (leaseId, totalYearlyRent, numberOfCheques)
- rentPaymentUpdateSchema (paymentId, status)
- paymentProofUploadSchema (paymentId, note?)
- maintenanceCommentSchema (requestId, content, isInternal?)
- tenantOnboardingStepSchema (step name)
- documentUploadSchema updates (add visibility, version support)

### 2B. Audit Utility
- `createAuditLog(orgId, userId, action, entityType, entityId, metadata?)` helper
- Called from all status-change and upload actions

### 2C. New Server Actions
- `createRentSchedule(formData)` – auto-generates RentPayment records
- `updatePaymentStatus(paymentId, newStatus)` – landlord marks cleared/bounced
- `submitPaymentProof(paymentId, fileData)` – tenant uploads proof
- `submitDisputeProof(paymentId, fileData)` – tenant disputes bounced status
- `resolveDispute(paymentId, resolution)` – landlord confirms/rejects
- `addMaintenanceComment(requestId, content, isInternal)`
- `completeOnboardingStep(step)` – tenant marks step done
- `uploadDocumentVersion(documentId, fileData)` – creates new version

---

## Phase 3: Rent Payment UI

### 3A. Landlord: Rent Schedule Setup
- On unit/lease page: "Set Up Rent Schedule" dialog
- Fields: total yearly rent, number of cheques (1/2/4/6/12)
- Auto-generates payment records with calculated amounts & due dates
- Editable due dates before activation

### 3B. Landlord: Payment Management Page
- New page `/rent` or section on dashboard
- Table: payment #, due date, amount, status (badge), actions
- Actions: Mark Cleared, Mark Bounced
- Filter by property/unit/status

### 3C. Tenant: Rent Status Page
- New page `/tenant/rent`
- View payment schedule with statuses
- Upload payment proof (cheque photo, bank receipt)
- Dispute flow: "Submit proof of clearance" when bounced

### 3D. Dispute Flow UI
- Landlord marks bounced → tenant gets notification
- Tenant uploads dispute proof → status changes to disputed_pending
- Landlord reviews → Confirm Cleared or Reject Proof
- Unresolved disputes show warning banner

### 3E. Sidebar Updates
- Add "Rent" to landlord sidebar (between Documents and Maintenance)
- Add "Rent" to tenant sidebar (between Documents and Maintenance)

---

## Phase 4: Document Improvements

### 4A. Upload Ownership Tracking
- All uploads record `uploadedByUserId`
- Upload API route checks role for visibility rules
- Landlord private documents: visibility = landlord_only

### 4B. Document Versioning
- "Upload New Version" button on existing documents
- Creates new Document record, links via replacedByDocumentId chain
- Old versions remain accessible (immutable)
- UI shows version history

### 4C. Visibility Rules
- Tenancy contract: shared (both see it)
- Ejari: shared
- Tenant ID/visa: shared
- Landlord private notes: landlord_only
- Tenant cannot see landlord_only documents

### 4D. Tenant Document Upload
- Tenant can upload ID/visa, signed contract copy
- Upload triggers onboarding step completion

---

## Phase 5: Tenant Onboarding

### 5A. Welcome Screen
- Shown after first login via invitation
- Unit overview (name + address)
- Navigation links

### 5B. Onboarding Checklist
- Progress bar (0-100%)
- Steps: Upload ID/passport, Upload visa (optional), Confirm contact details, Upload signed contract copy (optional)
- Each step has action button
- Checklist persists in TenantOnboarding model

### 5C. Dashboard Integration
- Show onboarding checklist on tenant dashboard until complete
- After completion, show standard dashboard

---

## Phase 6: Maintenance Enhancements

### 6A. Title Field
- Add title input to maintenance request form
- Display title in list and detail views

### 6B. Comment Thread
- Landlord and tenant can add comments
- Comments visible to both parties
- Displayed as chronological thread

### 6C. Internal Notes
- Landlord-only notes (isInternal: true)
- Not visible to tenant
- Visual distinction in UI (different background/label)

### 6D. Status Updates
- Add "Waiting for Tenant" status
- Status badges on all views

---

## Phase 7: Audit Log & Notifications

### 7A. Audit Log Recording
- All payment status changes logged
- All document uploads logged
- All dispute actions logged
- All maintenance status changes logged
- Stored in AuditLog model with JSON metadata

### 7B. Notification Triggers
- Contract expiry: 30, 14, 3, 0 days before
- ID/Visa expiry: 30, 7, 0 days before
- Rent due: on due date
- Payment bounced: immediate
- Dispute status change: immediate
- Maintenance status change: immediate

### 7C. Notification UI
- Bell icon in topbar with count badge
- Dropdown with recent notifications
- Mark as read

---

## Implementation Order

1. **Phase 1** – Schema migration (all models at once)
2. **Phase 2** – Validators + actions + audit utility
3. **Phase 3** – Rent payment (biggest new feature)
4. **Phase 4** – Document improvements
5. **Phase 5** – Tenant onboarding
6. **Phase 6** – Maintenance enhancements
7. **Phase 7** – Audit log + notifications
8. **Seed data** – Update seed.ts with rent schedules, payments, audit entries

---

## Files to Create/Modify

### New Files (~25)
- `src/app/(landlord)/rent/page.tsx` – Landlord rent management
- `src/app/(landlord)/rent/[leaseId]/page.tsx` – Rent schedule detail
- `src/app/(tenant)/tenant/rent/page.tsx` – Tenant rent view
- `src/app/(tenant)/tenant/onboarding/page.tsx` – Onboarding checklist
- `src/app/api/payment-proof/route.ts` – Payment proof upload
- `src/lib/audit.ts` – Audit log utility
- Various dialog/form components for rent, disputes, comments

### Modified Files (~15)
- `prisma/schema.prisma` – All schema changes
- `src/lib/validators.ts` – New schemas
- `src/lib/actions.ts` – New server actions
- `src/components/landlord-sidebar.tsx` – Add Rent link
- `src/components/tenant-sidebar.tsx` – Add Rent link
- `src/components/topbar.tsx` – Notification bell
- `src/app/(landlord)/dashboard/page.tsx` – Integrate real rent data
- `src/app/(tenant)/tenant/dashboard/page.tsx` – Onboarding + rent status
- `src/app/(landlord)/maintenance/page.tsx` – Comments + internal notes
- `src/app/(tenant)/tenant/maintenance/page.tsx` – Comments view
- `src/app/api/upload/route.ts` – Add uploadedByUserId + visibility
- Various existing pages for document versioning
