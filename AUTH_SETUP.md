# BetterAuth Setup Guide

BetterAuth has been integrated with Google and Discord OAuth providers.

## Setup Instructions

### 1. Get OAuth Credentials

#### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth client ID"
5. Choose "Web application"
6. Add authorized redirect URIs:
   - `http://localhost:8787/auth/callback/google` (development)
   - Your server Worker URL + `/auth/callback/google` (production)
7. Copy your Client ID and Client Secret

#### Discord OAuth
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Go to "OAuth2" section
4. Add redirect URIs:
   - `http://localhost:8787/auth/callback/discord` (development)
   - Your server Worker URL + `/auth/callback/discord` (production)
5. Copy your Client ID and Client Secret

### 2. Configure Environment Variables

#### For Local Development

Create `gg-server/.dev.vars` file:
```
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
DISCORD_CLIENT_ID=your-discord-client-id
DISCORD_CLIENT_SECRET=your-discord-client-secret
BETTER_AUTH_SECRET=$(openssl rand -base64 32)
```

Generate a secure secret:
```bash
openssl rand -base64 32
```

#### For Production (Cloudflare)

Set secrets using Wrangler:
```bash
cd gg-server
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET
wrangler secret put DISCORD_CLIENT_ID
wrangler secret put DISCORD_CLIENT_SECRET
wrangler secret put BETTER_AUTH_SECRET
```

### 3. Generate Schema & Run Migrations

BetterAuth provides a CLI to generate the correct database schema:

```bash
cd gg-server

# Option A: Use BetterAuth CLI to generate schema (recommended)
pnpm auth:generate

# This will update your Prisma schema with the correct BetterAuth tables
# Then regenerate Prisma client and run migrations:
pnpm db:generate
pnpm db:migrate:diff > migrations/0004_auth_schema.sql  # Create new migration
pnpm db:migrate:local   # Apply locally

# Option B: Migrations are already created, just apply them
pnpm db:migrate:local   # For local development
pnpm db:migrate:remote  # For production
```

### 4. Start Development Servers

Terminal 1 (Server):
```bash
cd gg-server
pnpm dev
```

Terminal 2 (Client):
```bash
cd gg-client
pnpm dev
```

## Usage

The login UI has been added to the home page at `src/routes/index.tsx`. Users can:
- Sign in with Google
- Sign in with Discord
- See their session information when logged in
- Sign out

## Files Modified/Created

### Server (`gg-server`)
- `src/lib/auth.ts` - BetterAuth configuration with Kysely + D1 adapter
- `src/app.ts` - Auth routes integration
- `prisma/schema.prisma` - Added User, Session, Account, Verification tables
- `migrations/0003_auth_tables.sql` - Database migration
- `better-auth.config.ts` - BetterAuth CLI configuration
- `.dev.vars.example` - Environment variables template
- `wrangler.jsonc` - Updated for environment variables
- `package.json` - Added `auth:generate` script, kysely, kysely-d1

### Client (`gg-client`)
- `src/lib/auth.ts` - Client-side auth utilities
- `src/routes/index.tsx` - Added login UI with Google/Discord buttons

## BetterAuth with Cloudflare D1

BetterAuth doesn't have a direct D1 adapter, so we use **Kysely** with the **D1 dialect**:

```typescript
import { Kysely } from "kysely";
import { D1Dialect } from "kysely-d1";

const kysely = new Kysely({
  dialect: new D1Dialect({ database: db }),
});

betterAuth({
  database: kysely,
  // ... other config
});
```

### BetterAuth CLI

The BetterAuth CLI (`@better-auth/cli`) is installed and can be used to:

```bash
# Generate Prisma schema from BetterAuth config
pnpm auth:generate

# This ensures your schema matches BetterAuth's requirements
# It will add/update the necessary tables and fields
```

## API Endpoints

Auth endpoints are served by the server Worker at `/auth/*`:
- `/auth/sign-in/social` - Initiate social sign-in
- `/auth/sign-out` - Sign out
- `/auth/session` - Get current session
- `/auth/callback/google` - Google OAuth callback
- `/auth/callback/discord` - Discord OAuth callback

## Troubleshooting

1. **CORS errors**: Make sure both servers are running and CORS is configured correctly
2. **OAuth redirect errors**: Verify redirect URIs match exactly in OAuth provider settings
3. **Database errors**: Run migrations with `pnpm db:migrate:local`
4. **Environment variables not loading**: Check `.dev.vars` file exists and is properly formatted
