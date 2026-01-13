-- Migration file: prisma/migrations/[timestamp]_add_category_table.sql

-- Step 1: Create Category table
CREATE TABLE "categories" (
    "id" SERIAL PRIMARY KEY,
    "name" TEXT NOT NULL UNIQUE,
    "slug" TEXT NOT NULL UNIQUE,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- Step 2: Insert initial categories
INSERT INTO "categories" ("name", "slug", "createdAt", "updatedAt") VALUES
('Mavala', 'mavala', NOW(), NOW()),
('Maharaj', 'maharaj', NOW(), NOW()),
('Shastra (Weapons)', 'shastra-weapons', NOW(), NOW()),
('Miniature Weapons', 'miniature-weapons', NOW(), NOW()),
('Miniatures', 'miniatures', NOW(), NOW()),
('Spiritual Statues', 'spiritual-statues', NOW(), NOW()),
('Car Dashboard', 'car-dashboard', NOW(), NOW()),
('Frame Collection', 'frame-collection', NOW(), NOW()),
('Shilekhana (Weapon Vault)', 'shilekhana-weapon-vault', NOW(), NOW()),
('Symbolic & Cultural Artefacts', 'symbolic-cultural-artefacts', NOW(), NOW()),
('Sanch', 'sanch', NOW(), NOW()),
('Keychains', 'keychains', NOW(), NOW()),
('Jewellery', 'jewellery', NOW(), NOW()),
('Historical Legends', 'historical-legends', NOW(), NOW()),
('Badges', 'badges', NOW(), NOW()),
('Taxidermy', 'taxidermy', NOW(), NOW()),
('Mudra', 'mudra', NOW(), NOW());

-- Step 3: Add categoryId column to Product table with NULL allowed temporarily
ALTER TABLE "Product" ADD COLUMN "categoryId" INTEGER;

-- Step 4: Create a temporary "Other" category for products without matching category
INSERT INTO "categories" ("name", "slug", "createdAt", "updatedAt")
VALUES ('Other', 'other', NOW(), NOW());

-- Step 5: Update existing products with category IDs based on their current category text
UPDATE "Product" p
SET "categoryId" = c.id
FROM "categories" c
WHERE LOWER(TRIM(p.category)) = LOWER(c.name);

-- Step 6: For products that don't have a matching category, assign "Other"
UPDATE "Product" p
SET "categoryId" = (SELECT id FROM "categories" WHERE slug = 'other')
WHERE p."categoryId" IS NULL;

-- Step 7: Remove the old category column (optional - you can keep it temporarily)
-- ALTER TABLE "Product" DROP COLUMN "category";

-- Step 8: Make categoryId required and add foreign key constraint
ALTER TABLE "Product" 
ALTER COLUMN "categoryId" SET NOT NULL;

ALTER TABLE "Product" 
ADD CONSTRAINT "Product_categoryId_fkey" 
FOREIGN KEY ("categoryId") 
REFERENCES "categories"("id");

-- Step 9: Create indexes
CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");
CREATE INDEX "Product_name_idx" ON "Product"("name");