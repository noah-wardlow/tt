import { Hono } from "hono";
import { cors } from "hono/cors";
import { getPrisma } from "./lib/prisma";
import { getAuth } from "./lib/auth";
import stripeConnectWebhook from "./routes/stripe-connect-webhook";
import {
  createAuthContextMiddleware,
  requireAuth,
  type AppVariables,
} from "./middleware";

type Bindings = {
  DB: D1Database;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  DISCORD_CLIENT_ID?: string;
  DISCORD_CLIENT_SECRET?: string;
  TWITCH_CLIENT_ID?: string;
  TWITCH_CLIENT_SECRET?: string;
  BETTER_AUTH_URL?: string;
  BETTER_AUTH_COOKIE_DOMAIN?: string;
  BETTER_AUTH_SECRET?: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  STRIPE_CONNECT_WEBHOOK_SECRET?: string;
  STRIPE_PRO_MONTHLY_PRICE_ID?: string;
  STRIPE_PRO_YEARLY_PRICE_ID?: string;
};

declare global {
  interface CloudflareBindings extends Bindings {}
}

const app = new Hono<{ Bindings: Bindings; Variables: AppVariables }>();

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
  "http://localhost:3003",
  "http://localhost:3004",
  "http://localhost:3005",
  "http://localhost:8787",
  "https://tt-client.nmwardlow.workers.dev",
  "https://tt-server.nmwardlow.workers.dev",
];

// Handle browser preflights before auth/session middleware. This keeps local dev
// ports and deployed origins from inheriting a stale default CORS origin.
app.use("*", async (c, next) => {
  if (c.req.method === "OPTIONS") {
    const origin = c.req.header("Origin") || "";
    const allowOrigin = allowedOrigins.includes(origin)
      ? origin
      : "https://tt-client.nmwardlow.workers.dev";

    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": allowOrigin,
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, User-Agent",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Max-Age": "600",
      },
    });
  }

  await next();
});

app.use(
  "*",
  cors({
    origin: (origin) => {
      return allowedOrigins.includes(origin)
        ? origin
        : "https://tt-client.nmwardlow.workers.dev";
    },
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "User-Agent"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
    credentials: true,
  }),
);

// Health check
app.get("/", (c) => c.json({ ok: true }));

// Populate user/session on every request
app.use("*", createAuthContextMiddleware());

// BetterAuth routes - handle all auth endpoints
// In production: client strips /api/ prefix, so server receives /auth/*
// In development: client calls server directly at /api/auth/*
app.on(["GET", "POST"], "/auth/*", async (c) => {
  try {
    const auth = getAuth(c.env.DB, c.env);
    return await auth.handler(c.req.raw);
  } catch (error) {
    return c.json(
      {
        error: "Authentication error",
        details: error instanceof Error ? error.message : String(error),
      },
      500,
    );
  }
});

// Session/user echo route using middleware context
app.get("/session", (c) => {
  const session = c.get("session");
  const user = c.get("user");
  if (!user) return c.body(null, 401);
  return c.json({ session, user });
});

// Stripe Connect webhook (separate from Better Auth's standard Stripe webhooks)
app.route("/stripe", stripeConnectWebhook);

// Example Prisma route - get all users
app.get("/users", requireAuth(), async (c) => {
  const prisma = getPrisma(c.env.DB);
  const users = await prisma.user.findMany();
  return c.json(users);
});

export default app;
