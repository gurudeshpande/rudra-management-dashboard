/*
  Warnings:

  - The values [PENDING] on the enum `BillStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `phone` on the `Customer` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[number]` on the table `Customer` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `number` to the `Customer` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "IMDSUserRole" AS ENUM ('IMDS_SUPER_ADMIN', 'IMDS_COMPLIANCE_LEAD', 'IMDS_PRODUCT_ENGINEER', 'IMDS_SUSTAINABILITY_OFFICER', 'IMDS_SUPPLIER', 'IMDS_READ_ONLY');

-- CreateEnum
CREATE TYPE "IMDSSubmissionStatus" AS ENUM ('QUEUED', 'AI_PROCESSING', 'AWAITING_REVIEW', 'COMPLIANCE_CHECKED', 'SUBMITTED_TO_IMDS', 'ACCEPTED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "IMDSRegulation" AS ENUM ('REACH', 'ROHS', 'ELV', 'CUSTOM');

-- CreateEnum
CREATE TYPE "IMDSCheckStatus" AS ENUM ('PASS', 'FAIL', 'WARN', 'EXEMPT');

-- CreateEnum
CREATE TYPE "IMDSSupplierStatus" AS ENUM ('ACTIVE', 'UNDER_REVIEW', 'SUSPENDED', 'INACTIVE');

-- AlterEnum
BEGIN;
CREATE TYPE "BillStatus_new" AS ENUM ('DRAFT', 'OPEN', 'PAID', 'PARTIAL', 'OVERDUE', 'CANCELLED');
ALTER TABLE "public"."bills" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."purchase_bills" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "purchase_bills" ALTER COLUMN "status" TYPE "BillStatus_new" USING ("status"::text::"BillStatus_new");
ALTER TABLE "bills" ALTER COLUMN "status" TYPE "BillStatus_new" USING ("status"::text::"BillStatus_new");
ALTER TYPE "BillStatus" RENAME TO "BillStatus_old";
ALTER TYPE "BillStatus_new" RENAME TO "BillStatus";
DROP TYPE "public"."BillStatus_old";
ALTER TABLE "bills" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
ALTER TABLE "purchase_bills" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
COMMIT;

-- DropIndex
DROP INDEX "Customer_phone_key";

-- AlterTable
ALTER TABLE "Customer" DROP COLUMN "phone",
ADD COLUMN     "number" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "imds_tenants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "imdsOrgId" TEXT,
    "tier" TEXT NOT NULL DEFAULT 'PROFESSIONAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "imds_tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "imds_users" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "IMDSUserRole" NOT NULL DEFAULT 'IMDS_READ_ONLY',
    "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
    "mfaSecret" TEXT,
    "lastActiveAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "imds_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "imds_bom_submissions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "supplierId" TEXT,
    "bomId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT,
    "fileType" TEXT NOT NULL,
    "rowCount" INTEGER,
    "status" "IMDSSubmissionStatus" NOT NULL DEFAULT 'QUEUED',
    "aiConfidence" DOUBLE PRECISION,
    "aiProcessedAt" TIMESTAMP(3),
    "ocrUsed" BOOLEAN NOT NULL DEFAULT false,
    "complianceScore" DOUBLE PRECISION,
    "riskScore" DOUBLE PRECISION,
    "hasViolations" BOOLEAN NOT NULL DEFAULT false,
    "violationCount" INTEGER NOT NULL DEFAULT 0,
    "imdsRefId" TEXT,
    "imdsSubmittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "imds_bom_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "imds_material_entries" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "partNumber" TEXT NOT NULL,
    "partName" TEXT NOT NULL,
    "substanceName" TEXT NOT NULL,
    "casNumber" TEXT,
    "imdsGroup" TEXT,
    "weightPercent" DOUBLE PRECISION NOT NULL,
    "category" TEXT,
    "normalizedName" TEXT,
    "aiExtracted" BOOLEAN NOT NULL DEFAULT true,
    "confidence" DOUBLE PRECISION,
    "complianceStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "imds_material_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "imds_compliance_checks" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "checkId" TEXT NOT NULL,
    "substanceName" TEXT NOT NULL,
    "casNumber" TEXT,
    "regulation" "IMDSRegulation" NOT NULL,
    "thresholdLimit" DOUBLE PRECISION NOT NULL,
    "thresholdUnit" TEXT NOT NULL DEFAULT '%',
    "detectedValue" DOUBLE PRECISION NOT NULL,
    "status" "IMDSCheckStatus" NOT NULL,
    "aiReasoning" TEXT,
    "alternatives" TEXT[],
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "imds_compliance_checks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "imds_substance_violations" (
    "id" TEXT NOT NULL,
    "materialEntryId" TEXT NOT NULL,
    "checkId" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "regulation" "IMDSRegulation" NOT NULL,
    "description" TEXT NOT NULL,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "correctiveAction" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "imds_substance_violations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "imds_suppliers" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "complianceScore" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "totalBOMs" INTEGER NOT NULL DEFAULT 0,
    "totalViolations" INTEGER NOT NULL DEFAULT 0,
    "lastAuditDate" TIMESTAMP(3),
    "status" "IMDSSupplierStatus" NOT NULL DEFAULT 'ACTIVE',
    "certifications" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "imds_suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "imds_audit_logs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT,
    "submissionId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "ipAddress" TEXT,
    "result" TEXT NOT NULL DEFAULT 'success',
    "entryHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "imds_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "imds_substance_library" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "casNumber" TEXT NOT NULL,
    "imdsGroup" TEXT,
    "category" TEXT NOT NULL,
    "isReach" BOOLEAN NOT NULL DEFAULT false,
    "isRohs" BOOLEAN NOT NULL DEFAULT false,
    "isElv" BOOLEAN NOT NULL DEFAULT false,
    "isSvhc" BOOLEAN NOT NULL DEFAULT false,
    "reachThreshold" DOUBLE PRECISION,
    "rohsThreshold" DOUBLE PRECISION,
    "elvThreshold" DOUBLE PRECISION,
    "riskLevel" TEXT NOT NULL,
    "description" TEXT,
    "echaUrl" TEXT,
    "svhcListVersion" TEXT,
    "svhcAddedDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "imds_substance_library_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "imds_users_email_key" ON "imds_users"("email");

-- CreateIndex
CREATE INDEX "imds_users_tenantId_idx" ON "imds_users"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "imds_bom_submissions_bomId_key" ON "imds_bom_submissions"("bomId");

-- CreateIndex
CREATE INDEX "imds_bom_submissions_tenantId_idx" ON "imds_bom_submissions"("tenantId");

-- CreateIndex
CREATE INDEX "imds_bom_submissions_supplierId_idx" ON "imds_bom_submissions"("supplierId");

-- CreateIndex
CREATE INDEX "imds_bom_submissions_status_idx" ON "imds_bom_submissions"("status");

-- CreateIndex
CREATE INDEX "imds_material_entries_submissionId_idx" ON "imds_material_entries"("submissionId");

-- CreateIndex
CREATE INDEX "imds_material_entries_casNumber_idx" ON "imds_material_entries"("casNumber");

-- CreateIndex
CREATE UNIQUE INDEX "imds_compliance_checks_checkId_key" ON "imds_compliance_checks"("checkId");

-- CreateIndex
CREATE INDEX "imds_compliance_checks_submissionId_idx" ON "imds_compliance_checks"("submissionId");

-- CreateIndex
CREATE INDEX "imds_compliance_checks_regulation_idx" ON "imds_compliance_checks"("regulation");

-- CreateIndex
CREATE INDEX "imds_compliance_checks_status_idx" ON "imds_compliance_checks"("status");

-- CreateIndex
CREATE INDEX "imds_substance_violations_materialEntryId_idx" ON "imds_substance_violations"("materialEntryId");

-- CreateIndex
CREATE INDEX "imds_substance_violations_checkId_idx" ON "imds_substance_violations"("checkId");

-- CreateIndex
CREATE INDEX "imds_suppliers_tenantId_idx" ON "imds_suppliers"("tenantId");

-- CreateIndex
CREATE INDEX "imds_audit_logs_tenantId_idx" ON "imds_audit_logs"("tenantId");

-- CreateIndex
CREATE INDEX "imds_audit_logs_userId_idx" ON "imds_audit_logs"("userId");

-- CreateIndex
CREATE INDEX "imds_audit_logs_action_idx" ON "imds_audit_logs"("action");

-- CreateIndex
CREATE UNIQUE INDEX "imds_substance_library_casNumber_key" ON "imds_substance_library"("casNumber");

-- CreateIndex
CREATE INDEX "imds_substance_library_casNumber_idx" ON "imds_substance_library"("casNumber");

-- CreateIndex
CREATE INDEX "imds_substance_library_isSvhc_idx" ON "imds_substance_library"("isSvhc");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_number_key" ON "Customer"("number");

-- AddForeignKey
ALTER TABLE "imds_users" ADD CONSTRAINT "imds_users_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "imds_tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "imds_bom_submissions" ADD CONSTRAINT "imds_bom_submissions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "imds_tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "imds_bom_submissions" ADD CONSTRAINT "imds_bom_submissions_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "imds_suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "imds_material_entries" ADD CONSTRAINT "imds_material_entries_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "imds_bom_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "imds_compliance_checks" ADD CONSTRAINT "imds_compliance_checks_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "imds_bom_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "imds_substance_violations" ADD CONSTRAINT "imds_substance_violations_materialEntryId_fkey" FOREIGN KEY ("materialEntryId") REFERENCES "imds_material_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "imds_substance_violations" ADD CONSTRAINT "imds_substance_violations_checkId_fkey" FOREIGN KEY ("checkId") REFERENCES "imds_compliance_checks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "imds_suppliers" ADD CONSTRAINT "imds_suppliers_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "imds_tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "imds_audit_logs" ADD CONSTRAINT "imds_audit_logs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "imds_tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "imds_audit_logs" ADD CONSTRAINT "imds_audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "imds_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "imds_audit_logs" ADD CONSTRAINT "imds_audit_logs_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "imds_bom_submissions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
