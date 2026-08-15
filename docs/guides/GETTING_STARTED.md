# Getting Started - Development Setup & Dev Server

This guide walks you through setting up your development environment and starting the dev server for the ReqToFRD project.

## Prerequisites

Before you begin, ensure you have:

- **Node.js** (v18+) - [Download](https://nodejs.org/)
- **pnpm** (v9+) - [Install](https://pnpm.io/installation) via `npm install -g pnpm`
- **MySQL** (v5.7+) - [Download](https://dev.mysql.com/downloads/mysql/) or use Docker
- **Git** - For version control

Verify installations:
```bash
node --version    # Should be v18 or higher
pnpm --version    # Should be v9 or higher
mysql --version   # Should show MySQL version
git --version     # Should show git version
```

---

## Step 1: Clone & Install Dependencies

```bash
# Clone the repository
git clone https://github.com/kw42chan/reqtofrd.git
cd reqtofrd

# Install dependencies (this may take 2-5 minutes)
pnpm install

# Verify installation succeeded
pnpm check    # Should show no TypeScript errors
pnpm test:quick  # Should run 37 tests successfully
```

**Expected output** (test:quick):
```
✓ 37 tests passed (in ~1s)
```

---

## Step 2: Environment Configuration

### Create .env File

```bash
# Copy the example environment file
cp .env.example .env

# Edit the .env file
# On Windows: notepad .env
# On macOS/Linux: nano .env
```

### Required Variables

#### DATABASE_URL (Required)

**Format**: `mysql://username:password@host:port/database`

**Local Setup Options**:

**Option A: Local MySQL Server**
```env
DATABASE_URL=mysql://root:password@localhost:3306/reqtofrd
```
Replace `password` with your MySQL root password.

**Option B: Docker MySQL**
```bash
# Start MySQL in Docker
docker run --name mysql-reqtofrd \
  -e MYSQL_ROOT_PASSWORD=password \
  -e MYSQL_DATABASE=reqtofrd \
  -p 3306:3306 \
  -d mysql:8.0

# Then use in .env:
DATABASE_URL=mysql://root:password@localhost:3306/reqtofrd
```

**Option C: Remote Database**
```env
DATABASE_URL=mysql://user:password@your-host.com:3306/reqtofrd
```

#### OPENROUTER_API_KEY (Required for Generation)

```env
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

Get your key from: https://openrouter.ai/keys

- Sign up for a free account
- Create an API key
- Add credits to your account (free trial available)

#### Optional Variables

```env
# Server port (default: 3000, auto-increments if busy)
PORT=3000

# Environment mode
NODE_ENV=development

# AWS S3 (optional, for file storage)
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_S3_BUCKET=your-bucket

# Google Maps (optional, for map features)
GOOGLE_MAPS_API_KEY=your-key
```

### Verify Configuration

```bash
# Check that .env file is readable
cat .env

# MySQL connection test
# Option 1: Direct test
mysql -u root -p -h localhost -e "SELECT 1;" 2>/dev/null && echo "✓ MySQL connected"

# Option 2: Via Docker
docker exec mysql-reqtofrd mysql -u root -ppassword -e "SELECT 1;" 2>/dev/null && echo "✓ MySQL connected"
```

---

## Step 3: Database Setup

### Initialize Database

```bash
# Generate migrations and migrate database
pnpm db:push

# Expected output:
# - "✓ Migrations applied successfully"
# - No errors about tables or connections
```

### Verify Database

```bash
# Option 1: Check via MySQL CLI
mysql -u root -p reqtofrd -e "SHOW TABLES;"

# Option 2: Visual browser (Drizzle Studio)
pnpm db:studio
# Opens browser at http://localhost:3000 (or next available port)
# Shows tables and data visually
```

**Expected tables**:
- `sessions` - User session data
- `documents` - Generated FRD documents
- Any other schema tables defined in `drizzle/schema.ts`

---

## Step 4: Start the Development Server

### Quick Start (Recommended)

```bash
# Start development server (client + server with hot reload)
pnpm dev
```

**Expected output**:
```
[server] Server running at http://localhost:3000
[client] VITE v7.x.x  ready in 450 ms
[client] ➜  Local:   http://localhost:3000/
[client] ➜  press h + enter to show help
```

### Access the Application

Open your browser to: **http://localhost:3000**

You should see:
- The ReqToFRD home page
- Interactive UI for entering requirements
- Navigation menus working
- No console errors

### Verify Everything Works

1. **Type test**: Try entering a requirement
   - Should see clarification questions generating
   - Confirm questions appear within 5 seconds

2. **Database test**: Submit a requirement
   - Should stream FRD markdown response
   - Should not see "Database connection" errors

3. **Export test**: Try downloading DOCX
   - Should generate valid Word document
   - File should open in Microsoft Word/Google Docs

---

## Step 5: Verify Build

Before stopping, verify the production build works:

```bash
# Run type check
pnpm check
# Expected: ✓ No TypeScript errors

# Run quick tests
pnpm test:quick
# Expected: ✓ 37 tests passed

# Build for production
pnpm build
# Expected: Output in /dist folder, no errors

# Start production server (optional)
NODE_ENV=production pnpm start
# Should start on port 3000 or next available
```

---

## Development Server Modes

### Mode 1: Full Development (Default - Recommended)

```bash
pnpm dev
```

**Features**:
- ✅ Hot Module Reload (HMR) for client changes
- ✅ Server restart on file changes (tsx watch)
- ✅ TypeScript type checking
- ✅ Console debugging output
- ✅ Full source maps

**When to use**: Daily development, feature building, debugging

### Mode 2: Client-Only Development

```bash
# Terminal 1: Start server manually
pnpm dev:server

# Terminal 2: Start client only
pnpm dev:client
```

**When to use**: When you need to restart server independently

### Mode 3: Production-like Testing

```bash
# Build for production
pnpm build

# Start production server
NODE_ENV=production pnpm start
```

**When to use**: Before shipping, to test minified code

### Mode 4: Watch Mode (Testing)

```bash
# Keep tests running, re-run on file changes
pnpm test:watch
```

**When to use**: While writing tests

### Mode 5: Interactive Test UI

```bash
# Visual test dashboard in browser
pnpm test:ui
```

**When to use**: Debugging specific test failures

---

## Common Development Tasks

### Daily Workflow

```bash
# 1. Start dev server (keep running)
pnpm dev

# 2. Open browser to http://localhost:3000

# 3. Make code changes (automatic HMR reload)
# Edit files in client/src/ or server/

# 4. Check for errors
# - Browser console for client errors
# - Terminal for server errors
# - TypeScript errors: pnpm check

# 5. Run tests (in another terminal)
pnpm test:quick

# 6. Before committing
pnpm format    # Auto-format code
pnpm check     # Type check
pnpm test      # All tests (if OPENROUTER_API_KEY set)
```

### Specific Tasks

**Add a new feature**:
```bash
# 1. Create component in client/src/components/
# 2. Add server procedure in server/routers.ts
# 3. Import in client code
# 4. Run pnpm check to catch type errors
# 5. Add tests in server/*.test.ts
# 6. Run pnpm test:quick to verify
```

**Fix a bug**:
```bash
# 1. Find the failing test: pnpm test -- --grep "bug name"
# 2. Write a test that reproduces the bug
# 3. Fix the code
# 4. Verify: pnpm test:quick
```

**Database schema change**:
```bash
# 1. Edit drizzle/schema.ts
# 2. Generate migration: pnpm db:push
# 3. Test locally with: pnpm db:studio
# 4. Run tests: pnpm test:quick
```

---

## Troubleshooting

### Issue: Port 3000 Already in Use

```bash
# Server auto-increments to next available port
# Look for this in output:
# [server] Server running at http://localhost:3001

# Or manually specify port:
PORT=3001 pnpm dev
```

### Issue: Database Connection Error

```bash
# Check MySQL is running
mysql -u root -p -e "SELECT 1;"

# Verify DATABASE_URL in .env:
cat .env | grep DATABASE_URL

# Try reconnecting:
pnpm db:push
```

### Issue: OPENROUTER_API_KEY Error

```bash
# If clarification/generation doesn't work:
# 1. Check .env has your key
# 2. Check key is valid at https://openrouter.ai/keys
# 3. Check you have API credits
# 4. Try without key (local tests): pnpm test:quick
```

### Issue: Node Modules Corrupted

```bash
# Clean install
rm -rf node_modules pnpm-lock.yaml
pnpm install
pnpm check
```

### Issue: HMR Not Working

```bash
# Restart dev server
# Ctrl+C in terminal, then:
pnpm dev

# If still broken, check for TypeScript errors:
pnpm check
```

### Issue: Type Errors After Git Pull

```bash
# Dependencies may have changed
pnpm install
pnpm check
pnpm build
```

---

## Development Server Tips

### Monitoring Performance

```bash
# Watch build times
pnpm build    # Should complete in <60s

# Watch test times
pnpm test:quick  # Should complete in <2s

# Check bundle size
ls -lh dist/   # Should be <2MB for main bundle
```

### Debugging in Browser

1. **Open DevTools**: F12 or Cmd+Option+I
2. **Sources tab**: View TypeScript source maps
3. **Console tab**: See client-side logs
4. **Network tab**: Monitor API calls to `/api/trpc`

### Debugging Server

```bash
# View server logs in terminal running pnpm dev
# Look for "[server]" prefix

# For detailed logs:
DEBUG=* pnpm dev    # Very verbose
DEBUG=express:* pnpm dev  # Express logs only
```

### Testing API Calls

```bash
# Query tRPC procedures directly
curl 'http://localhost:3000/api/trpc/reqToFrd.analyze' \
  -X POST \
  -H 'Content-Type: application/json' \
  -d '{"requirement":"Build a login system"}'
```

---

## Next Steps

1. ✅ Complete steps 1-5 above
2. 📖 Read [CLAUDE.md](../../CLAUDE.md) for architecture details
3. 🔧 Read [DEVELOPMENT_WORKFLOW.md](./DEVELOPMENT_WORKFLOW.md) for daily patterns
4. 🐛 Read [DEBUGGING.md](./DEBUGGING.md) for troubleshooting
5. 📋 Check [REQUIREMENTS.md](../requirements/REQUIREMENTS.md) for what to build

---

## Quick Reference

| Task | Command | Time |
|------|---------|------|
| Install | `pnpm install` | 2-5 min |
| Start dev | `pnpm dev` | 3 sec |
| Type check | `pnpm check` | ~20 sec |
| Quick tests | `pnpm test:quick` | ~1 sec |
| Full tests | `pnpm test` | ~5 sec |
| Build | `pnpm build` | ~30 sec |
| Format | `pnpm format` | ~10 sec |
| DB setup | `pnpm db:push` | ~2 sec |
| DB browser | `pnpm db:studio` | ~1 sec |

---

## Support

If you encounter issues:

1. Check this file for **Troubleshooting** section
2. Read [DEBUGGING.md](./DEBUGGING.md) for deeper debugging
3. Check [DEVELOPMENT_WORKFLOW.md](./DEVELOPMENT_WORKFLOW.md) for patterns
4. Review project issues on GitHub
5. Check `.manus-logs/` folder for browser/network logs

Happy coding! 🚀
