-- /*
--   Warnings:

--   - You are about to drop the column `categoryId` on the `Product` table. All the data in the column will be lost.
--   - You are about to drop the column `description` on the `categories` table. All the data in the column will be lost.
--   - Added the required column `category` to the `Product` table without a default value. This is not possible if the table is not empty.

-- */
-- -- DropForeignKey
-- ALTER TABLE "Product" DROP CONSTRAINT "Product_categoryId_fkey";

-- -- DropIndex
-- DROP INDEX "Product_categoryId_idx";

-- -- DropIndex
-- DROP INDEX "Product_name_idx";

-- -- AlterTable
-- ALTER TABLE "Product" DROP COLUMN "categoryId",
-- ADD COLUMN     "category" TEXT NOT NULL;

-- -- AlterTable
-- ALTER TABLE "categories" DROP COLUMN "description";
