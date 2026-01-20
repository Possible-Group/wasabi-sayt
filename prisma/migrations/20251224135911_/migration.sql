-- AlterTable
ALTER TABLE "ProductTranslation" ADD COLUMN "seoDescRu" TEXT;
ALTER TABLE "ProductTranslation" ADD COLUMN "seoDescUz" TEXT;
ALTER TABLE "ProductTranslation" ADD COLUMN "seoKeywordsRu" TEXT;
ALTER TABLE "ProductTranslation" ADD COLUMN "seoKeywordsUz" TEXT;
ALTER TABLE "ProductTranslation" ADD COLUMN "seoTitleRu" TEXT;
ALTER TABLE "ProductTranslation" ADD COLUMN "seoTitleUz" TEXT;

-- AlterTable
ALTER TABLE "SeoMeta" ADD COLUMN "keywords" TEXT;

-- CreateTable
CREATE TABLE "CategoryTranslation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "categoryId" TEXT NOT NULL,
    "nameUz" TEXT,
    "seoTitleRu" TEXT,
    "seoDescRu" TEXT,
    "seoKeywordsRu" TEXT,
    "seoTitleUz" TEXT,
    "seoDescUz" TEXT,
    "seoKeywordsUz" TEXT,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Banner" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "imageUrl" TEXT NOT NULL,
    "href" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Review" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "authorName" TEXT NOT NULL,
    "authorRole" TEXT,
    "titleRu" TEXT,
    "titleUz" TEXT,
    "textRu" TEXT,
    "textUz" TEXT,
    "rating" INTEGER NOT NULL DEFAULT 5,
    "photoUrl" TEXT,
    "publishedAt" DATETIME,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ContentPage" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "slug" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "title" TEXT,
    "body" TEXT,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "seoKeywords" TEXT,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "CategoryTranslation_categoryId_key" ON "CategoryTranslation"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "ContentPage_slug_locale_key" ON "ContentPage"("slug", "locale");
