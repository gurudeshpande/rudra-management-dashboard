-- CreateEnum
CREATE TYPE "public"."ProductTransferStatus" AS ENUM ('SENT', 'RECEIVED', 'REJECTED', 'CANCELLED');

-- CreateTable
CREATE TABLE "public"."ProductTransfer" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" INTEGER NOT NULL,
    "quantitySent" INTEGER NOT NULL,
    "status" "public"."ProductTransferStatus" NOT NULL DEFAULT 'SENT',
    "notes" TEXT,
    "receivedBy" TEXT,
    "receivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductTransfer_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."ProductTransfer" ADD CONSTRAINT "ProductTransfer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductTransfer" ADD CONSTRAINT "ProductTransfer_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
