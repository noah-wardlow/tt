#!/bin/bash

# Script to rename the TT template to your project name
# Usage: ./rename-project.sh my-project

set -e

if [ -z "$1" ]; then
  echo "Error: Please provide a project name"
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
# Convert to uppercase for binding name (e.g., MY_PROJECT_SERVER)
BINDING_PREFIX=$(echo "$PROJECT_NAME" | tr '[:lower:]' '[:upper:]' | sed 's/[^A-Z0-9]/_/g')
BINDING_NAME="${BINDING_PREFIX}_SERVER"
PROJECT_TITLE=$(printf '%s' "$PROJECT_NAME" | awk '{print toupper(substr($0,1,1)) substr($0,2)}')

echo "Renaming TT template to: $PROJECT_NAME"
echo ""
echo "  Client: tt-client -> $CLIENT_NAME"
echo "  Server: tt-server -> $SERVER_NAME"
echo "  Shared: tt-shared -> $SHARED_NAME"
echo "  Binding: TT_SERVER -> $BINDING_NAME"
echo ""
read -p "Continue? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Cancelled."
  exit 1
fi

echo ""
echo "Step 1: Renaming directories..."
mv tt-client "$CLIENT_NAME"
mv tt-server "$SERVER_NAME"
mv tt-shared "$SHARED_NAME"
echo "Done: Directories renamed"

echo ""
echo "Step 2: Updating pnpm-workspace.yaml..."
sed -i.bak "s/tt-server/$SERVER_NAME/g" pnpm-workspace.yaml
sed -i.bak "s/tt-client/$CLIENT_NAME/g" pnpm-workspace.yaml
sed -i.bak "s/tt-shared/$SHARED_NAME/g" pnpm-workspace.yaml
rm pnpm-workspace.yaml.bak
echo "Done: pnpm-workspace.yaml updated"

echo ""
echo "Step 3: Updating package.json files..."

# Update client package.json
sed -i.bak "s/\"name\": \"tt-client\"/\"name\": \"$CLIENT_NAME\"/" "$CLIENT_NAME/package.json"
sed -i.bak "s/tt-shared/$SHARED_NAME/g" "$CLIENT_NAME/package.json"
rm "$CLIENT_NAME/package.json.bak"

# Update server package.json
sed -i.bak "s/\"name\": \"tt-server\"/\"name\": \"$SERVER_NAME\"/" "$SERVER_NAME/package.json"
sed -i.bak "s/tt-shared/$SHARED_NAME/g" "$SERVER_NAME/package.json"
sed -i.bak "s/tt-database/${PROJECT_NAME}-database/g" "$SERVER_NAME/package.json"
rm "$SERVER_NAME/package.json.bak"

# Update shared package.json
sed -i.bak "s/\"name\": \"tt-shared\"/\"name\": \"$SHARED_NAME\"/" "$SHARED_NAME/package.json"
rm "$SHARED_NAME/package.json.bak"

echo "Done: package.json files updated"

echo ""
echo "Step 4: Updating wrangler.jsonc files..."

# Update server wrangler.jsonc
sed -i.bak "s/\"name\": \"tt-server\"/\"name\": \"$SERVER_NAME\"/" "$SERVER_NAME/wrangler.jsonc"
sed -i.bak "s/database_name\": \"tt-database\"/database_name\": \"${PROJECT_NAME}-database\"/" "$SERVER_NAME/wrangler.jsonc"
rm "$SERVER_NAME/wrangler.jsonc.bak"

# Update client wrangler.jsonc
sed -i.bak "s/\"name\": \"tt-client\"/\"name\": \"$CLIENT_NAME\"/" "$CLIENT_NAME/wrangler.jsonc"
sed -i.bak "s/\"service\": \"tt-server\"/\"service\": \"$SERVER_NAME\"/" "$CLIENT_NAME/wrangler.jsonc"
sed -i.bak "s/\"binding\": \"TT_SERVER\"/\"binding\": \"$BINDING_NAME\"/" "$CLIENT_NAME/wrangler.jsonc"
sed -i.bak "s/tt-server/$SERVER_NAME/g" "$CLIENT_NAME/wrangler.jsonc"
rm "$CLIENT_NAME/wrangler.jsonc.bak"

echo "Done: wrangler.jsonc files updated"

echo ""
echo "Step 5: Updating template references across source, config, docs, and workflows..."

find . -type f \
  ! -path "./.git/*" \
  ! -path "./node_modules/*" \
  ! -path "./*/node_modules/*" \
  ! -path "./dist/*" \
  ! -path "./*/dist/*" \
  ! -path "./.wrangler/*" \
  ! -path "./*/.wrangler/*" \
  ! -path "./rename-project.sh" \
  \( \
    -name "*.ts" -o \
    -name "*.tsx" -o \
    -name "*.js" -o \
    -name "*.jsx" -o \
    -name "*.json" -o \
    -name "*.jsonc" -o \
    -name "*.yaml" -o \
    -name "*.yml" -o \
    -name "*.md" -o \
    -name "*.html" -o \
    -name "*.css" -o \
    -name "*.env" -o \
    -name ".env*" -o \
    -name "pnpm-lock.yaml" \
  \) -print0 | while IFS= read -r -d '' file; do
    sed -i.bak "s/tt-client/$CLIENT_NAME/g" "$file"
    sed -i.bak "s/tt-server/$SERVER_NAME/g" "$file"
    sed -i.bak "s/tt-shared/$SHARED_NAME/g" "$file"
    sed -i.bak "s/tt-database/${PROJECT_NAME}-database/g" "$file"
    sed -i.bak "s/TT_SERVER/$BINDING_NAME/g" "$file"
    sed -i.bak "s/TT Template/${PROJECT_TITLE} Template/g" "$file"
    rm "${file}.bak"
  done

echo "Done: Template references updated"

echo ""
echo "========================================"
echo "Project renamed to: $PROJECT_NAME"
echo "========================================"
echo ""
echo "Next steps:"
echo ""
echo "  1. Create D1 database:"
echo "     cd $SERVER_NAME && pnpm exec wrangler d1 create ${PROJECT_NAME}-database"
echo ""
echo "  2. Update database_id in $SERVER_NAME/wrangler.jsonc with the output from step 1"
echo ""
echo "  3. Reinstall dependencies:"
echo "     pnpm install"
echo ""
echo "  4. Generate Prisma client:"
echo "     pnpm --filter $SERVER_NAME run db:generate"
echo ""
echo "  5. Run database migrations:"
echo "     pnpm --filter $SERVER_NAME run db:migrate:local"
echo ""
echo "  6. Create .dev.vars file:"
echo "     See README.md for required environment variables"
echo ""
echo "  7. Start development:"
echo "     Terminal 1: pnpm --filter $SERVER_NAME dev"
echo "     Terminal 2: cd $CLIENT_NAME && VITE_API_BASE=http://localhost:8787 pnpm dev"
echo ""
