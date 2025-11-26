import { betterAuth } from "better-auth";
import { Kysely } from "kysely";
import { D1Dialect } from "kysely-d1";
import { getEnabledProviders } from "tt-shared/oauth-config";
import {
  getClientIdEnvVar,
  getClientSecretEnvVar,
  profileMappers,
} from "./oauth-utils";
import { stripe } from "@better-auth/stripe";
import Stripe from "stripe";

type AuthEnv = {
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  DISCORD_CLIENT_ID?: string;
  DISCORD_CLIENT_SECRET?: string;
  TWITCH_CLIENT_ID?: string;
  TWITCH_CLIENT_SECRET?: string;
  BETTER_AUTH_SECRET?: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
};

// Cache auth instance per DB to avoid recreating on every request
const authCache = new WeakMap();

export function getAuth(db: D1Database, env: AuthEnv) {
  // Return cached instance if available
  if (authCache.has(db)) {
    return authCache.get(db);
  }

  // Create Kysely instance with D1 dialect
  const kysely = new Kysely<any>({
    dialect: new D1Dialect({ database: db }),
  });

  // Build social providers config dynamically from enabled providers
  const enabledProviders = getEnabledProviders();
  const socialProviders: Record<string, any> = {};

  for (const provider of enabledProviders) {
    socialProviders[provider] = {
      clientId: env[getClientIdEnvVar(provider)] || "",
      clientSecret: env[getClientSecretEnvVar(provider)] || "",
      mapProfileToUser: profileMappers[provider],
    };
  }

  // Create Stripe client if configured
  const stripeClient = env.STRIPE_SECRET_KEY
    ? new Stripe(env.STRIPE_SECRET_KEY, {
        apiVersion: "2025-02-24.acacia",
      })
    : undefined;

  const auth = betterAuth({
    database: {
      db: kysely,
      type: "sqlite",
    },
    basePath: "/auth",
    secret: env.BETTER_AUTH_SECRET || "default-secret-change-me",
    emailAndPassword: {
      enabled: false,
    },
    user: {
      additionalFields: {
        username: {
          type: "string",
          required: false,
        },
      },
    },
    account: {
      accountLinking: {
        enabled: true,
        trustedProviders: enabledProviders,
        updateUserInfoOnLink: true,
      },
    },
    socialProviders,
    trustedOrigins: [
      "http://localhost:3000",
      "http://localhost:8787",
      "https://tt-client.nmwardlow.workers.dev",
      "https://tt-server.nmwardlow.workers.dev",
    ],
    plugins: [
      ...(stripeClient && env.STRIPE_WEBHOOK_SECRET
        ? [
            stripe({
              stripeClient,
              stripeWebhookSecret: env.STRIPE_WEBHOOK_SECRET,
              createCustomerOnSignUp: true,
            }),
          ]
        : []),
    ],
  });

  authCache.set(db, auth);
  return auth;
}
