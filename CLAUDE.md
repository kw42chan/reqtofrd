# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Instructions for New Sessions

**IMPORTANT**: When starting work on this project, follow this process:

1. **Setup & Get Started**: Follow [docs/guides/GETTING_STARTED.md](docs/guides/GETTING_STARTED.md) for:
   - Prerequisites (Node.js, pnpm, MySQL)
   - Environment setup (.env configuration)
   - Database initialization
   - Starting the dev server

2. **Review Project Context**: Check:
   - [REQUIREMENTS.md](docs/requirements/REQUIREMENTS.md) - Project goals and success criteria
   - [IMPROVEMENTS.md](docs/tracking/IMPROVEMENTS.md) - What was done last session
   - [SESSION_SUMMARY.md](docs/tracking/SESSION_SUMMARY.md) - Last session's work

3. **Verify the Project State**: Run:
   ```bash
   pnpm install && pnpm test:quick  # Should show ✓ 37 tests passed
   ```

4. **Daily Development**: Follow [docs/guides/DEVELOPMENT_WORKFLOW.md](docs/guides/DEVELOPMENT_WORKFLOW.md) for:
   - Feature development workflow
   - Bug fix patterns
   - Code quality standards
   - Testing practices

5. **Debugging**: Use [docs/guides/DEBUGGING.md](docs/guides/DEBUGGING.md) for:
   - Client-side errors (browser console)
   - Server-side errors (terminal logs)
   - Database issues
   - Build or test failures

6. **Architecture Deep Dive**: Read this file's architecture section to understand the codebase structure

7. **Self-Improve Before Stopping**: Follow [SELF_IMPROVE.md](docs/requirements/SELF_IMPROVE.md) to:
   - Identify documentation gaps and code quality improvements
   - Update CLAUDE.md with discovered patterns
   - Add new tests or refactor duplicated code
   - Document improvements in [IMPROVEMENTS.md](docs/tracking/IMPROVEMENTS.md)
   - **⚠️ CRITICAL: Step 7 (self-improvement) must be completed before stopping**

This ensures the codebase becomes progressively better with each session.

## Project Overview

**ReqToFRD** is a full-stack web application that generates enterprise-grade Functional Requirements Documents (FRD) from high-level requirements. It uses AI (via OpenRouter) to generate FRDs with mandatory sections, functional requirement identifiers (FR-01, FR-02, etc.), and enterprise audit compliance. The app includes interactive clarification Q&A, real-time preview, DOCX export, and audit scoring.

### Key Features

- Interactive requirements clarification with AI-generated questions
- Real-time FRD generation and markdown preview
- Enterprise metadata (Request ID, Region, System, Distribution list)
- Audit compliance scoring against mandatory sections and structure
- DOCX export with proper formatting, page breaks, and cover pages
- Multi-user distribution & sign-off tracking
- Support for different formatting guidelines (IEEE 830, Agile Enterprise, Banking/Treasury)

## Quick Start for New Sessions

**First Time?** Follow [docs/guides/GETTING_STARTED.md](docs/guides/GETTING_STARTED.md) for complete setup.

**Returning Developer?** Quick verification:

1. **Install dependencies**: `pnpm install` (2-5 min)
2. **Start dev server**: `pnpm dev` (opens at http://localhost:3000)
3. **In another terminal, verify setup**:
   ```bash
   pnpm check           # ✓ Type checking passes
   pnpm test:quick      # ✓ 37 tests pass
   ```
4. **Make your changes** (code auto-reloads thanks to HMR)
5. **Before committing**:
   ```bash
   pnpm format          # Auto-format code
   pnpm check && pnpm test:quick  # Verify changes
   ```
6. **Before stopping**: Follow [SELF_IMPROVE.md](docs/requirements/SELF_IMPROVE.md) to improve documentation

**Stuck?** See [docs/guides/DEBUGGING.md](docs/guides/DEBUGGING.md) for common issues.

## Development Commands

### Setup & Installation

```bash
# Install dependencies
pnpm install

# Copy .env.example to .env and configure (see Environment Variables section)
cp .env.example .env
```

### Development

```bash
# Development server (watches server, Vite HMR for client)
pnpm dev

# Run type checking
pnpm check

# Format code with Prettier
pnpm format

# Check formatting without changes
pnpm lint
```

### Testing

```bash
# Run all core tests (excludes integration tests requiring API keys)
pnpm test:quick

# Run all tests (requires OPENROUTER_API_KEY for full suite)
pnpm test

# Watch mode (re-run tests on file changes)
pnpm test:watch

# UI mode for interactive testing
pnpm test:ui

# Run a single test file
pnpm test server/reqToFrd.test.ts

# Run tests matching a pattern
pnpm test -- --grep "sanitizes"
```

### Build & Production

```bash
# Build for production (Vite client + esbuild server)
pnpm build

# Start production server (requires NODE_ENV=production)
NODE_ENV=production pnpm start
```

### Database

```bash
# Generate migrations and migrate database
pnpm db:push

# Open Drizzle Studio for visual DB management
pnpm db:studio
```

## Architecture Overview

This is a **monorepo** with clear separation of concerns:

### Client (`client/src/`)

- **React 19** + Vite for fast HMR and builds
- **Wouter** for routing (lightweight, no Next.js overhead)
- **tRPC client** to call server procedures with type safety
- **Radix UI** components + Tailwind CSS for design system
- **React Query** for server state management
- **Framer Motion** for smooth animations
- Key pages: `pages/Home.tsx` (the main FRD workspace)
- Main context: `contexts/ThemeContext.tsx` (light/dark mode)
- Key utilities: `lib/reqToFrd.ts` (workspace state, audit logic), `lib/exportDocx.ts` (DOCX generation), `lib/previewPagination.ts` (document layout)

### Server (`server/`)

- **Express** HTTP server with tRPC middleware at `/api/trpc`
- **tRPC v11** for type-safe RPC procedures (router at `server/routers.ts`)
- **Drizzle ORM** (MySQL) with schema at `drizzle/schema.ts`
- **OpenRouter API** wrapper for LLM calls (support for Claude, GPT-4, etc.)
- Core utilities in `server/_core/`:
  - `index.ts`: Server entry point, port auto-detection, Express setup
  - `vite.ts`: Vite dev server setup
  - `trpc.ts`: tRPC instance with middleware
  - `context.ts`: Request context (cookies, user session)
  - `llm.ts`: OpenRouter LLM orchestration
  - `heartbeat.ts`: Token-counting, streaming response handling
  - `env.ts`: Environment variable parsing

### Shared (`shared/`)

- `const.ts`: Cookie names, defaults
- `_core/errors.ts`: Error type definitions
- Used by both client and server for type safety

### Library (`lib/req-to-frd/`)

- `templates/enterprise-audit-frd.ts`: Default FRD template, prompt specifications, question categories, audit rules
- Imported by both server (for generation) and client (for preview/audit)
- Single source of truth for FRD structure and validation

## Database Setup

- **Drizzle ORM** with MySQL dialect
- Schema file: `drizzle/schema.ts`
- Migrations auto-generated in `drizzle/` folder
- Connection via `DATABASE_URL` env var (required format: `mysql://user:pass@host:port/db`)
- Use `server/db.ts` to get the database connection

## Request Flow

1. **Client→Server**: User submits high-level requirement via tRPC
2. **Server**: Calls OpenRouter LLM with enterprise-audit-frd prompt template
3. **Server**: Returns streamed markdown response to client
4. **Client**: Parses markdown into structured blocks, computes audit score
5. **Client**: Renders preview, allows edits, DOCX export

## Key Procedures (tRPC Routers)

- `reqToFrd.analyze`: Generates 3–5 clarification questions (POST to `/api/trpc/reqToFrd.analyze`)
- `reqToFrd.generate`: Streams FRD markdown (POST to `/api/trpc/reqToFrd.generate`)
- Both accept metadata (request ID, region, system, distribution list, revision history)

## Testing

### Test Files Location

All tests are in `server/**/*.test.ts` files:

- **reqToFrd.test.ts** (27 tests): Audit logic, template contracts, markdown parsing, DOCX export
- **reqToFrd.procedures.test.ts** (9 tests): End-to-end procedure tests with mocked LLM
- **auth.logout.test.ts** (1 test): Session management
- **openrouter.test.ts** (5 tests): LLM API integration (requires OPENROUTER_API_KEY)
- **openrouter.secret.test.ts** (1 test): API credential handling (requires OPENROUTER_API_KEY)

### Running Tests Without API Key

The core functionality tests work without OPENROUTER_API_KEY:

```bash
# Quick test run (37 tests, ~2 seconds)
pnpm test:quick

# Watch mode for development
pnpm test:watch

# Interactive UI
pnpm test:ui
```

### Running All Tests (Requires OPENROUTER_API_KEY)

```bash
# Set your API key
export OPENROUTER_API_KEY=sk-or-v1-...

# Run full test suite (43 tests)
pnpm test
```

### Test Configuration

- **Environment**: Node.js (no jsdom)
- **Mocks**: OpenRouter API responses, markdown samples, database state
- **Coverage**: >80% for critical paths (audit, export, procedures)
- **Speed**: Full suite runs in <5 seconds

## Important Files & Patterns

- **vite.config.ts**: Vite setup with Manus debug collector (logs browser console/network to `.manus-logs/`)
- **drizzle.config.ts**: MySQL connection and schema generation
- **components.json**: Radix/Shadcn UI configuration for the CLI
- **tsconfig.json**: Path aliases (@: client/src, @shared: shared, @assets: attached_assets)
- **pnpm-lock.yaml**: Locked dependency versions (do not manually edit)

## Development Workflow

1. **Make changes** to client (`client/src/`) or server (`server/`) code
2. **Type check**: `pnpm check` to catch TS errors early
3. **Test**: `pnpm test` or `pnpm test -- --grep <pattern>` for specific tests
4. **Format**: `pnpm format` before committing
5. **Dev server**: `pnpm dev` runs both server (tsx watch) and client (Vite HMR)

## Environment Variables

### Setup

1. Copy `.env.example` to `.env`: `cp .env.example .env`
2. Fill in the required variables for your setup

### Required for Functionality

- **DATABASE_URL**: MySQL connection string
  - Format: `mysql://user:password@host:port/database`
  - Example: `mysql://root:password@localhost:3306/reqtofrd`
  - Required for: Database operations, user sessions, migrations
- **OPENROUTER_API_KEY**: OpenRouter API key for LLM access
  - Get from: https://openrouter.ai/keys
  - Required for: FRD generation, clarification questions
  - Note: Can also be provided at runtime via UI (users can supply their own key)

### Optional Configuration

- **PORT**: Server port (defaults to 3000, auto-increments if busy)
- **NODE_ENV**: `development` (with Vite HMR) or `production` (optimized build)
- **GOOGLE_MAPS_API_KEY**: For map components (if using map features)
- **AWS_ACCESS_KEY_ID**, **AWS_SECRET_ACCESS_KEY**, **AWS_S3_BUCKET**: For S3 file storage

### For Testing

- **Skip integration tests**: Run `pnpm test:quick` to skip tests that require OPENROUTER_API_KEY
- **Run all tests**: Set OPENROUTER_API_KEY and run `pnpm test`

## Common Gotchas

1. **pnpm over npm**: This project uses pnpm. npm/yarn may break patches in `patches/`.
2. **DATABASE_URL required**: Many commands (tests, migrations) need this set, even if using SQLite locally.
3. **tRPC schema validation**: Input schemas are strict (Zod). Check `routers.ts` for exact field names/types.
4. **Markdown structure matters**: Audit checks expect specific section headers (case-sensitive). See `lib/reqToFrd.ts` `auditMarkdown()`.
5. **Streaming responses**: Generation uses chunked responses; ensure client-side event handlers drain streams to avoid hangs.
6. **Bundle size warning**: Main bundle is ~1.7MB. For production, consider code-splitting high-weight dependencies (mermaid, charts) with dynamic import().
7. **Test API key**: 2 integration tests fail without OPENROUTER_API_KEY, but 37 core tests work without it. Use `pnpm test:quick` for local development.

## File Structure at a Glance

```
.
├── client/src/                    # React frontend
│   ├── components/                # UI components (Radix-based)
│   ├── lib/                       # Utilities (reqToFrd, exportDocx, previewPagination)
│   ├── pages/                     # Route components (Home, NotFound)
│   └── App.tsx                    # Root router & providers
├── server/                        # Express backend
│   ├── _core/                     # Core (LLM, DB, auth, Vite dev setup)
│   ├── routers.ts                 # tRPC router definitions
│   ├── *.test.ts                  # Test files
│   └── db.ts, openrouter.ts, storage.ts  # Main integrations
├── shared/                        # Shared types & constants
├── lib/req-to-frd/               # FRD template & prompts
│   └── templates/enterprise-audit-frd.ts
├── drizzle/                       # DB schema & migrations
├── vite.config.ts                 # Vite + debug collector
├── vitest.config.ts               # Vitest config
└── package.json                   # Scripts & dependencies
```

## Notes for Future Contributors

- Keep template changes in `lib/req-to-frd/templates/` versioned (bump `ENTERPRISE_AUDIT_FRD_TEMPLATE_VERSION`)
- Audit rules are embedded in `client/src/lib/reqToFrd.ts` — sync with template if modifying mandatory sections
- DOCX export logic is in `client/src/lib/exportDocx.ts` — test export before shipping layout changes
- tRPC procedures accept large payloads (50MB limit set in Express middleware) for file uploads
