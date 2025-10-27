-- CreateTable
CREATE TABLE "public"."UserInventory" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "rawMaterialId" INTEGER NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL DEFAULT 'pcs',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserInventory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserInventory_userId_rawMaterialId_key" ON "public"."UserInventory"("userId", "rawMaterialId");

-- AddForeignKey
ALTER TABLE "public"."UserInventory" ADD CONSTRAINT "UserInventory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserInventory" ADD CONSTRAINT "UserInventory_rawMaterialId_fkey" FOREIGN KEY ("rawMaterialId") REFERENCES "public"."RawMaterial"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
