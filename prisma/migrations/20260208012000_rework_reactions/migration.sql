-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_Reaction" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "targetType" TEXT NOT NULL,
    "targetId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "authorClientId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Existing post-only reactions (if any) are migrated to targetType='post'.
INSERT INTO "new_Reaction" ("id", "targetType", "targetId", "type", "authorClientId", "createdAt")
SELECT "id", 'post', "postId", "type", '' as "authorClientId", "createdAt"
FROM "Reaction";

DROP TABLE "Reaction";
ALTER TABLE "new_Reaction" RENAME TO "Reaction";

CREATE INDEX "Reaction_targetType_targetId_idx" ON "Reaction"("targetType", "targetId");
CREATE INDEX "Reaction_authorClientId_idx" ON "Reaction"("authorClientId");
CREATE UNIQUE INDEX "Reaction_targetType_targetId_type_authorClientId_key"
  ON "Reaction"("targetType", "targetId", "type", "authorClientId");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
