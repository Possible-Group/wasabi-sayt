-- Add optional sort order for category and product ordering
ALTER TABLE "CategoryTranslation" ADD COLUMN "sortOrder" INTEGER;
ALTER TABLE "ProductTranslation" ADD COLUMN "sortOrder" INTEGER;
