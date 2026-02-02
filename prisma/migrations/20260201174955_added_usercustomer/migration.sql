-- CreateTable
CREATE TABLE "UserCustomer" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT NOT NULL,
    "billingAddress" TEXT,
    "gst" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserCustomer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserCustomer_phone_key" ON "UserCustomer"("phone");

-- CreateIndex
CREATE INDEX "UserCustomer_name_idx" ON "UserCustomer"("name");

-- CreateIndex
CREATE INDEX "UserCustomer_email_idx" ON "UserCustomer"("email");

-- CreateIndex
CREATE INDEX "UserCustomer_phone_idx" ON "UserCustomer"("phone");

-- CreateIndex
CREATE INDEX "UserCustomer_gst_idx" ON "UserCustomer"("gst");

-- CreateIndex
CREATE INDEX "UserCustomer_createdAt_idx" ON "UserCustomer"("createdAt");
