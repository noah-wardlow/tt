import { describe, expect, it } from "vitest";

import { getAllowedOrigins, resolveCorsOrigin } from "./origins";

describe("origin helpers", () => {
  it("allows common local development origins", () => {
    expect(resolveCorsOrigin("http://localhost:3002", {})).toBe(
      "http://localhost:3002",
    );
    expect(resolveCorsOrigin("http://127.0.0.1:5173", {})).toBe(
      "http://127.0.0.1:5173",
    );
  });

  it("uses configured origins for CORS and Better Auth", () => {
    const env = {
      APP_ORIGIN: "https://app.example.com/some/path",
      BETTER_AUTH_URL: "https://api.example.com/auth",
      ADDITIONAL_ALLOWED_ORIGINS:
        "https://preview.example.com, https://custom.example.com/path",
    };

    expect(getAllowedOrigins(env)).toEqual(
      expect.arrayContaining([
        "https://app.example.com",
        "https://api.example.com",
        "https://preview.example.com",
        "https://custom.example.com",
      ]),
    );
    expect(resolveCorsOrigin("https://preview.example.com/build/123", env)).toBe(
      "https://preview.example.com",
    );
  });

  it("falls back to the configured app origin for unknown remote origins", () => {
    expect(
      resolveCorsOrigin("https://unknown.example.com", {
        APP_ORIGIN: "https://app.example.com",
      }),
    ).toBe("https://app.example.com");
  });
});
