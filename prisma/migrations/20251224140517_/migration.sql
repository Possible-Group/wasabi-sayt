-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Banner" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "imageUrl" TEXT NOT NULL,
    "href" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'all',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Banner" ("active", "createdAt", "href", "id", "imageUrl", "sortOrder", "updatedAt") SELECT "active", "createdAt", "href", "id", "imageUrl", "sortOrder", "updatedAt" FROM "Banner";
DROP TABLE "Banner";
ALTER TABLE "new_Banner" RENAME TO "Banner";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
