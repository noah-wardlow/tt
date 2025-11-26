# Stripe Integration Guide

This project uses [Better Auth's Stripe plugin](https://www.better-auth.com/docs/plugins/stripe) for integrated authentication and subscription management.

## Architecture Overview

- **Customer Management**: Automatically creates Stripe customers when users sign up
- **Subscription Management**: Full subscription lifecycle (create, update, cancel, restore)
- **Webhook Handling**:
  - Better Auth handles standard Stripe webhooks at `/api/auth/stripe/webhook`
  - Custom Stripe Connect webhooks at `/api/stripe/connect-webhook`
- **Trial Abuse Prevention**: Built-in protection against users signing up for multiple free trials

## Required Environment Variables

### Development (`.dev.vars`)

Create `tt-server/.dev.vars` with:

```bash
# Stripe API Keys
STRIPE_SECRET_KEY=sk_test_...

# Stripe Webhook Secrets
STRIPE_WEBHOOK_SECRET=whsec_...           # For standard subscriptions
STRIPE_CONNECT_WEBHOOK_SECRET=whsec_...   # For Stripe Connect (if using)

# Auth Secret
BETTER_AUTH_SECRET=your-secret-here

# OAuth Providers (optional)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
DISCORD_CLIENT_ID=...
DISCORD_CLIENT_SECRET=...
```

### Production (Cloudflare Secrets)

Set secrets using `wrangler secret put`:

```bash
cd tt-server

# Required
wrangler secret put STRIPE_SECRET_KEY
wrangler secret put STRIPE_WEBHOOK_SECRET
wrangler secret put BETTER_AUTH_SECRET

# Optional (Stripe Connect)
wrangler secret put STRIPE_CONNECT_WEBHOOK_SECRET

# OAuth Providers
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET
wrangler secret put DISCORD_CLIENT_ID
wrangler secret put DISCORD_CLIENT_SECRET
```

## Stripe Dashboard Setup

### 1. Get Your API Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Navigate to **Developers → API keys**
3. Copy your **Secret key** (starts with `sk_test_` or `sk_live_`)
4. Add to `.dev.vars` as `STRIPE_SECRET_KEY`

### 2. Configure Webhooks

#### A. Standard Subscription Webhooks (Required)

1. Go to **Developers → Webhooks**
2. Click **Add endpoint**
3. Configure:
   - **Endpoint URL**: `https://your-domain.com/api/auth/stripe/webhook`
   - **Description**: Better Auth Subscriptions
   - **Events to send**:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
4. Click **Add endpoint**
5. Copy the **Signing secret** (starts with `whsec_`)
6. Add to `.dev.vars` as `STRIPE_WEBHOOK_SECRET`

#### B. Stripe Connect Webhooks (Optional)

If you're using Stripe Connect for marketplace/platform features:

1. Click **Add endpoint** again
2. Configure:
   - **Endpoint URL**: `https://your-domain.com/api/stripe/connect-webhook`
   - **Description**: Stripe Connect
   - **Events to send**:
     - `account.updated`
     - `account.application.authorized`
     - `account.application.deauthorized`
     - `capability.updated`
     - `payout.created`
     - `payout.failed`
     - `payout.paid`
     - `transfer.created`
     - (Add others as needed)
3. Click **Add endpoint**
4. Copy the **Signing secret**
5. Add to `.dev.vars` as `STRIPE_CONNECT_WEBHOOK_SECRET`

### 3. Test Webhooks Locally

For local development, use the Stripe CLI to forward webhooks:

```bash
# Install Stripe CLI: https://stripe.com/docs/stripe-cli

# Forward standard subscription webhooks
stripe listen --forward-to localhost:8787/auth/stripe/webhook

# Forward Connect webhooks (in separate terminal)
stripe listen --forward-to localhost:8787/stripe/connect-webhook
```

The CLI will provide webhook signing secrets for local testing.

## Database Schema

The Better Auth Stripe plugin adds these tables:

### `user` table (updated)
```sql
ALTER TABLE "user" ADD COLUMN "stripeCustomerId" TEXT UNIQUE;
```

### `subscription` table (new)
```sql
CREATE TABLE "subscription" (
    "id" TEXT PRIMARY KEY,
    "plan" TEXT NOT NULL,
    "referenceId" TEXT UNIQUE NOT NULL,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "status" TEXT DEFAULT 'incomplete',
    "periodStart" INTEGER,
    "periodEnd" INTEGER,
    "cancelAtPeriodEnd" INTEGER DEFAULT 0,
    "seats" INTEGER,
    "trialStart" INTEGER,
    "trialEnd" INTEGER
);
```

Migrations are in `tt-server/migrations/`:
- `0006_add_stripe_customer_id.sql` - Adds `stripeCustomerId` to user table
- `0008_add_stripe_subscription.sql` - Creates subscription table

## Usage Examples

### Client-Side (React)

#### Enable Subscription Plugin

Already configured in `tt-client/src/lib/auth.ts`:

```typescript
import { createAuthClient } from "better-auth/react";
import { stripeClient } from "@better-auth/stripe/client";

export const authClient = createAuthClient({
  baseURL: getAuthBaseURL(),
  plugins: [
    stripeClient({
      subscription: true,
    }),
  ],
});
```

#### Create/Upgrade Subscription

```typescript
import { authClient } from "@/lib/auth";

// Upgrade to a plan
await authClient.subscription.upgrade({
  plan: "pro",
  successUrl: "/dashboard",
  cancelUrl: "/pricing",
  annual: true, // Optional: use annual billing
  seats: 5,     // Optional: for team plans
});
```

#### List Active Subscriptions

```typescript
const { data: subscriptions } = await authClient.subscription.list();

const activeSubscription = subscriptions?.find(
  sub => sub.status === "active" || sub.status === "trialing"
);

// Check limits
const projectLimit = activeSubscription?.limits?.projects || 0;
```

#### Cancel Subscription

```typescript
await authClient.subscription.cancel({
  returnUrl: "/account",
});
```

#### Restore Canceled Subscription

```typescript
await authClient.subscription.restore({
  subscriptionId: "sub_123",
});
```

#### Open Billing Portal

```typescript
await authClient.subscription.billingPortal({
  returnUrl: "/account",
});
```

### Server-Side Configuration

Configuration in `tt-server/src/lib/auth.ts`:

```typescript
import { betterAuth } from "better-auth";
import { stripe } from "@better-auth/stripe";
import Stripe from "stripe";

const stripeClient = env.STRIPE_SECRET_KEY
  ? new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-02-24.acacia",
    })
  : undefined;

export const auth = betterAuth({
  database: { db: kysely, type: "sqlite" },
  plugins: [
    ...(stripeClient && env.STRIPE_WEBHOOK_SECRET
      ? [
          stripe({
            stripeClient,
            stripeWebhookSecret: env.STRIPE_WEBHOOK_SECRET,
            createCustomerOnSignUp: true,
            // Optional: Define subscription plans
            subscription: {
              enabled: true,
              plans: [
                {
                  name: "basic",
                  priceId: "price_1234567890",
                  limits: {
                    projects: 5,
                    storage: 10,
                  },
                },
                {
                  name: "pro",
                  priceId: "price_0987654321",
                  limits: {
                    projects: 20,
                    storage: 50,
                  },
                  freeTrial: {
                    days: 14,
                  },
                },
              ],
            },
          }),
        ]
      : []),
  ],
});
```

## Advanced Configuration

### Define Subscription Plans

```typescript
subscription: {
  enabled: true,
  plans: [
    {
      name: "starter",
      priceId: "price_monthly",
      annualDiscountPriceId: "price_yearly", // Optional annual plan
      limits: {
        projects: 3,
        storage: 5,
      },
    },
    {
      name: "pro",
      priceId: "price_pro_monthly",
      limits: {
        projects: 10,
        storage: 50,
      },
      freeTrial: {
        days: 14,
      },
    },
    {
      name: "team",
      priceId: "price_team",
      limits: {
        projects: 50,
        storage: 200,
      },
    },
  ],
}
```

### Subscription Lifecycle Hooks

```typescript
subscription: {
  enabled: true,
  plans: [...],
  onSubscriptionComplete: async ({ subscription, plan }) => {
    // Send welcome email
    await sendEmail(subscription.referenceId, `Welcome to ${plan.name}!`);
  },
  onSubscriptionCancel: async ({ subscription }) => {
    // Send cancellation email
    console.log(`Subscription ${subscription.id} canceled`);
  },
}
```

### Authorize Reference IDs (for Organizations)

```typescript
subscription: {
  enabled: true,
  plans: [...],
  authorizeReference: async ({ user, referenceId, action }) => {
    // Check if user can manage subscriptions for this org
    if (action === "upgrade-subscription" || action === "cancel-subscription") {
      const membership = await db.member.findFirst({
        where: {
          userId: user.id,
          organizationId: referenceId,
        },
      });
      return membership?.role === "owner";
    }
    return true;
  },
}
```

### Custom Customer Creation

```typescript
stripe({
  // ... other options
  createCustomerOnSignUp: true,
  getCustomerCreateParams: async ({ user, session }, request) => {
    return {
      metadata: {
        referralSource: user.metadata?.referralSource,
      },
    };
  },
  onCustomerCreate: async ({ customer, stripeCustomer, user }) => {
    console.log(`Customer ${customer.id} created for user ${user.id}`);
  },
})
```

## Testing

### Test with Stripe CLI

```bash
# Trigger a test webhook
stripe trigger checkout.session.completed

# Trigger subscription update
stripe trigger customer.subscription.updated

# Trigger subscription deletion
stripe trigger customer.subscription.deleted
```

### Check Webhook Logs

1. Go to **Developers → Webhooks** in Stripe Dashboard
2. Click on your webhook endpoint
3. View recent deliveries and responses

## Troubleshooting

### Webhooks Not Working

1. **Check webhook URL is correct**:
   - Standard: `https://your-domain.com/api/auth/stripe/webhook`
   - Connect: `https://your-domain.com/api/stripe/connect-webhook`

2. **Verify webhook secret**:
   ```bash
   # Development
   cat tt-server/.dev.vars | grep STRIPE_WEBHOOK_SECRET

   # Production
   wrangler secret list
   ```

3. **Check Stripe Dashboard → Webhooks → Recent deliveries** for error messages

4. **View server logs**:
   ```bash
   wrangler tail --env production
   ```

### Subscription Status Not Updating

1. Ensure webhook events are enabled:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`

2. Check database:
   ```bash
   wrangler d1 execute tt-database --local --command "SELECT * FROM subscription"
   ```

### Environment Variable Issues

1. **Development**: Ensure `.dev.vars` exists in `tt-server/`
2. **Production**: Verify secrets are set:
   ```bash
   wrangler secret list
   ```

## Migration Checklist

If migrating from custom Stripe setup to Better Auth:

- [x] Install `@better-auth/stripe` package
- [x] Update `auth.ts` with Stripe plugin
- [x] Update client `auth.ts` with `stripeClient` plugin
- [x] Rename `STRIPE_PRIVATE_KEY` → `STRIPE_SECRET_KEY`
- [x] Run database migrations (`0006` and `0008`)
- [x] Generate Prisma client (`pnpm --filter tt-server run db:generate`)
- [x] Update Stripe webhook URLs in dashboard
- [ ] Update `.dev.vars` with new variable names
- [ ] Update production secrets with `wrangler secret put`
- [ ] Deploy and test webhooks
- [ ] Monitor Stripe Dashboard webhook logs

## Resources

- [Better Auth Stripe Plugin Docs](https://www.better-auth.com/docs/plugins/stripe)
- [Stripe Dashboard](https://dashboard.stripe.com/)
- [Stripe CLI](https://stripe.com/docs/stripe-cli)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Stripe Testing](https://stripe.com/docs/testing)
