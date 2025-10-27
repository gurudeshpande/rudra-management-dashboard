-- AlterTable
ALTER TABLE "public"."RawMaterialTransfer" ADD COLUMN     "quantityApproved" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "quantityRejected" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "rejectionReason" TEXT;
