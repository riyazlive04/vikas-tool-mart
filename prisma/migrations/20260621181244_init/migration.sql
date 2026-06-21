-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'HEAD', 'CRE');

-- CreateEnum
CREATE TYPE "Locale" AS ENUM ('en', 'ta');

-- CreateEnum
CREATE TYPE "KpiType" AS ENUM ('NUMBER', 'COUNT', 'CHECK', 'RATING');

-- CreateEnum
CREATE TYPE "AutoSource" AS ENUM ('WOO_NEW_CUSTOMERS', 'WOO_REPEAT_CUSTOMERS', 'WOO_ONSITE_REVIEWS', 'WOO_AVG_RATING', 'DERIVED_COMPLAINTS_LOGGED', 'DERIVED_COMPLAINTS_ASSIGNED', 'WORKLIST_CONTACTED', 'WORKLIST_REVIEW_REQ', 'WORKLIST_UNBOXING_REQ', 'WORKLIST_TESTIMONIAL_REQ');

-- CreateEnum
CREATE TYPE "ValueSource" AS ENUM ('AUTO', 'MANUAL');

-- CreateEnum
CREATE TYPE "ReviewSourceSetting" AS ENUM ('WOO', 'CUSREV');

-- CreateEnum
CREATE TYPE "WooReviewSource" AS ENUM ('WOO_CUSREV', 'GOOGLE');

-- CreateEnum
CREATE TYPE "OrderActionType" AS ENUM ('CONTACTED', 'REVIEW_REQ', 'UNBOXING_REQ', 'TESTIMONIAL_REQ');

-- CreateEnum
CREATE TYPE "ComplaintCategory" AS ENUM ('WARRANTY', 'DEFECT', 'DELIVERY', 'PRODUCT', 'OTHER');

-- CreateEnum
CREATE TYPE "ComplaintStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED');

-- CreateEnum
CREATE TYPE "SyncType" AS ENUM ('SCHEDULED', 'MANUAL');

-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('OK', 'PARTIAL', 'FAILED');

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "role" "Role" NOT NULL DEFAULT 'CRE',
    "department" TEXT,
    "locale" "Locale" NOT NULL DEFAULT 'en',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "setting" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "wooStoreUrl" TEXT,
    "wooKey" TEXT,
    "wooSecret" TEXT,
    "syncCron" TEXT NOT NULL DEFAULT '30 6 * * *',
    "reviewSource" "ReviewSourceSetting" NOT NULL DEFAULT 'WOO',
    "googleReviewsAuto" BOOLEAN NOT NULL DEFAULT false,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "setting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kpi_definition" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "labelTa" TEXT,
    "type" "KpiType" NOT NULL,
    "target" DOUBLE PRECISION,
    "autoSource" "AutoSource",
    "unit" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kpi_definition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_definition" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "labelTa" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "task_definition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_channel" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "handle" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_channel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_entry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "achievement" TEXT,
    "issues" TEXT,
    "commitment" TEXT,
    "notes" TEXT,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_entry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kpi_value" (
    "id" TEXT NOT NULL,
    "dailyEntryId" TEXT NOT NULL,
    "kpiDefinitionId" TEXT NOT NULL,
    "autoValue" DOUBLE PRECISION,
    "manualValue" DOUBLE PRECISION,
    "source" "ValueSource" NOT NULL DEFAULT 'AUTO',
    "overriddenById" TEXT,
    "overriddenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kpi_value_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_completion" (
    "id" TEXT NOT NULL,
    "dailyEntryId" TEXT NOT NULL,
    "taskDefinitionId" TEXT NOT NULL,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "task_completion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_snapshot" (
    "id" TEXT NOT NULL,
    "dailyEntryId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "yesterdayCount" INTEGER,
    "todayCount" INTEGER,
    "source" "ValueSource" NOT NULL DEFAULT 'MANUAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_snapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "complaint" (
    "id" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT,
    "wooOrderRef" TEXT,
    "category" "ComplaintCategory" NOT NULL DEFAULT 'OTHER',
    "description" TEXT NOT NULL,
    "status" "ComplaintStatus" NOT NULL DEFAULT 'OPEN',
    "assignedToId" TEXT,
    "loggedById" TEXT NOT NULL,
    "loggedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "followUpAt" TIMESTAMP(3),
    "resolutionNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "complaint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "woo_customer" (
    "id" TEXT NOT NULL,
    "wooId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "firstOrderDate" TIMESTAMP(3),
    "orderCount" INTEGER NOT NULL DEFAULT 0,
    "isRepeat" BOOLEAN NOT NULL DEFAULT false,
    "totalSpent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastSyncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "woo_customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "woo_order" (
    "id" TEXT NOT NULL,
    "wooId" INTEGER NOT NULL,
    "number" TEXT NOT NULL,
    "customerWooId" INTEGER,
    "customerName" TEXT NOT NULL,
    "total" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL,
    "dateCreated" TIMESTAMP(3) NOT NULL,
    "itemsJson" JSONB,
    "lastSyncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "woo_order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "woo_review" (
    "id" TEXT NOT NULL,
    "wooId" INTEGER NOT NULL,
    "source" "WooReviewSource" NOT NULL DEFAULT 'WOO_CUSREV',
    "rating" INTEGER NOT NULL,
    "reviewerName" TEXT NOT NULL,
    "productName" TEXT,
    "dateCreated" TIMESTAMP(3) NOT NULL,
    "text" TEXT,
    "lastSyncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "woo_review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_action" (
    "id" TEXT NOT NULL,
    "wooOrderId" TEXT NOT NULL,
    "dailyEntryId" TEXT NOT NULL,
    "action" "OrderActionType" NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_action_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_log" (
    "id" TEXT NOT NULL,
    "type" "SyncType" NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "status" "SyncStatus" NOT NULL DEFAULT 'OK',
    "recordsPulled" JSONB,
    "error" TEXT,

    CONSTRAINT "sync_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE UNIQUE INDEX "kpi_definition_key_key" ON "kpi_definition"("key");

-- CreateIndex
CREATE UNIQUE INDEX "daily_entry_userId_date_key" ON "daily_entry"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "kpi_value_dailyEntryId_kpiDefinitionId_key" ON "kpi_value"("dailyEntryId", "kpiDefinitionId");

-- CreateIndex
CREATE UNIQUE INDEX "task_completion_dailyEntryId_taskDefinitionId_key" ON "task_completion"("dailyEntryId", "taskDefinitionId");

-- CreateIndex
CREATE UNIQUE INDEX "social_snapshot_dailyEntryId_channelId_key" ON "social_snapshot"("dailyEntryId", "channelId");

-- CreateIndex
CREATE INDEX "complaint_status_idx" ON "complaint"("status");

-- CreateIndex
CREATE INDEX "complaint_loggedAt_idx" ON "complaint"("loggedAt");

-- CreateIndex
CREATE UNIQUE INDEX "woo_customer_wooId_key" ON "woo_customer"("wooId");

-- CreateIndex
CREATE UNIQUE INDEX "woo_order_wooId_key" ON "woo_order"("wooId");

-- CreateIndex
CREATE INDEX "woo_order_dateCreated_idx" ON "woo_order"("dateCreated");

-- CreateIndex
CREATE UNIQUE INDEX "woo_review_wooId_key" ON "woo_review"("wooId");

-- CreateIndex
CREATE INDEX "woo_review_dateCreated_idx" ON "woo_review"("dateCreated");

-- CreateIndex
CREATE INDEX "order_action_dailyEntryId_action_idx" ON "order_action"("dailyEntryId", "action");

-- CreateIndex
CREATE UNIQUE INDEX "order_action_wooOrderId_action_dailyEntryId_key" ON "order_action"("wooOrderId", "action", "dailyEntryId");

-- CreateIndex
CREATE INDEX "sync_log_startedAt_idx" ON "sync_log"("startedAt");

-- CreateIndex
CREATE INDEX "audit_log_createdAt_idx" ON "audit_log"("createdAt");

-- CreateIndex
CREATE INDEX "audit_log_entity_entityId_idx" ON "audit_log"("entity", "entityId");

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_entry" ADD CONSTRAINT "daily_entry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kpi_value" ADD CONSTRAINT "kpi_value_dailyEntryId_fkey" FOREIGN KEY ("dailyEntryId") REFERENCES "daily_entry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kpi_value" ADD CONSTRAINT "kpi_value_kpiDefinitionId_fkey" FOREIGN KEY ("kpiDefinitionId") REFERENCES "kpi_definition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kpi_value" ADD CONSTRAINT "kpi_value_overriddenById_fkey" FOREIGN KEY ("overriddenById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_completion" ADD CONSTRAINT "task_completion_dailyEntryId_fkey" FOREIGN KEY ("dailyEntryId") REFERENCES "daily_entry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_completion" ADD CONSTRAINT "task_completion_taskDefinitionId_fkey" FOREIGN KEY ("taskDefinitionId") REFERENCES "task_definition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_snapshot" ADD CONSTRAINT "social_snapshot_dailyEntryId_fkey" FOREIGN KEY ("dailyEntryId") REFERENCES "daily_entry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_snapshot" ADD CONSTRAINT "social_snapshot_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "social_channel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaint" ADD CONSTRAINT "complaint_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaint" ADD CONSTRAINT "complaint_loggedById_fkey" FOREIGN KEY ("loggedById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_action" ADD CONSTRAINT "order_action_wooOrderId_fkey" FOREIGN KEY ("wooOrderId") REFERENCES "woo_order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_action" ADD CONSTRAINT "order_action_dailyEntryId_fkey" FOREIGN KEY ("dailyEntryId") REFERENCES "daily_entry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_action" ADD CONSTRAINT "order_action_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
