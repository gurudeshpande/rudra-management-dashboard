/*
  Warnings:

  - You are about to drop the `imds_audit_logs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `imds_bom_submissions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `imds_compliance_checks` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `imds_material_entries` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `imds_substance_library` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `imds_substance_violations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `imds_suppliers` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `imds_tenants` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `imds_users` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "imds_audit_logs" DROP CONSTRAINT "imds_audit_logs_submissionId_fkey";

-- DropForeignKey
ALTER TABLE "imds_audit_logs" DROP CONSTRAINT "imds_audit_logs_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "imds_audit_logs" DROP CONSTRAINT "imds_audit_logs_userId_fkey";

-- DropForeignKey
ALTER TABLE "imds_bom_submissions" DROP CONSTRAINT "imds_bom_submissions_supplierId_fkey";

-- DropForeignKey
ALTER TABLE "imds_bom_submissions" DROP CONSTRAINT "imds_bom_submissions_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "imds_compliance_checks" DROP CONSTRAINT "imds_compliance_checks_submissionId_fkey";

-- DropForeignKey
ALTER TABLE "imds_material_entries" DROP CONSTRAINT "imds_material_entries_submissionId_fkey";

-- DropForeignKey
ALTER TABLE "imds_substance_violations" DROP CONSTRAINT "imds_substance_violations_checkId_fkey";

-- DropForeignKey
ALTER TABLE "imds_substance_violations" DROP CONSTRAINT "imds_substance_violations_materialEntryId_fkey";

-- DropForeignKey
ALTER TABLE "imds_suppliers" DROP CONSTRAINT "imds_suppliers_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "imds_users" DROP CONSTRAINT "imds_users_tenantId_fkey";

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "discount" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- DropTable
DROP TABLE "imds_audit_logs";

-- DropTable
DROP TABLE "imds_bom_submissions";

-- DropTable
DROP TABLE "imds_compliance_checks";

-- DropTable
DROP TABLE "imds_material_entries";

-- DropTable
DROP TABLE "imds_substance_library";

-- DropTable
DROP TABLE "imds_substance_violations";

-- DropTable
DROP TABLE "imds_suppliers";

-- DropTable
DROP TABLE "imds_tenants";

-- DropTable
DROP TABLE "imds_users";

-- DropEnum
DROP TYPE "IMDSCheckStatus";

-- DropEnum
DROP TYPE "IMDSRegulation";

-- DropEnum
DROP TYPE "IMDSSubmissionStatus";

-- DropEnum
DROP TYPE "IMDSSupplierStatus";

-- DropEnum
DROP TYPE "IMDSUserRole";
