-- AlterTable
ALTER TABLE "public"."payments" ADD COLUMN     "balanceDue" DOUBLE PRECISION,
ADD COLUMN     "customerEmail" TEXT,
ADD COLUMN     "dueDate" TIMESTAMP(3),
ADD COLUMN     "status" "public"."PaymentStatus" NOT NULL DEFAULT 'PENDING';
