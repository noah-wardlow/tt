// @ts-ignore - CLI types are not fully typed
import { defineConfig } from "@better-auth/cli";

export default defineConfig({
  database: {
    provider: "sqlite",
    url: "./prisma/dev.db",
  },
});
