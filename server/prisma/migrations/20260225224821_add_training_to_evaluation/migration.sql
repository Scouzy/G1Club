-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Evaluation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL,
    "ratings" TEXT NOT NULL,
    "comment" TEXT,
    "sportifId" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "trainingId" TEXT,
    CONSTRAINT "Evaluation_sportifId_fkey" FOREIGN KEY ("sportifId") REFERENCES "Sportif" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Evaluation_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "Coach" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Evaluation_trainingId_fkey" FOREIGN KEY ("trainingId") REFERENCES "Training" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Evaluation" ("coachId", "comment", "date", "id", "ratings", "sportifId", "type") SELECT "coachId", "comment", "date", "id", "ratings", "sportifId", "type" FROM "Evaluation";
DROP TABLE "Evaluation";
ALTER TABLE "new_Evaluation" RENAME TO "Evaluation";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
