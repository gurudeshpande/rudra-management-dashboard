-- CreateEnum
CREATE TYPE "public"."PaymentMethod" AS ENUM ('UPI', 'CASH', 'BANK_TRANSFER', 'CARD');

-- CreateTable
CREATE TABLE "public"."payments" (
    "id" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerNumber" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "paymentMethod" "public"."PaymentMethod" NOT NULL,
    "transactionId" TEXT,
    "receiptNumber" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payments_receiptNumber_key" ON "public"."payments"("receiptNumber");
