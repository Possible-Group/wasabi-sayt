-- CreateTable
CREATE TABLE "BotSetting" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CategoryEmoji" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "categoryId" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "login" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Order" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "externalId" TEXT,
    "customerPhone" TEXT NOT NULL,
    "customerName" TEXT,
    "deliveryType" TEXT NOT NULL,
    "address" TEXT,
    "lat" REAL,
    "lng" REAL,
    "persons" INTEGER NOT NULL DEFAULT 1,
    "itemsJson" TEXT NOT NULL,
    "subtotal" INTEGER NOT NULL,
    "packageFee" INTEGER NOT NULL,
    "deliveryFee" INTEGER NOT NULL,
    "discount" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'new',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "PromoCode" (
    "code" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "startsAt" DATETIME,
    "endsAt" DATETIME
);

-- CreateTable
CREATE TABLE "ProductTranslation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "productId" TEXT NOT NULL,
    "nameUz" TEXT,
    "descUz" TEXT,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SeoMeta" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "page" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "ogImage" TEXT,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "adminId" INTEGER,
    "action" TEXT NOT NULL,
    "metaJson" TEXT,
    "ip" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "CategoryEmoji_categoryId_key" ON "CategoryEmoji"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_login_key" ON "AdminUser"("login");

-- CreateIndex
CREATE UNIQUE INDEX "Order_externalId_key" ON "Order"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductTranslation_productId_key" ON "ProductTranslation"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "SeoMeta_page_locale_key" ON "SeoMeta"("page", "locale");
