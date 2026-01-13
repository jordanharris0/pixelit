/*
  Warnings:

  - You are about to drop the column `projectId` on the `AnimationSetting` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "AnimationSetting_projectId_key";

-- AlterTable
ALTER TABLE "AnimationSetting" DROP COLUMN "projectId";
