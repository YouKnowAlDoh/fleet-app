-- CreateTable
CREATE TABLE "public"."Asset" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "assetType" TEXT NOT NULL,
    "vin" TEXT,
    "plate" TEXT,
    "year" INTEGER,
    "make" TEXT,
    "model" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "meterUnit" TEXT NOT NULL DEFAULT 'MILES',
    "currentMeter" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);
