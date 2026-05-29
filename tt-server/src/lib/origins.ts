type OriginEnv = {
  APP_ORIGIN?: string;
  ADDITIONAL_ALLOWED_ORIGINS?: string;
  BETTER_AUTH_URL?: string;
};

const templateWorkerOrigins = [
  "https://tt-client.nmwardlow.workers.dev",
  "https://tt-server.nmwardlow.workers.dev",
];

const localTrustedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
  "http://localhost:3003",
  "http://localhost:3004",
  "http://localhost:3005",
  "http://localhost:4173",
  "http://localhost:5173",
  "http://localhost:8787",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:8787",
];

function normalizeOrigin(value: string | undefined | null) {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function parseOrigins(value: string | undefined) {
  if (!value) return [];
  return value
    .split(/[,\s]+/)
    .map((origin) => normalizeOrigin(origin))
    .filter((origin): origin is string => Boolean(origin));
}

function isLocalOrigin(origin: string) {
  const normalized = normalizeOrigin(origin);
  if (!normalized) return false;

  const url = new URL(normalized);
  return (
    (url.protocol === "http:" || url.protocol === "https:") &&
    ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
  );
}

export function getAllowedOrigins(env: OriginEnv) {
  return Array.from(
    new Set([
      ...localTrustedOrigins,
      ...templateWorkerOrigins,
      normalizeOrigin(env.APP_ORIGIN),
      normalizeOrigin(env.BETTER_AUTH_URL),
      ...parseOrigins(env.ADDITIONAL_ALLOWED_ORIGINS),
    ].filter((origin): origin is string => Boolean(origin))),
  );
}

export function resolveCorsOrigin(origin: string | undefined, env: OriginEnv) {
  if (origin && isLocalOrigin(origin)) {
    return normalizeOrigin(origin) ?? origin;
  }

  const normalizedOrigin = normalizeOrigin(origin);
  const allowedOrigins = getAllowedOrigins(env);
  if (normalizedOrigin && allowedOrigins.includes(normalizedOrigin)) {
    return normalizedOrigin;
  }

  return (
    normalizeOrigin(env.APP_ORIGIN) ??
    templateWorkerOrigins[0]
  );
}
