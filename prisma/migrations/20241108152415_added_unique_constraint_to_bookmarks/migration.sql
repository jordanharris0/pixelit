/*
  Warnings:

  - A unique constraint covering the columns `[projectId,userId]` on the table `Bookmark` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Bookmark_projectId_userId_key" ON "Bookmark"("projectId", "userId");
