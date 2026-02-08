-- AlterTable
ALTER TABLE "Post" ADD COLUMN "pinnedAt" DATETIME;

-- AlterTable
ALTER TABLE "Thread" ADD COLUMN "pinnedAt" DATETIME;

-- CreateIndex
CREATE INDEX "Post_pinnedAt_idx" ON "Post"("pinnedAt");

-- CreateIndex
CREATE INDEX "Thread_pinnedAt_idx" ON "Thread"("pinnedAt");
