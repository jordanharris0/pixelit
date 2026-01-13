-- AlterTable
ALTER TABLE "User" ADD COLUMN     "showBookmarks" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showDownloadHistory" BOOLEAN NOT NULL DEFAULT true;
