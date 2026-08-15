# Development Guides

Complete guides for getting started, daily development, and debugging the ReqToFRD project.

## 🚀 Quick Navigation

| Goal | Read This | Time |
|------|-----------|------|
| **Set up project for first time** | [GETTING_STARTED.md](./GETTING_STARTED.md) | 15 min |
| **Start dev server** | [GETTING_STARTED.md#step-4-start-the-development-server](./GETTING_STARTED.md#step-4-start-the-development-server) | 2 min |
| **Learn daily development workflow** | [DEVELOPMENT_WORKFLOW.md](./DEVELOPMENT_WORKFLOW.md) | 10 min |
| **Implement a new feature** | [DEVELOPMENT_WORKFLOW.md#feature-development-workflow](./DEVELOPMENT_WORKFLOW.md#feature-development-workflow) | varies |
| **Fix a bug** | [DEVELOPMENT_WORKFLOW.md#bug-fix-workflow](./DEVELOPMENT_WORKFLOW.md#bug-fix-workflow) | varies |
| **Debug an error** | [DEBUGGING.md](./DEBUGGING.md) | varies |
| **Troubleshoot common issues** | [DEBUGGING.md#common-client-errors](./DEBUGGING.md#common-client-errors) | 5 min |

---

## 📖 Guide Overview

### GETTING_STARTED.md
**Complete setup guide for new developers**

**Covers**:
- ✅ Prerequisites (Node.js, pnpm, MySQL)
- ✅ Step-by-step installation
- ✅ Environment configuration (.env setup)
- ✅ Database initialization
- ✅ Starting the development server
- ✅ Verifying everything works
- ✅ Common troubleshooting
- ✅ Development server modes

**Read this first if**:
- It's your first time on this project
- You're setting up a new machine
- You need to configure the database

**Time to read**: ~15 minutes (including setup steps)

---

### DEVELOPMENT_WORKFLOW.md
**Daily development patterns and best practices**

**Covers**:
- ✅ Daily development cycle (start → code → verify → commit)
- ✅ Feature development workflow
- ✅ Bug fix workflow (TDD approach)
- ✅ Code quality standards (TypeScript, testing, style)
- ✅ Git workflow and branching strategy
- ✅ Common patterns (API endpoints, schema changes, error handling)
- ✅ Review checklist before pushing
- ✅ Tips and tricks for productivity

**Read this when**:
- Starting work on a new feature
- Need to understand development patterns
- Fixing a bug
- Before committing code

**Time to read**: ~20 minutes (reference as needed)

---

### DEBUGGING.md
**Troubleshooting guide for errors and issues**

**Covers**:
- ✅ Quick diagnosis flowchart
- ✅ Client-side debugging (browser console, DevTools)
- ✅ Server-side debugging (terminal logs, Node debugger)
- ✅ Test debugging (single tests, breakpoints)
- ✅ Build errors and solutions
- ✅ Database debugging and common issues
- ✅ Performance debugging
- ✅ Emergency fixes
- ✅ Logging best practices

**Read this when**:
- You see an error message
- Tests are failing
- Build is broken
- Something isn't working as expected

**Time to read**: 5-30 minutes depending on your issue

---

## 🎯 Common Workflows

### I'm new to the project
1. Read [GETTING_STARTED.md](./GETTING_STARTED.md) - **15 minutes**
2. Complete all setup steps
3. Read [DEVELOPMENT_WORKFLOW.md](./DEVELOPMENT_WORKFLOW.md) - **10 minutes**
4. Start coding!

### I'm adding a feature
1. Read [DEVELOPMENT_WORKFLOW.md#feature-development-workflow](./DEVELOPMENT_WORKFLOW.md#feature-development-workflow)
2. Follow the step-by-step guide
3. Reference code patterns in the same document
4. Use review checklist before pushing

### I found a bug
1. Read [DEVELOPMENT_WORKFLOW.md#bug-fix-workflow](./DEVELOPMENT_WORKFLOW.md#bug-fix-workflow)
2. Write a test that reproduces the bug
3. Fix the bug
4. Verify test passes

### Something is broken
1. Look at error message in:
   - Browser console (F12) for client errors
   - Terminal output for server errors
2. Search [DEBUGGING.md](./DEBUGGING.md) for your error type
3. Follow the solution steps
4. Still stuck? Check emergency fixes in DEBUGGING.md

### I want to start the dev server
1. Run: `pnpm dev`
2. Open: http://localhost:3000
3. See: [GETTING_STARTED.md#step-4-start-the-development-server](./GETTING_STARTED.md#step-4-start-the-development-server) for details

---

## 📚 Related Documentation

**For understanding the project**:
- Read [CLAUDE.md](../../CLAUDE.md) for architecture overview
- Read [REQUIREMENTS.md](../requirements/REQUIREMENTS.md) for project goals

**For tracking progress**:
- Check [IMPROVEMENTS.md](../tracking/IMPROVEMENTS.md) for what was improved
- Check [BUILD_STATUS.md](../tracking/BUILD_STATUS.md) for current state
- Check [SESSION_SUMMARY.md](../tracking/SESSION_SUMMARY.md) for last session's work

**For self-improvement**:
- Read [SELF_IMPROVE.md](../requirements/SELF_IMPROVE.md) for methodology
- Before stopping, follow the process to improve the project

---

## 🔍 Search Tips

**In this folder**:
- `Ctrl+F` to search within a guide
- Search for keywords like "error", "debug", "setup", "workflow"

**In your editor** (VS Code):
- `Ctrl+Shift+F` to search all guides
- Example: Search "Cannot read property" to find debugging tips

---

## ✅ Verification Checklist

After reading the guides:

- [ ] I can start the dev server (`pnpm dev` works)
- [ ] I can see the app at http://localhost:3000
- [ ] I understand the daily development workflow
- [ ] I know how to debug errors
- [ ] I can run tests (`pnpm test:quick` works)
- [ ] I know what to do before committing

If all boxes are checked, you're ready to develop! 🚀

---

## Questions or Issues?

1. **Check the relevant guide** for your question
2. **Search** the guide for keywords related to your issue
3. **Read** related documentation in parent folder (requirements/, tracking/)
4. **Ask** - check comments in the code or GitHub issues

Happy developing! 💻
