-- CreateEnum
CREATE TYPE "public"."VendorCreditNoteStatus" AS ENUM ('DRAFT', 'ISSUED', 'APPLIED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."VendorPaymentStatus" AS ENUM ('DUE', 'PAID', 'OVERDUE', 'PARTIAL');

-- CreateEnum
CREATE TYPE "public"."VendorPaymentMethod" AS ENUM ('UPI', 'CASH', 'BANK_TRANSFER', 'CARD', 'CHEQUE', 'ONLINE');

-- CreateEnum
CREATE TYPE "public"."BillStatus" AS ENUM ('DRAFT', 'PENDING', 'PARTIAL', 'PAID', 'OVERDUE', 'CANCELLED');

-- CreateTable
CREATE TABLE "public"."Vendor" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "companyName" TEXT,
    "gstin" TEXT,
    "address" TEXT,
    "openingBalance" DOUBLE PRECISION DEFAULT 0,
    "creditLimit" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."vendor_credit_notes" (
    "id" TEXT NOT NULL,
    "creditNoteNumber" TEXT NOT NULL,
    "vendorId" INTEGER NOT NULL,
    "billNumber" TEXT,
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "taxAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "status" "public"."VendorCreditNoteStatus" NOT NULL DEFAULT 'DRAFT',
    "appliedToBill" BOOLEAN NOT NULL DEFAULT false,
    "appliedDate" TIMESTAMP(3),
    "appliedBillId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendor_credit_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."vendor_payments" (
    "id" TEXT NOT NULL,
    "vendorId" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paymentMethod" "public"."VendorPaymentMethod" NOT NULL,
    "transactionId" TEXT,
    "referenceNumber" TEXT NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "billNumbers" TEXT[],
    "status" "public"."VendorPaymentStatus" NOT NULL DEFAULT 'DUE',
    "dueDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendor_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."bills" (
    "id" SERIAL NOT NULL,
    "billNumber" TEXT NOT NULL,
    "vendorId" INTEGER NOT NULL,
    "billDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "taxAmount" DOUBLE PRECISION NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "amountPaid" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "balanceDue" DOUBLE PRECISION NOT NULL,
    "paymentTerms" TEXT,
    "status" "public"."BillStatus" NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "itemsDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."vendor_credit_note_counters" (
    "id" TEXT NOT NULL,
    "financialYear" TEXT NOT NULL,
    "lastNumber" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "vendor_credit_note_counters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."vendor_payment_counters" (
    "id" TEXT NOT NULL,
    "financialYear" TEXT NOT NULL,
    "lastNumber" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "vendor_payment_counters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."bill_counters" (
    "id" TEXT NOT NULL,
    "financialYear" TEXT NOT NULL,
    "lastNumber" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "bill_counters_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Vendor_gstin_key" ON "public"."Vendor"("gstin");

-- CreateIndex
CREATE INDEX "Vendor_name_idx" ON "public"."Vendor"("name");

-- CreateIndex
CREATE INDEX "Vendor_gstin_idx" ON "public"."Vendor"("gstin");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_credit_notes_creditNoteNumber_key" ON "public"."vendor_credit_notes"("creditNoteNumber");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_credit_notes_appliedBillId_key" ON "public"."vendor_credit_notes"("appliedBillId");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_payments_referenceNumber_key" ON "public"."vendor_payments"("referenceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "bills_billNumber_key" ON "public"."bills"("billNumber");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_credit_note_counters_financialYear_key" ON "public"."vendor_credit_note_counters"("financialYear");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_payment_counters_financialYear_key" ON "public"."vendor_payment_counters"("financialYear");

-- CreateIndex
CREATE UNIQUE INDEX "bill_counters_financialYear_key" ON "public"."bill_counters"("financialYear");

-- AddForeignKey
ALTER TABLE "public"."vendor_credit_notes" ADD CONSTRAINT "vendor_credit_notes_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "public"."Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."vendor_credit_notes" ADD CONSTRAINT "vendor_credit_notes_appliedBillId_fkey" FOREIGN KEY ("appliedBillId") REFERENCES "public"."bills"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."vendor_payments" ADD CONSTRAINT "vendor_payments_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "public"."Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bills" ADD CONSTRAINT "bills_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "public"."Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
