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

const SESSION_QUERY_TIMEOUT_MS = 2_500;

function withTimeout<T>(promise: Promise<T>, milliseconds: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeout = globalThis.setTimeout(() => {
      reject(new Error("Auth session request timed out"));
    }, milliseconds);

    promise.then(
      (value) => {
        globalThis.clearTimeout(timeout);
        resolve(value);
      },
      (error) => {
        globalThis.clearTimeout(timeout);
        reject(error);
      },
    );
  });
}

// Query options for prefetching session in router beforeLoad
export const sessionQueryOptions = {
  queryKey: ["session"],
  queryFn: async () => {
    try {
      const result = await withTimeout(
        authClient.getSession(),
        SESSION_QUERY_TIMEOUT_MS,
      );
      return result.data;
    } catch (error) {
      console.warn("Unable to fetch auth session", error);
      return null;
    }
  },
  staleTime: 1000 * 60 * 5, // 5 minutes
};
