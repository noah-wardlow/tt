-- Drop avatar column from user table
PRAGMA foreign_keys=OFF;

CREATE TABLE "user_new" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "name" TEXT,
    "image" TEXT,
    "username" TEXT,
    "stripeCustomerId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

INSERT INTO "user_new" ("id", "email", "emailVerified", "name", "image", "username", "stripeCustomerId", "createdAt", "updatedAt")
SELECT "id", "email", "emailVerified", "name", "image", "username", "stripeCustomerId", "createdAt", "updatedAt"
FROM "user";

DROP TABLE "user";

ALTER TABLE "user_new" RENAME TO "user";

CREATE UNIQUE INDEX "user_email_key" ON "user"("email");
CREATE UNIQUE INDEX "user_stripeCustomerId_key" ON "user"("stripeCustomerId");

PRAGMA foreign_keys=ON;
