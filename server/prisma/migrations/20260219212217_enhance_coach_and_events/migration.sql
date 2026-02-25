-- AlterTable
ALTER TABLE "Coach" ADD COLUMN "address" TEXT;
ALTER TABLE "Coach" ADD COLUMN "bio" TEXT;
ALTER TABLE "Coach" ADD COLUMN "experience" TEXT;
ALTER TABLE "Coach" ADD COLUMN "phone" TEXT;
ALTER TABLE "Coach" ADD COLUMN "photoUrl" TEXT;
ALTER TABLE "Coach" ADD COLUMN "qualifications" TEXT;
ALTER TABLE "Coach" ADD COLUMN "specialties" TEXT;

-- AlterTable
ALTER TABLE "Training" ADD COLUMN "location" TEXT;
ALTER TABLE "Training" ADD COLUMN "opponent" TEXT;
ALTER TABLE "Training" ADD COLUMN "result" TEXT;
