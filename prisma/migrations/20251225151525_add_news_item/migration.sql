-- CreateTable
CREATE TABLE "NewsItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "slug" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "titleRu" TEXT NOT NULL,
    "titleUz" TEXT NOT NULL,
    "excerptRu" TEXT NOT NULL,
    "excerptUz" TEXT NOT NULL,
    "bodyRu" TEXT NOT NULL,
    "bodyUz" TEXT NOT NULL,
    "seoTitleRu" TEXT,
    "seoDescriptionRu" TEXT,
    "seoKeywordsRu" TEXT,
    "seoTitleUz" TEXT,
    "seoDescriptionUz" TEXT,
    "seoKeywordsUz" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "publishedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "NewsItem_slug_key" ON "NewsItem"("slug");
