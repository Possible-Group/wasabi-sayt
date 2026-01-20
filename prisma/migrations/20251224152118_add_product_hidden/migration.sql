-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ProductTranslation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "productId" TEXT NOT NULL,
    "nameUz" TEXT,
    "descUz" TEXT,
    "seoTitleRu" TEXT,
    "seoDescRu" TEXT,
    "seoKeywordsRu" TEXT,
    "seoTitleUz" TEXT,
    "seoDescUz" TEXT,
    "seoKeywordsUz" TEXT,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_ProductTranslation" ("descUz", "id", "nameUz", "productId", "seoDescRu", "seoDescUz", "seoKeywordsRu", "seoKeywordsUz", "seoTitleRu", "seoTitleUz", "updatedAt") SELECT "descUz", "id", "nameUz", "productId", "seoDescRu", "seoDescUz", "seoKeywordsRu", "seoKeywordsUz", "seoTitleRu", "seoTitleUz", "updatedAt" FROM "ProductTranslation";
DROP TABLE "ProductTranslation";
ALTER TABLE "new_ProductTranslation" RENAME TO "ProductTranslation";
CREATE UNIQUE INDEX "ProductTranslation_productId_key" ON "ProductTranslation"("productId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
