/*
  Warnings:

  - You are about to drop the column `number` on the `Customer` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[phone]` on the table `Customer` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Customer_number_key";

-- AlterTable
ALTER TABLE "Customer" DROP COLUMN "number",
ADD COLUMN     "phone" TEXT NOT NULL DEFAULT '';

-- CreateIndex
CREATE UNIQUE INDEX "Customer_phone_key" ON "Customer"("phone");
