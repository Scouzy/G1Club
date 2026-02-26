-- AlterTable
ALTER TABLE "Licence" ADD COLUMN "totalAmount" REAL;

-- CreateTable
CREATE TABLE "LicencePayment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "installment" INTEGER NOT NULL,
    "amount" REAL NOT NULL,
    "dueDate" DATETIME NOT NULL,
    "paidDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "method" TEXT,
    "reference" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "licenceId" TEXT NOT NULL,
    CONSTRAINT "LicencePayment_licenceId_fkey" FOREIGN KEY ("licenceId") REFERENCES "Licence" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
