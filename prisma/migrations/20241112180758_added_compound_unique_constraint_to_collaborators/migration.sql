/*
  Warnings:

  - A unique constraint covering the columns `[userId,projectId]` on the table `Collaboration` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Collaboration_userId_projectId_key" ON "Collaboration"("userId", "projectId");
