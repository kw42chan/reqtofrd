# Development Workflow - Guidelines & Best Practices

This guide outlines the recommended workflow and best practices for daily development on ReqToFRD.

---

## Daily Development Cycle

### 1. Start Your Day

```bash
# Pull latest changes
git pull origin main

# Install any new dependencies
pnpm install

# Verify everything still works
pnpm check && pnpm test:quick
```

**Time**: ~2 minutes

### 2. Start Dev Server

```bash
# Keep this running in a dedicated terminal
pnpm dev
```

**Expected**:
- Server runs on http://localhost:3000
- Client HMR ready (hot reload on save)
- No TypeScript errors

### 3. Make Changes

Edit files in:
- `client/src/` - React components, pages, utilities
- `server/` - tRPC procedures, business logic
- `shared/` - Types used by both client and server

Changes auto-reload thanks to:
- **Client**: Vite HMR (instant reload)
- **Server**: tsx watch (auto-restart)

### 4. Verify Changes

```bash
# In a second terminal, run as you code
pnpm check                    # Type safety
pnpm test:quick               # Core tests
pnpm test -- --grep "pattern" # Specific tests
```

### 5. Before Committing

```bash
# Format code
pnpm format

# Run all checks
pnpm check
pnpm test:quick
pnpm build  # Verify production build

# Commit
git add .
git commit -m "feat: describe your change"
```

**Time**: ~5 minutes per commit

### 6. End Your Day

```bash
# Pull any team changes
git pull origin main

# Push your commits
git push origin your-branch

# Verify CI passes
# Check GitHub Actions for build status
```

---

## Feature Development Workflow

### Step 1: Plan

Before coding:
1. Read [REQUIREMENTS.md](../requirements/REQUIREMENTS.md) for success criteria
2. Check [IMPROVEMENTS.md](../tracking/IMPROVEMENTS.md) for what was done
3. Outline your changes in comments or a local branch note

### Step 2: Create Feature Branch

```bash
# Create branch from main
git checkout -b feat/feature-name

# Example branch names:
# - feat/add-export-pdf
# - fix/audit-scoring-bug
# - docs/improve-setup-guide
# - refactor/extract-llm-logic
```

### Step 3: Implement Feature

**Client-side (React component)**:
```typescript
// 1. Create component file
// client/src/components/NewComponent.tsx

import { useState } from 'react';

export function NewComponent() {
  const [state, setState] = useState('initial');
  
  return (
    <div>
      {/* Component JSX */}
    </div>
  );
}

// 2. Add to exports
// client/src/components/index.ts
export { NewComponent } from './NewComponent';

// 3. Use in page
// client/src/pages/Home.tsx
import { NewComponent } from '@/components';

export function Home() {
  return <NewComponent />;
}
```

**Server-side (tRPC procedure)**:
```typescript
// 1. Add procedure
// server/routers.ts

export const router = t.router({
  myProcedure: t.procedure
    .input(z.object({ /* input schema */ }))
    .mutation(async ({ input }) => {
      // Business logic
      return { result: 'value' };
    }),
});

// 2. Type-safe client call
// client/src/pages/Home.tsx
import { trpc } from '@/lib/trpc';

export function Home() {
  const mutation = trpc.myProcedure.useMutation();
  
  return (
    <button onClick={() => mutation.mutate({ /* typed input */ })}>
      Call procedure
    </button>
  );
}
```

### Step 4: Test Changes

```bash
# Write test
# server/myFeature.test.ts

import { describe, it, expect } from 'vitest';
import { myFunction } from './myFeature';

describe('myFeature', () => {
  it('does something', () => {
    const result = myFunction('input');
    expect(result).toBe('expected');
  });
});

# Run test
pnpm test -- myFeature.test.ts

# Run with watch
pnpm test:watch
```

### Step 5: Manual Testing

1. Open browser to http://localhost:3000
2. Test the feature end-to-end
3. Check browser console for errors (F12)
4. Check terminal for server errors
5. Test on mobile (DevTools → responsive mode)

### Step 6: Code Review (Self)

```bash
# See your changes
git diff

# Ask yourself:
# - Does this follow existing patterns?
# - Are variable names clear?
# - Are there comments explaining "why"?
# - Did I test the happy path and edge cases?
# - Will this confuse future developers?
```

### Step 7: Commit & Push

```bash
# Format before committing
pnpm format

# Stage changes
git add .

# Commit with descriptive message
git commit -m "feat: add new export format support

- Supports PDF export via LibreOffice
- Preserves formatting from markdown
- Tests cover edge cases with tables/images"

# Push branch
git push origin feat/feature-name

# Create Pull Request on GitHub
# Link to any related issues
# Add description and testing steps
```

---

## Bug Fix Workflow

### Step 1: Reproduce the Bug

```bash
# Find the failing test
pnpm test -- --grep "bug description"

# Or manually in browser
# Document steps to reproduce

# Example:
# 1. Enter requirement "Test"
# 2. Click "Generate"
# 3. Wait 5 seconds
# 4. See error: "Cannot read property X"
```

### Step 2: Write Test First (TDD)

```typescript
// Add failing test
it('should handle missing data gracefully', () => {
  const input = { data: null };
  expect(() => myFunction(input)).not.toThrow();
});

// Run test (should fail)
pnpm test -- --grep "missing data"

// Implement fix
// Run test again (should pass)
```

### Step 3: Fix the Bug

```bash
# Identify root cause
# - Server logs? Check terminal running pnpm dev
# - Client error? Check browser console (F12)
# - Type mismatch? Check pnpm check output
# - Data issue? Check database via pnpm db:studio
```

### Step 4: Verify Fix

```bash
# Run related tests
pnpm test:quick

# Test manually in browser
# Reproduce the original bug steps
# Confirm it's fixed

# Run full test suite
pnpm test
```

### Step 5: Commit

```bash
git commit -m "fix: handle null data in myFunction

Previously threw error when data was missing.
Now gracefully handles null/undefined input.

Fixes #123"
```

---

## Code Quality Standards

### TypeScript Safety

✅ **Always** use TypeScript:
```typescript
// ✓ Good
function processData(input: string): string {
  return input.toUpperCase();
}

// ✗ Avoid
function processData(input) {
  return input.toUpperCase(); // Could fail if input is not string
}
```

**Check regularly**:
```bash
pnpm check  # Should show 0 errors
```

### Testing

✅ **Test critical paths**:
- Audit scoring logic
- DOCX export
- Database operations
- LLM response parsing
- Edge cases

✅ **Minimum coverage**:
- >80% for critical utilities
- >70% for components
- 100% for business logic

```bash
# Run tests
pnpm test:quick  # Fast smoke tests
pnpm test        # Full suite (requires API key)
```

### Code Style

✅ **Format consistently**:
```bash
# Auto-format before committing
pnpm format

# Check formatting
pnpm lint
```

✅ **Naming conventions**:
- Components: PascalCase (`MyComponent.tsx`)
- Utilities: camelCase (`myUtility.ts`)
- Constants: UPPER_SNAKE_CASE (`MAX_SIZE = 100`)
- Files: lowercase-kebab-case (`my-file.ts`)

✅ **Comments**:
- Explain "why", not "what"
- Add comments for non-obvious logic
- Keep comments up-to-date

```typescript
// ✓ Good - explains why
// We use setImmediate to ensure DOM updates before measurement
setImmediate(() => measureElement());

// ✗ Avoid - obvious from code
// Set immediate to measure element
setImmediate(() => measureElement());
```

### Performance

✅ **Monitor bundle size**:
```bash
pnpm build
ls -lh dist/
# Main bundle should be <2MB
```

✅ **Avoid common issues**:
- ❌ Rendering in loops
- ❌ Unnecessary re-renders (use React.memo)
- ❌ Large JSON responses (paginate)
- ❌ Blocking operations in UI thread

---

## Working with Branches

### Main Branch Protection

- **main** branch is protected
- Requires Pull Request + approval
- CI must pass (tests, type check, build)

### Branch Strategy

```
main (production-ready)
  ↑
release/v1.0 (release candidate)
  ↑
develop (integration branch)
  ↑
feat/feature-name (feature branches)
```

**In practice**:
- Create branches from `main`
- Push to your feature branch
- Create PR to `main`
- After merge, delete branch

### Keeping Branch Updated

```bash
# Before starting work
git pull origin main

# While working, if main changed
git fetch origin
git rebase origin/main

# Or merge if rebase is scary
git merge origin/main
```

---

## Common Patterns

### Adding a New API Endpoint

```typescript
// 1. Define input schema
const analysisInput = z.object({
  requirement: z.string().min(20),
  context: z.string().optional(),
});

// 2. Create procedure
export const router = t.router({
  reqToFrd: t.router({
    analyze: t.procedure
      .input(analysisInput)
      .query(async ({ input }) => {
        const questions = await generateQuestions(input.requirement);
        return { questions };
      }),
  }),
});

// 3. Use in client
const { data } = trpc.reqToFrd.analyze.useQuery({
  requirement: userInput,
});

// 4. Test
it('generates questions for requirement', async () => {
  const result = await caller.reqToFrd.analyze({ requirement: 'Test' });
  expect(result.questions).toHaveLength(3);
});
```

### Modifying Database Schema

```typescript
// 1. Edit schema
// drizzle/schema.ts
export const documents = mysqlTable('documents', {
  id: varchar('id', { length: 255 }).primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  newField: text('new_field'), // Add new field
});

// 2. Generate migration
pnpm db:push
# Creates drizzle/xxx_add_new_field.sql

// 3. Test locally
pnpm db:studio
# Verify table has new field

// 4. Update server code to use new field
// 5. Add tests
// 6. Commit schema + migration + tests together
```

### Error Handling

```typescript
// Server-side
export const router = t.router({
  generate: t.procedure
    .input(inputSchema)
    .mutation(async ({ input }) => {
      try {
        const result = await generateFRD(input);
        return { success: true, data: result };
      } catch (error) {
        if (error instanceof ValidationError) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: error.message,
          });
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to generate FRD',
        });
      }
    }),
});

// Client-side
const mutation = trpc.generate.useMutation({
  onError: (error) => {
    if (error.data?.code === 'BAD_REQUEST') {
      toast.error(`Invalid input: ${error.message}`);
    } else {
      toast.error('Server error, try again');
    }
  },
});
```

---

## Review Checklist Before Pushing

- [ ] Code follows TypeScript best practices (`pnpm check` passes)
- [ ] All tests pass (`pnpm test:quick` or `pnpm test`)
- [ ] Code is formatted (`pnpm format`)
- [ ] No console errors or warnings
- [ ] Feature works end-to-end in browser
- [ ] Database schema updated if needed
- [ ] Tests added for new features
- [ ] Comments explain "why" for non-obvious logic
- [ ] No breaking changes to existing APIs
- [ ] Branch updated with latest main (`git pull origin main`)

---

## Useful Commands Reference

| Task | Command | Notes |
|------|---------|-------|
| Start dev | `pnpm dev` | Run in dedicated terminal |
| Type check | `pnpm check` | Do before committing |
| Quick tests | `pnpm test:quick` | 37 tests, ~1 sec |
| Full tests | `pnpm test` | Requires OPENROUTER_API_KEY |
| Watch tests | `pnpm test:watch` | Re-run on file change |
| Test UI | `pnpm test:ui` | Visual test dashboard |
| Format | `pnpm format` | Auto-fix formatting |
| Lint | `pnpm lint` | Check without changing |
| Build | `pnpm build` | Production build |
| Start prod | `NODE_ENV=production pnpm start` | Test production build |
| DB migrations | `pnpm db:push` | Apply schema changes |
| DB browser | `pnpm db:studio` | Visual DB management |

---

## Tips & Tricks

### Quick Test Re-run

```bash
# Last 5 seconds of output while testing
pnpm test:watch  # Re-runs tests on file save
```

### Skip Unrelated Tests

```bash
# Run only one test file
pnpm test -- server/reqToFrd.test.ts

# Run tests matching pattern
pnpm test -- --grep "audit"

# Skip specific test
it.skip('expensive operation', () => { ... });
```

### Debug in Browser

1. **Open DevTools**: F12
2. **Sources tab**: Add breakpoint in TypeScript code
3. **Console tab**: Run code: `trpc.myProcedure.query(...)`

### Reset to Known-Good State

```bash
# If things are broken:
git stash                  # Discard changes
git pull origin main       # Get latest
rm -rf node_modules        # Clean install
pnpm install
pnpm check && pnpm test:quick
```

---

## Help & Debugging

1. Check **Troubleshooting** in [GETTING_STARTED.md](./GETTING_STARTED.md)
2. Read [DEBUGGING.md](./DEBUGGING.md) for detailed debugging
3. Check [REQUIREMENTS.md](../requirements/REQUIREMENTS.md) for what should work
4. Review [CLAUDE.md](../../CLAUDE.md) for architecture
5. Check `.manus-logs/` for browser/network logs

---

## Next Session Handoff

When finishing your work day:

1. **Commit all changes**: `git push origin your-branch`
2. **Create PR** if ready for review
3. **Update** [IMPROVEMENTS.md](../tracking/IMPROVEMENTS.md) with what you've done
4. **Note** any blockers or next steps in PR description

This helps future sessions (including AI) understand the context and continue smoothly.

Happy coding! 🚀
