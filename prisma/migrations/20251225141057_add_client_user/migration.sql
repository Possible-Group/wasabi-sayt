-- CreateTable
CREATE TABLE "ClientUser" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "posterClientId" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "phoneNormalized" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "ClientUser_posterClientId_key" ON "ClientUser"("posterClientId");

-- CreateIndex
CREATE UNIQUE INDEX "ClientUser_phoneNormalized_key" ON "ClientUser"("phoneNormalized");
