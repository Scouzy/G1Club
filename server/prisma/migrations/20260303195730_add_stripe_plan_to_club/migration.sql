-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Club" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "logoUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "facebook" TEXT,
    "instagram" TEXT,
    "twitter" TEXT,
    "youtube" TEXT,
    "tiktok" TEXT,
    "linkedin" TEXT,
    "plan" TEXT NOT NULL DEFAULT 'STARTER',
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "stripePriceId" TEXT,
    "planExpiresAt" DATETIME
);
INSERT INTO "new_Club" ("address", "city", "createdAt", "email", "facebook", "id", "instagram", "linkedin", "logoUrl", "name", "phone", "tiktok", "twitter", "updatedAt", "website", "youtube") SELECT "address", "city", "createdAt", "email", "facebook", "id", "instagram", "linkedin", "logoUrl", "name", "phone", "tiktok", "twitter", "updatedAt", "website", "youtube" FROM "Club";
DROP TABLE "Club";
ALTER TABLE "new_Club" RENAME TO "Club";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
