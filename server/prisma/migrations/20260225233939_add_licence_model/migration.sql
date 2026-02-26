-- CreateTable
CREATE TABLE "Licence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "number" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "startDate" DATETIME NOT NULL,
    "expiryDate" DATETIME NOT NULL,
    "federation" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "sportifId" TEXT NOT NULL,
    CONSTRAINT "Licence_sportifId_fkey" FOREIGN KEY ("sportifId") REFERENCES "Sportif" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
