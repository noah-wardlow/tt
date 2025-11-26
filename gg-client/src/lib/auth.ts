import { createAuthClient } from "better-auth/react";
import { stripeClient } from "@better-auth/stripe/client";

// BetterAuth client configuration
// Prefer explicit server origin when provided (VITE_AUTH_BASE or VITE_API_BASE),
// which mirrors dev and avoids proxy ambiguity for auth.
// Otherwise, in production, fall back to the client worker proxy at /api/auth.
const getAuthBaseURL = () => {
  const explicit =
    (import.meta.env.VITE_AUTH_BASE as string | undefined) ||
    (import.meta.env.VITE_API_BASE as string | undefined);
  if (explicit) {
    return `${explicit.replace(/\/$/, "")}/auth`;
  }
  if (import.meta.env.PROD) {
    return `${window.location.origin}/api/auth`;
  }
  return `http://localhost:8787/auth`;
};

export const authClient = createAuthClient({
  baseURL: getAuthBaseURL(),
  fetchOptions: {
    credentials: "include",
  },
  plugins: [
    stripeClient({
      subscription: true,
    }),
  ],
});

export const { signIn, signOut, useSession } = authClient;
