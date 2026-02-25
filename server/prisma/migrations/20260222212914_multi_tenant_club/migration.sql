-- CreateTable Club
CREATE TABLE "Club" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "logoUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Insert default club (migrate existing data into it)
-- Use logoUrl from ClubSettings if it exists
INSERT INTO "Club" ("id", "name", "logoUrl", "createdAt", "updatedAt")
SELECT
    'default-club-id',
    COALESCE((SELECT "clubName" FROM "ClubSettings" LIMIT 1), 'G1Club'),
    (SELECT "logoUrl" FROM "ClubSettings" LIMIT 1),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP;

-- Drop old ClubSettings table
PRAGMA foreign_keys=off;
DROP TABLE "ClubSettings";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

-- Migrate Category: add clubId column with default club
CREATE TABLE "new_Category" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "clubId" TEXT NOT NULL DEFAULT 'default-club-id',
    CONSTRAINT "Category_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Category" ("id", "name", "clubId") SELECT "id", "name", 'default-club-id' FROM "Category";
DROP TABLE "Category";
ALTER TABLE "new_Category" RENAME TO "Category";
CREATE UNIQUE INDEX "Category_clubId_name_key" ON "Category"("clubId", "name");

-- Migrate User: add clubId column pointing to default club
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'SPORTIF',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "clubId" TEXT,
    CONSTRAINT "User_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_User" ("createdAt", "email", "id", "name", "password", "role", "updatedAt", "clubId")
    SELECT "createdAt", "email", "id", "name", "password", "role", "updatedAt", 'default-club-id' FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
