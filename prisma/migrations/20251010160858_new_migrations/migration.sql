-- CreateEnum
CREATE TYPE "public"."TransferStatus" AS ENUM ('SENT', 'USED', 'RETURNED', 'CANCELLED');

-- DropForeignKey
ALTER TABLE "public"."InvoiceItem" DROP CONSTRAINT "InvoiceItem_invoiceId_fkey";

-- DropForeignKey
ALTER TABLE "public"."InvoiceItem" DROP CONSTRAINT "InvoiceItem_productId_fkey";

-- AlterTable
ALTER TABLE "public"."Product" ADD COLUMN     "quantity" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "public"."RawMaterial" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unit" TEXT DEFAULT 'pcs',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RawMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProductStructure" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "rawMaterialId" INTEGER NOT NULL,
    "quantityRequired" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductStructure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RawMaterialTransfer" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "rawMaterialId" INTEGER NOT NULL,
    "quantityIssued" DOUBLE PRECISION NOT NULL,
    "status" "public"."TransferStatus" NOT NULL DEFAULT 'SENT',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RawMaterialTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductStructure_productId_rawMaterialId_key" ON "public"."ProductStructure"("productId", "rawMaterialId");

-- AddForeignKey
ALTER TABLE "public"."InvoiceItem" ADD CONSTRAINT "InvoiceItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "public"."Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InvoiceItem" ADD CONSTRAINT "InvoiceItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductStructure" ADD CONSTRAINT "ProductStructure_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductStructure" ADD CONSTRAINT "ProductStructure_rawMaterialId_fkey" FOREIGN KEY ("rawMaterialId") REFERENCES "public"."RawMaterial"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RawMaterialTransfer" ADD CONSTRAINT "RawMaterialTransfer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RawMaterialTransfer" ADD CONSTRAINT "RawMaterialTransfer_rawMaterialId_fkey" FOREIGN KEY ("rawMaterialId") REFERENCES "public"."RawMaterial"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
