# Debugging Guide - Troubleshooting & Error Resolution

This guide helps you quickly diagnose and fix issues in the ReqToFRD project.

---

## Quick Diagnosis Flowchart

```
Does the error happen?
│
├─ In browser (F12 console)? → See "Client-Side Debugging"
├─ In terminal running pnpm dev? → See "Server-Side Debugging"
├─ During tests (pnpm test)? → See "Test Debugging"
├─ During build (pnpm build)? → See "Build Errors"
└─ During database operations? → See "Database Debugging"
```

---

## Client-Side Debugging

### Step 1: Open Browser DevTools

**Keyboard shortcuts**:
- **Windows/Linux**: F12 or Ctrl+Shift+I
- **macOS**: Cmd+Option+I or Cmd+Option+J

### Step 2: Check Console Tab

Look for red error messages:

```javascript
// Example error
Uncaught TypeError: Cannot read property 'map' of undefined
  at Home.tsx:45
```

**Solutions**:
1. Look at the file and line number (Home.tsx:45)
2. Check if the data is actually available
3. Add type safety with TypeScript

### Common Client Errors

#### "Cannot read property X of undefined"

```typescript
// ✗ Wrong - no null check
const names = users.map(u => u.name);

// ✓ Right - null-safe
const names = users?.map(u => u.name) ?? [];
```

**Fix**:
1. Use optional chaining: `object?.property`
2. Provide default values: `?? defaultValue`
3. Add null checks: `if (data) { ... }`

#### "X is not a function"

```typescript
// ✗ Wrong
const data = fetchData();  // Returns Promise, not data
data.map(...)

// ✓ Right
const data = await fetchData();
data.map(...)
```

**Fix**:
1. Add `await` for async functions
2. Check variable types in TypeScript
3. Use type inference: hover over variable in VS Code

#### "Module not found"

```typescript
// ✗ Wrong - file doesn't exist
import { Component } from '@/components/NonExistent';

// ✓ Right
import { Component } from '@/components';
```

**Fix**:
1. Verify file exists: `ls client/src/components/`
2. Check export in the file: `export { Component }`
3. Use correct path aliases (`@/`, `@shared/`, `@assets/`)

### Step 3: Use Sources Tab (Breakpoints)

Set breakpoints to pause execution:

1. **Open Sources tab**
2. **Click line number** to set breakpoint
3. **Reload page** (F5)
4. **Execution pauses** at breakpoint
5. **Step through code** (F10 to step over, F11 to step into)
6. **Inspect variables** in right panel

```typescript
// Example: Debug a value
function Home() {
  const [count, setCount] = useState(0);
  
  const handleClick = () => {
    setCount(count + 1);
    // Set breakpoint here ↑
    // Will pause and show count value
  };
  
  return <button onClick={handleClick}>{count}</button>;
}
```

### Step 4: Use Console Commands

Test code directly in console:

```javascript
// Check if data is loaded
console.log(window.__data);

// Call tRPC procedure
await trpc.reqToFrd.analyze.query({ requirement: 'Test' });

// Check localStorage
localStorage.getItem('key');

// Trigger component update
// (depends on how you exported the component)
```

### Step 5: Check Network Tab

Monitor API calls:

1. **Open Network tab**
2. **Perform an action** (click button, submit form)
3. **Look for requests** to `/api/trpc/`
4. **Click request** to see details:
   - Request headers and body
   - Response status and body
   - Time taken

**Common issues**:

```
Status 500: Server error
└─ Check server logs in terminal running pnpm dev

Status 400: Bad request
└─ Check input validation in tRPC procedure
   └─ See server-side debugging

Status 401: Unauthorized
└─ Check authentication/session
   └─ Clear cookies: DevTools → Application → Cookies

Status 0: Network error
└─ Check if server is running
└─ Check if port is correct (default 3000)
```

---

## Server-Side Debugging

### Step 1: Check Terminal Output

The terminal running `pnpm dev` shows all server activity:

```
[server] Request: POST /api/trpc/reqToFrd.analyze
[server] Input: { requirement: 'Test' }
[server] Response: { questions: [...] }
[server] Time: 234ms
```

### Step 2: Add Console Logs

```typescript
// In server/routers.ts
export const router = t.router({
  analyze: t.procedure
    .input(analyzeInput)
    .query(async ({ input }) => {
      console.log('[analyze] Received input:', input);
      
      const questions = await generateQuestions(input);
      console.log('[analyze] Generated questions:', questions);
      
      return { questions };
    }),
});
```

**View logs**:
1. Keep `pnpm dev` terminal visible
2. Look for `[analyze]` lines
3. Check values between operations

### Step 3: Use Debugger

Debug server code with Node inspector:

```bash
# Start with debugger enabled
node --inspect-brk node_modules/.bin/tsx server/_core/index.ts

# Or with pnpm
# Edit package.json "dev" script to use --inspect-brk
# Then connect debugger from VS Code
```

**In VS Code**:
1. Create `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "attach",
      "name": "Attach to Node",
      "port": 9229
    }
  ]
}
```

2. Press F5 to attach debugger
3. Set breakpoints and inspect

### Step 4: Check Database

```bash
# View database in visual browser
pnpm db:studio

# Or via MySQL CLI
mysql -u root -p reqtofrd -e "SELECT * FROM documents LIMIT 5;"
```

### Step 5: Check Environment Variables

```bash
# Verify .env is set up correctly
cat .env

# Check specific variable
grep DATABASE_URL .env
grep OPENROUTER_API_KEY .env

# Verify values are not empty
# Should show: DATABASE_URL=mysql://...
# Should show: OPENROUTER_API_KEY=sk-or-v1-...
```

### Common Server Errors

#### "Cannot connect to database"

```
Error: connect ECONNREFUSED 127.0.0.1:3306
```

**Solutions**:
1. Check MySQL is running: `mysql -u root -p -e "SELECT 1;"`
2. Verify DATABASE_URL in `.env`
3. Check connection string format: `mysql://user:pass@host:port/db`

#### "Unknown column X in table Y"

```
Error: Unknown column 'new_column' in 'table'
```

**Solutions**:
1. Schema change not applied: `pnpm db:push`
2. Migration failed: Check `drizzle/` folder for migration files
3. Stale database: Drop and recreate: `mysql -u root -p -e "DROP DATABASE reqtofrd; CREATE DATABASE reqtofrd;"`

#### "OPENROUTER_API_KEY not found"

```
Error: OPENROUTER_API_KEY is required
```

**Solutions**:
1. Set in `.env`: `OPENROUTER_API_KEY=sk-or-v1-...`
2. Verify not empty: `echo $OPENROUTER_API_KEY` (Linux/macOS) or `echo %OPENROUTER_API_KEY%` (Windows)
3. Restart dev server after setting

#### "Procedure validation failed"

```
Error: Input validation failed. Expected string, got number.
```

**Solutions**:
1. Check Zod schema in `routers.ts`
2. Verify client sends correct types
3. Check TypeScript types match schema

```typescript
// Schema says string
const analyzeInput = z.object({
  requirement: z.string(),
});

// But client sent number
await trpc.analyze.query({ requirement: 123 });  // ✗ Wrong

// Fix
await trpc.analyze.query({ requirement: '123' });  // ✓ Right
```

---

## Test Debugging

### Step 1: Run Single Test

```bash
# Run one test file
pnpm test -- server/reqToFrd.test.ts

# Run tests matching pattern
pnpm test -- --grep "audit"

# Show more details
pnpm test -- --reporter=verbose
```

### Step 2: Add Test Logs

```typescript
import { describe, it, expect } from 'vitest';

describe('auditMarkdown', () => {
  it('calculates score correctly', () => {
    const md = '# Cover Page\n## Functional Requirements';
    const score = auditMarkdown(md);
    
    console.log('Score:', score);  // Add this
    
    expect(score).toBeGreaterThan(0);
  });
});
```

Run and see output:
```bash
pnpm test -- --reporter=verbose
```

### Step 3: Debug Test with Breakpoints

```bash
# Run test with debugger enabled
node --inspect-brk node_modules/.bin/vitest run server/reqToFrd.test.ts

# Attach VS Code debugger (F5)
# Set breakpoints in test file
# Execution pauses at breakpoints
```

### Step 4: Common Test Failures

#### "Expected 3, received 2"

```typescript
// ✗ Wrong count
expect(result).toHaveLength(3);
// But result only has 2 items

// Fix
// 1. Check if data is actually loaded
console.log('Result:', result);
// 2. Mock data correctly
// 3. Verify test setup
```

#### "Async operation not completed"

```typescript
// ✗ Wrong - test finishes before async completes
it('generates questions', async () => {
  const result = await generateQuestions('test');
  // Missing: expect statement might run before result is ready
});

// ✓ Right - wait for async
it('generates questions', async () => {
  const result = await generateQuestions('test');
  expect(result).toBeDefined();
});
```

#### "Mock not working"

```typescript
// ✗ Mock set up wrong
vi.mock('./llm', () => ({
  generateQuestions: vi.fn(() => ['Q1']),
}));

// ✓ Correct mock
vi.mock('./llm');
import { generateQuestions } from './llm';

beforeEach(() => {
  vi.mocked(generateQuestions).mockResolvedValue(['Q1']);
});
```

---

## Build Errors

### Step 1: Check Build Output

```bash
pnpm build
# Look for:
# - TypeScript errors
# - Esbuild errors
# - File not found errors
```

### Step 2: Common Build Issues

#### "TypeScript error TS1234"

```
Error: Property 'x' does not exist on type 'y'
```

**Fix**:
1. Run `pnpm check` to see all type errors
2. Add type annotations:
```typescript
// ✗ Wrong
function process(data) {
  return data.x;
}

// ✓ Right
function process(data: Record<string, unknown>) {
  return data.x;
}
```

#### "Module not found during build"

```
Error: Cannot find module './component'
```

**Fix**:
1. Check file exists: `ls -la client/src/components/component.tsx`
2. Check case sensitivity (Linux is case-sensitive)
3. Rebuild node_modules: `rm -rf node_modules && pnpm install`

#### "Port already in use during build"

```
Error: EADDRINUSE: address already in use :::3000
```

**Fix**:
1. Server auto-increments port
2. Or manually specify: `PORT=3001 pnpm dev`
3. Kill existing process: `lsof -i :3000 | grep node | awk '{print $2}' | xargs kill -9`

---

## Database Debugging

### Step 1: Visual Browser

```bash
# Open Drizzle Studio
pnpm db:studio

# Browse tables, see data, run queries
# Open in browser when prompted
```

### Step 2: MySQL CLI

```bash
# Connect to database
mysql -u root -p reqtofrd

# List tables
SHOW TABLES;

# View table structure
DESCRIBE documents;

# View data
SELECT * FROM documents LIMIT 5;

# Check for errors
SELECT * FROM documents WHERE created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR);
```

### Step 3: Common Issues

#### "Duplicate entry"

```
Error: Duplicate entry for primary key
```

**Fix**:
1. Check primary key in schema
2. Ensure IDs are unique before inserting
3. Use `REPLACE` or `INSERT ... ON DUPLICATE KEY UPDATE`

#### "Data type mismatch"

```
Error: Incorrect data type for column X
```

**Fix**:
1. Check column type in `drizzle/schema.ts`
2. Verify data being stored matches type
3. Run migration if schema changed: `pnpm db:push`

---

## Performance Debugging

### Monitor Slow Operations

```bash
# Build time
time pnpm build
# Should be < 60 seconds

# Test time
time pnpm test:quick
# Should be < 2 seconds

# Type check time
time pnpm check
# Should be < 30 seconds
```

### Profile in Browser

1. **Open DevTools** (F12)
2. **Performance tab**
3. **Click Record**
4. **Perform action** (click button, scroll, etc.)
5. **Click Stop**
6. **Analyze** timing of operations

### Check Memory Leaks

1. **DevTools → Memory**
2. **Take heap snapshot**
3. **Perform action**
4. **Take another snapshot**
5. **Compare snapshots** - look for growing objects

---

## Logging Best Practices

### Client-Side Logging

```typescript
// ✓ Good - prefixed for easy filtering
console.log('[MyComponent] State updated:', state);
console.error('[MyComponent] Error:', error);

// Use different levels
console.log('info');      // General info
console.warn('warning');  // Warnings
console.error('error');   // Errors
```

### Server-Side Logging

```typescript
// ✓ Good - structured logs
console.log('[procedure-name] Starting operation');
console.log('[procedure-name] Input:', input);
console.log('[procedure-name] Result:', result);
console.error('[procedure-name] Error:', error);
```

### Filter Logs in Browser

```javascript
// In console, filter by prefix
// Show only logs starting with [MyComponent]
Object.defineProperty(console, 'log', {
  value: (...args) => {
    if (String(args[0]).startsWith('[MyComponent]')) {
      console.log(...args);
    }
  }
});
```

---

## Emergency Fixes

### Everything is broken

```bash
# Clean slate
git stash
git pull origin main
rm -rf node_modules pnpm-lock.yaml
pnpm install
pnpm check && pnpm test:quick

# Should be working now
pnpm dev
```

### Database corruption

```bash
# Backup data if needed
mysqldump -u root -p reqtofrd > backup.sql

# Recreate database
mysql -u root -p -e "DROP DATABASE reqtofrd; CREATE DATABASE reqtofrd;"

# Migrate schema
pnpm db:push
```

### Port conflicts

```bash
# Find process using port 3000
lsof -i :3000

# Kill it
kill -9 <PID>

# Or use different port
PORT=3001 pnpm dev
```

---

## Getting Help

1. **Check this guide** for your specific error
2. **Search** terminal output and console for error messages
3. **Read** [GETTING_STARTED.md](./GETTING_STARTED.md) for setup issues
4. **Review** [DEVELOPMENT_WORKFLOW.md](./DEVELOPMENT_WORKFLOW.md) for patterns
5. **Check** [REQUIREMENTS.md](../requirements/REQUIREMENTS.md) for expected behavior
6. **Review** [CLAUDE.md](../../CLAUDE.md) for architecture

---

## Tips for Faster Debugging

| Situation | Command | Time Saved |
|-----------|---------|-----------|
| Need to see one test | `pnpm test -- --grep "name"` | 3 min |
| Type errors everywhere | `pnpm check` | 2 min |
| Need clean state | `git stash && git pull` | 5 min |
| Port conflict | `PORT=3001 pnpm dev` | 1 min |
| DB questions | `pnpm db:studio` | 3 min |
| Bundle size issue | `pnpm build && ls -lh dist/` | 2 min |

---

Good luck debugging! 🔍
