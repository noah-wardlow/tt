# gg-shared

Shared types and utilities for the GG monorepo.

## Usage

In your client or server code:

```typescript
import type { User } from 'gg-shared/types'

// Use the types
const user: User = {
  id: '123',
  email: 'test@example.com',
  name: 'Test User'
}
```

## Available Types

All Prisma model types are re-exported from this package. When you add new models to `gg-server/prisma/schema.prisma`, make sure to:

1. Export the type in `src/types.ts`
2. Run `pnpm --filter gg-server run db:generate` to regenerate types
