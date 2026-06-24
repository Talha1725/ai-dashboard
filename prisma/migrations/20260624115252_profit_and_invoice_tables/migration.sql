-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "RefreshSource" ADD VALUE 'PROFIT_EXCEL';
ALTER TYPE "RefreshSource" ADD VALUE 'INVOICES_EXCEL';

-- CreateTable
CREATE TABLE "ProfitUpload" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "netProfit" DOUBLE PRECISION NOT NULL,
    "grossProfit" DOUBLE PRECISION NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProfitUpload_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoicesUpload" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "invoiceCount" INTEGER NOT NULL,
    "parsedData" JSONB NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvoicesUpload_pkey" PRIMARY KEY ("id")
);
