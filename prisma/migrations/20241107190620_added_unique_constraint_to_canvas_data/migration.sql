/*
  Warnings:

  - A unique constraint covering the columns `[projectId,frameNumber]` on the table `CanvasData` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "CanvasData_projectId_frameNumber_key" ON "CanvasData"("projectId", "frameNumber");
