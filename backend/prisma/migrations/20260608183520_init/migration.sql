CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

CREATE TYPE "AuthProtocol" AS ENUM ('NONE', 'MD5', 'SHA');

CREATE TYPE "PrivacyProtocol" AS ENUM ('NONE', 'DES', 'AES');

CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "devices" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "port" INTEGER NOT NULL DEFAULT 161,
    "authProtocol" "AuthProtocol" NOT NULL DEFAULT 'NONE',
    "authPasswordHash" TEXT,
    "privacyProtocol" "PrivacyProtocol" NOT NULL DEFAULT 'NONE',
    "privacyPasswordHash" TEXT,
    "snmpUsername" TEXT NOT NULL DEFAULT 'bootstrapUser',
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "devices_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "device_metrics" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "battery" INTEGER NOT NULL,
    "uptime" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "temperature" DOUBLE PRECISION NOT NULL,
    "collectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "device_metrics_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

CREATE UNIQUE INDEX "organizations_name_key" ON "organizations"("name");

CREATE INDEX "device_metrics_deviceId_collectedAt_idx" ON "device_metrics"("deviceId", "collectedAt");

ALTER TABLE "users" ADD CONSTRAINT "users_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "devices" ADD CONSTRAINT "devices_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "device_metrics" ADD CONSTRAINT "device_metrics_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
