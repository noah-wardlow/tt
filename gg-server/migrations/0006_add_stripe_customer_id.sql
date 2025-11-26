-- Migration: Add stripeCustomerId to user table
-- Add stripeCustomerId column
ALTER TABLE "user" ADD COLUMN "stripeCustomerId" TEXT;

-- Create unique index on stripeCustomerId
CREATE UNIQUE INDEX "user_stripeCustomerId_key" ON "user"("stripeCustomerId");
