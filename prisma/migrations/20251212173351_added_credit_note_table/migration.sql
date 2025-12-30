-- CreateEnum
CREATE TYPE "public"."CreditNoteStatus" AS ENUM ('DRAFT', 'ISSUED', 'CANCELLED', 'APPLIED');

-- CreateTable
CREATE TABLE "public"."credit_notes" (
    "id" TEXT NOT NULL,
    "creditNoteNumber" TEXT NOT NULL,
    "invoiceNumber" TEXT,
    "customerId" INTEGER NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "taxAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "status" "public"."CreditNoteStatus" NOT NULL DEFAULT 'DRAFT',
    "appliedToInvoice" BOOLEAN NOT NULL DEFAULT false,
    "appliedDate" TIMESTAMP(3),
    "appliedInvoiceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "credit_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."credit_note_counters" (
    "id" TEXT NOT NULL,
    "financialYear" TEXT NOT NULL,
    "lastNumber" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "credit_note_counters_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "credit_notes_creditNoteNumber_key" ON "public"."credit_notes"("creditNoteNumber");

-- CreateIndex
CREATE UNIQUE INDEX "credit_note_counters_financialYear_key" ON "public"."credit_note_counters"("financialYear");

-- AddForeignKey
ALTER TABLE "public"."credit_notes" ADD CONSTRAINT "credit_notes_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
