/*
  Warnings:

  - You are about to drop the column `timestamp` on the `ActivityLog` table. All the data in the column will be lost.
  - You are about to drop the column `timestamp` on the `Version` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ActivityLog" DROP COLUMN "timestamp",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Version" DROP COLUMN "timestamp",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
