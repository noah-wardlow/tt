import type { MiddlewareHandler } from "hono";
import { getAuth } from "./lib/auth";

type Bindings = {
  DB: D1Database;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  DISCORD_CLIENT_ID?: string;
  DISCORD_CLIENT_SECRET?: string;
  TWITCH_CLIENT_ID?: string;
  TWITCH_CLIENT_SECRET?: string;
  BETTER_AUTH_SECRET?: string;
  STRIPE_PRIVATE_KEY?: string;
};

export type AppVariables = {
  user: any | null;
  session: any | null;
};

// Middleware to populate c.get('user') and c.get('session') for every request
export function createAuthContextMiddleware(): MiddlewareHandler<{
  Bindings: Bindings;
  Variables: AppVariables;
}> {
  return async (c, next) => {
    try {
      const auth = getAuth(c.env.DB, c.env);
      const session = await auth.api.getSession({ headers: c.req.raw.headers });
      if (!session) {
        c.set("user", null);
        c.set("session", null);
        await next();
        return;
      }
      c.set("user", session.user);
      c.set("session", session.session);
    } catch (_) {
      c.set("user", null);
      c.set("session", null);
    }
    await next();
  };
}

// Simple auth guard middleware: ensures a user exists on context
export function requireAuth(): MiddlewareHandler<{
  Bindings: Bindings;
  Variables: AppVariables;
}> {
  return async (c, next) => {
    const user = c.get("user");
    if (!user) {
      return c.body(null, 401);
    }
    await next();
  };
}
