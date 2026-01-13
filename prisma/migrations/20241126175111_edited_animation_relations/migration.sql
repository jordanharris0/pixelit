-- AlterTable
ALTER TABLE "AnimationSetting" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "isDraft" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "updatedAt" TIMESTAMP(3),
ALTER COLUMN "exportFormat" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "hasAnimation" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Animation" (
    "animationId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT,
    "frames" JSONB NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "isDraft" BOOLEAN NOT NULL DEFAULT true,
    "hasSpriteSheet" BOOLEAN NOT NULL DEFAULT false,
    "hasGif" BOOLEAN NOT NULL DEFAULT false,
    "hasMp4" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Animation_pkey" PRIMARY KEY ("animationId")
);

-- AddForeignKey
ALTER TABLE "Animation" ADD CONSTRAINT "Animation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("projectId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnimationSetting" ADD CONSTRAINT "AnimationSetting_animationId_fkey" FOREIGN KEY ("animationId") REFERENCES "Animation"("animationId") ON DELETE CASCADE ON UPDATE CASCADE;
