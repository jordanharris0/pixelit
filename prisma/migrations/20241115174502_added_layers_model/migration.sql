-- CreateTable
CREATE TABLE "Layer" (
    "layerId" TEXT NOT NULL,
    "canvasId" TEXT NOT NULL,
    "name" TEXT,
    "pixels" JSONB NOT NULL,
    "opacity" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "zIndex" INTEGER NOT NULL,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Layer_pkey" PRIMARY KEY ("layerId")
);

-- AddForeignKey
ALTER TABLE "Layer" ADD CONSTRAINT "Layer_canvasId_fkey" FOREIGN KEY ("canvasId") REFERENCES "CanvasData"("canvasId") ON DELETE CASCADE ON UPDATE CASCADE;
