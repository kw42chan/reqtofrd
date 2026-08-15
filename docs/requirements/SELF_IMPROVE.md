# SELF_IMPROVE.md

This document outlines the self-improvement process for Claude Code instances working on the ReqToFRD project. Follow this process after completing the main development cycle.

## Self-Improvement Process

### Step 1: Identify Improvement Opportunities

After completing the build and product review, analyze the following areas:

#### 1.1 Documentation Gaps

- **Review**: Check CLAUDE.md, REQUIREMENTS.md, and code comments
- **Questions to Ask**:
  - Are there undocumented architectural patterns?
  - Are there common tasks that should be in the development guide?
  - Are there gotchas discovered during development that aren't documented?
- **Action**: Update CLAUDE.md with missing patterns or tips

#### 1.2 Development Workflow Inefficiencies

- **Review**: Track commands run during the development cycle
- **Questions to Ask**:
  - Which commands were run most frequently?
  - Were there commands that should exist but don't?
  - Are there scripts that could speed up common workflows?
- **Action**: Add helper scripts or aliases to package.json, or create a Makefile
- **Example**: If you find yourself running `pnpm test -- --grep <pattern>` frequently, document it better or create a shortcut

#### 1.3 Testing Gaps

- **Review**: Check test coverage and identify untested code paths
- **Questions to Ask**:
  - Are there critical paths without tests?
  - Are there edge cases discovered during testing that need test coverage?
  - Are there components that should have E2E tests?
- **Action**: Add new tests or improve existing test clarity

#### 1.4 Code Quality Issues

- **Review**: Check for patterns that appear repeatedly
- **Questions to Ask**:
  - Is there duplicated logic that should be extracted?
  - Are there utilities that should be shared between client and server?
  - Are there type safety opportunities that were missed?
- **Action**: Extract common patterns into shared utilities

#### 1.5 Architecture Limitations

- **Review**: Consider scalability and maintainability
- **Questions to Ask**:
  - Will the current architecture scale to 10x more features?
  - Are there circular dependencies or tight coupling?
  - Should any modules be split further?
- **Action**: Document architectural decisions in CLAUDE.md

### Step 2: Prioritize Improvements

Rate each improvement opportunity by:

- **Impact**: How much does this improve developer productivity or code quality? (1-5)
- **Effort**: How much work is this? (1-5, where 1 is trivial)
- **Priority**: Impact / Effort score (higher is better)

**Focus on**: High impact + low effort improvements first

### Step 3: Document Improvements

For each improvement implemented, update relevant documentation:

1. **Update CLAUDE.md** if:
   - Adding new commands or workflows
   - Discovering new architectural patterns
   - Identifying important gotchas or constraints

2. **Update package.json** if:
   - Adding new scripts or helper commands
   - Modifying build/test/dev procedures

3. **Update test files** if:
   - Adding new test coverage
   - Clarifying existing test intent with better comments

4. **Update code comments** if:
   - Documenting "why" behind complex logic
   - Explaining non-obvious patterns

### Step 4: Validation Checklist

Before considering self-improvement complete, verify:

- [ ] All documentation updates are clear and accurate
- [ ] New commands/scripts are tested and work as documented
- [ ] Tests still pass after any refactoring
- [ ] TypeScript still passes type checking
- [ ] No new console warnings or errors introduced
- [ ] Changes don't break existing workflows
- [ ] CLAUDE.md reflects the current state accurately

## Common Improvement Patterns

### Pattern 1: Test Coverage Expansion

When you discover a code path that isn't tested during development:

```
1. Write a test that exercises the path
2. Verify it fails first
3. Run the code path manually
4. Verify test now passes
5. Add a comment explaining why this edge case matters
```

### Pattern 2: Documentation Clarity

When you find yourself explaining something verbally:

```
1. Write it down in the relevant .md file
2. Add an example if non-obvious
3. Link from CLAUDE.md if it's a common task
4. Verify future Claude instances would understand without asking
```

### Pattern 3: Workflow Optimization

When you notice a repeated command sequence:

```
1. Create a helper script or npm script
2. Document it in package.json or CLAUDE.md
3. Test it works as expected
4. Consider if other developers would use it
```

### Pattern 4: Code Extraction

When you see similar logic in 2+ places:

```
1. Identify the common pattern
2. Extract to a shared utility in lib/ or shared/
3. Update both call sites to use the utility
4. Add tests for the extracted function
5. Update CLAUDE.md if it's a new architectural pattern
```

## Metrics to Track

Document these metrics to measure improvement over time:

### Development Efficiency

- Time to run full test suite (should be <10 seconds)
- Build time for production bundle
- Number of steps to set up a new feature

### Code Quality

- TypeScript error count (should be 0)
- Number of failing tests (should be 0)
- Code coverage percentage for critical paths (target: >80%)

### Documentation Quality

- Clarity score: Can a new developer understand each section? (1-5 scale)
- Completeness score: Are all important topics covered? (1-5 scale)
- Outdatedness: Any documentation that conflicts with current code? (yes/no)

### Architecture Health

- Circular dependencies (should be 0)
- Average file size in src/ (should be <500 LOC)
- Number of utility functions doing "too many things" (should be 0)

## Self-Improvement Success Criteria

After completing self-improvement, verify:

✅ CLAUDE.md has been reviewed and updated if needed
✅ At least 1 improvement opportunity has been identified and documented
✅ All tests still pass
✅ Type checking still passes
✅ No regressions introduced
✅ New documentation is clear and actionable

## Example Self-Improvement Session

### Scenario: Discovered testing opportunity

1. During product review, notice there's no test for the error case when LLM returns malformed markdown
2. Write a test in `server/reqToFrd.procedures.test.ts` that mocks a broken LLM response
3. Run the test, verify it catches the issue
4. Add error handling in the client to gracefully show error message
5. Add a comment explaining why this edge case matters
6. Update CLAUDE.md with: "Test malformed LLM responses in procedures tests"
7. Run full test suite, ensure all tests pass
8. Commit with message: "Add test for malformed FRD markdown edge case"

### Scenario: Discovered documentation gap

1. During development, notice that the streaming response flow isn't documented
2. Add a "Request Flow" section to CLAUDE.md explaining how data flows from client to server and back
3. Include an ASCII diagram or description
4. Verify future developers would understand without asking
5. Commit with message: "Document streaming response flow in CLAUDE.md"

## When to Stop Self-Improvement

Stop self-improvement when:

1. ✅ All success criteria from REQUIREMENTS.md are met
2. ✅ All tests pass and product review is complete
3. ✅ At least 3 meaningful improvements have been documented
4. ✅ CLAUDE.md accurately reflects the current state
5. ✅ No regressions have been introduced
6. ✅ The codebase is cleaner and better documented than before

## Next Session Guidance

Future Claude Code instances should:

1. Start by reading REQUIREMENTS.md to understand goals
2. Read CLAUDE.md to understand architecture
3. Run `pnpm test` to verify project is in working state
4. Make changes following the documented workflows
5. Before stopping, follow steps in SELF_IMPROVE.md to improve the codebase
6. Update this file if new improvement patterns are discovered
