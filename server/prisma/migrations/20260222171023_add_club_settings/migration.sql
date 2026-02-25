-- CreateTable
CREATE TABLE "ClubSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clubName" TEXT NOT NULL DEFAULT 'G1Club',
    "logoUrl" TEXT,
    "updatedAt" DATETIME NOT NULL
);
