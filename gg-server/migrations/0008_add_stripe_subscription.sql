-- CreateTable: subscription
-- This table is required by Better Auth's Stripe plugin for subscription management
CREATE TABLE "subscription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "plan" TEXT NOT NULL,
    "referenceId" TEXT NOT NULL,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'incomplete',
    "periodStart" INTEGER,
    "periodEnd" INTEGER,
    "cancelAtPeriodEnd" INTEGER NOT NULL DEFAULT 0,
    "seats" INTEGER,
    "trialStart" INTEGER,
    "trialEnd" INTEGER
);

-- CreateIndex
CREATE UNIQUE INDEX "subscription_referenceId_key" ON "subscription"("referenceId");
