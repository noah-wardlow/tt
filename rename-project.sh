#!/bin/bash

# Script to rename the GG template to your project name
# Usage: ./rename-project.sh my-project

set -e

if [ -z "$1" ]; then
  echo "❌ Error: Please provide a project name"
  echo "Usage: ./rename-project.sh my-project"
  echo ""
  echo "Example: ./rename-project.sh teachtab"
  echo "  This will create: teachtab-client, teachtab-server, teachtab-shared"
  exit 1
fi

PROJECT_NAME="$1"
CLIENT_NAME="${PROJECT_NAME}-client"
SERVER_NAME="${PROJECT_NAME}-server"
SHARED_NAME="${PROJECT_NAME}-shared"

echo "🚀 Renaming GG template to: $PROJECT_NAME"
echo ""
echo "  Client: gg-client → $CLIENT_NAME"
echo "  Server: gg-server → $SERVER_NAME"
echo "  Shared: gg-shared → $SHARED_NAME"
echo ""
read -p "Continue? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Cancelled."
  exit 1
fi

echo ""
echo "📝 Step 1: Renaming directories..."
mv gg-client "$CLIENT_NAME"
mv gg-server "$SERVER_NAME"
mv gg-shared "$SHARED_NAME"
echo "✅ Directories renamed"

echo ""
echo "📝 Step 2: Updating package.json files..."

# Update root package.json
sed -i.bak "s/gg-client/$CLIENT_NAME/g" package.json
sed -i.bak "s/gg-server/$SERVER_NAME/g" package.json
sed -i.bak "s/gg-shared/$SHARED_NAME/g" package.json
rm package.json.bak

# Update client package.json
sed -i.bak "s/\"name\": \"gg-client\"/\"name\": \"$CLIENT_NAME\"/" "$CLIENT_NAME/package.json"
sed -i.bak "s/gg-shared/$SHARED_NAME/g" "$CLIENT_NAME/package.json"
rm "$CLIENT_NAME/package.json.bak"

# Update server package.json
sed -i.bak "s/\"name\": \"gg-server\"/\"name\": \"$SERVER_NAME\"/" "$SERVER_NAME/package.json"
rm "$SERVER_NAME/package.json.bak"

# Update shared package.json
sed -i.bak "s/\"name\": \"gg-shared\"/\"name\": \"$SHARED_NAME\"/" "$SHARED_NAME/package.json"
rm "$SHARED_NAME/package.json.bak"

echo "✅ package.json files updated"

echo ""
echo "📝 Step 3: Updating wrangler.jsonc files..."

# Update server wrangler.jsonc
sed -i.bak "s/\"name\": \"gg-server\"/\"name\": \"$SERVER_NAME\"/" "$SERVER_NAME/wrangler.jsonc"
sed -i.bak "s/database_name\": \"gg-database\"/database_name\": \"${PROJECT_NAME}-database\"/" "$SERVER_NAME/wrangler.jsonc"
rm "$SERVER_NAME/wrangler.jsonc.bak"

# Update client wrangler.jsonc
sed -i.bak "s/\"name\": \"gg-client\"/\"name\": \"$CLIENT_NAME\"/" "$CLIENT_NAME/wrangler.jsonc"
sed -i.bak "s/\"service\": \"gg-server\"/\"service\": \"$SERVER_NAME\"/" "$CLIENT_NAME/wrangler.jsonc"
rm "$CLIENT_NAME/wrangler.jsonc.bak"

echo "✅ wrangler.jsonc files updated"

echo ""
echo "📝 Step 4: Updating imports and references..."

# Update client worker.ts
sed -i.bak "s/GG_SERVER/${PROJECT_NAME^^}_SERVER/g" "$CLIENT_NAME/src/worker.ts"
rm "$CLIENT_NAME/src/worker.ts.bak"

# Update README.md references
sed -i.bak "s/gg-client/$CLIENT_NAME/g" README.md
sed -i.bak "s/gg-server/$SERVER_NAME/g" README.md
sed -i.bak "s/gg-shared/$SHARED_NAME/g" README.md
sed -i.bak "s/my-project/$PROJECT_NAME/g" README.md
rm README.md.bak

# Update CLAUDE.md references
sed -i.bak "s/gg-client/$CLIENT_NAME/g" CLAUDE.md
sed -i.bak "s/gg-server/$SERVER_NAME/g" CLAUDE.md
sed -i.bak "s/gg-shared/$SHARED_NAME/g" CLAUDE.md
sed -i.bak "s/GG Template/${PROJECT_NAME^} Template/g" CLAUDE.md
rm CLAUDE.md.bak

echo "✅ Imports and references updated"

echo ""
echo "📝 Step 5: Updating GitHub workflows..."

if [ -d ".github/workflows" ]; then
  sed -i.bak "s/gg-server/$SERVER_NAME/g" .github/workflows/deploy-server.yml
  sed -i.bak "s/gg-client/$CLIENT_NAME/g" .github/workflows/deploy-client.yml
  rm .github/workflows/*.bak
  echo "✅ GitHub workflows updated"
else
  echo "⚠️  No .github/workflows directory found (skipped)"
fi

echo ""
echo "🎉 Done! Your project has been renamed to: $PROJECT_NAME"
echo ""
echo "📋 Next steps:"
echo "  1. Create D1 database:"
echo "     cd $SERVER_NAME && pnpm exec wrangler d1 create ${PROJECT_NAME}-database"
echo ""
echo "  2. Update database_id in $SERVER_NAME/wrangler.jsonc with the output from step 1"
echo ""
echo "  3. Reinstall dependencies:"
echo "     pnpm install"
echo ""
echo "  4. Run database migrations:"
echo "     pnpm --filter $SERVER_NAME run db:migrate:local"
echo ""
echo "  5. Start development:"
echo "     Terminal 1: pnpm --filter $SERVER_NAME dev"
echo "     Terminal 2: cd $CLIENT_NAME && VITE_API_BASE=http://localhost:8787 pnpm dev"
echo ""
