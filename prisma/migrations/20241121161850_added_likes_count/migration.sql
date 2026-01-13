-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "likesCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "likesCount" INTEGER NOT NULL DEFAULT 0;
