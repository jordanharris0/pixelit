/*
  Warnings:

  - Made the column `updatedAt` on table `AnimationSetting` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "AnimationSetting" ADD COLUMN     "spriteSheetOptions" JSONB,
ALTER COLUMN "updatedAt" SET NOT NULL;
