/*
  Warnings:

  - You are about to drop the column `customerEmail` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `customerName` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `customerNumber` on the `payments` table. All the data in the column will be lost.
  - Added the required column `customerId` to the `payments` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Customer" ADD COLUMN     "email" TEXT;

-- AlterTable
ALTER TABLE "public"."payments" DROP COLUMN "customerEmail",
DROP COLUMN "customerName",
DROP COLUMN "customerNumber",
ADD COLUMN     "customerId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
