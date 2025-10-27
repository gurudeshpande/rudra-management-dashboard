-- CreateTable
CREATE TABLE "public"."receipt_counters" (
    "id" TEXT NOT NULL,
    "financialYear" TEXT NOT NULL,
    "lastNumber" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "receipt_counters_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "receipt_counters_financialYear_key" ON "public"."receipt_counters"("financialYear");
