# REQUIREMENTS.md

This document outlines the complete requirements and success criteria for the ReqToFRD project.

## Project Goal

Build a full-stack web application that generates enterprise-grade Functional Requirements Documents (FRD) from high-level requirements using AI, with enterprise audit compliance, interactive clarification, and professional DOCX export.

## Functional Requirements

### 1. Requirements Clarification Module

- **Input**: High-level requirement text (min 20 characters)
- **Process**: Send to LLM and receive 3-5 clarification questions organized by category
- **Categories**: Business Logic, Integration, Scope Boundary, Exception Handling
- **Output**: Interactive Q&A cards where user can provide answers
- **Success Criteria**:
  - Questions are generated and displayed within 5 seconds
  - Each question clearly explains what information is needed
  - User can submit individual answers and modify them
  - State persists during the session

### 2. FRD Generation Module

- **Input**: Requirement + clarification answers + metadata (Request ID, Region, System, etc.)
- **Process**: Stream markdown from LLM with mandatory enterprise structure
- **Output**: Formatted FRD with sections:
  - Cover Page (document metadata and sign-off table)
  - Functional Requirements (FR-01, FR-02, etc. with subsections)
  - Integration section with retry/error handling
  - Out of Scope section
- **Success Criteria**:
  - Generation starts within 2 seconds
  - Markdown is streamed to client in real-time
  - User can cancel generation mid-stream
  - Generated document follows template structure exactly

### 3. Preview & Editing Module

- **Rendered Preview**: Display formatted FRD markdown with proper typography
- **Raw Markdown Tab**: Show editable markdown source
- **Audit Tab**: Display compliance score and gap list
- **Floating Toolbar**: Copy, Quick Edit, Download DOCX buttons
- **Success Criteria**:
  - Preview renders without layout shifts
  - Markdown editor updates preview in real-time (debounced)
  - Copy button works for all content
  - All three tabs are responsive on mobile

### 4. Audit Compliance System

- **Checks**: Verify mandatory sections, FR identifiers, required subsections, sign-off roles
- **Score**: Calculate 0-100 compliance percentage
- **Gaps**: List specific missing or incomplete elements
- **Audit Rules**:
  - Must have "Cover Page" section
  - Must have "Revision History" with version, date (DD-MMM-YY format), and remarks
  - Must have "Executive Summary & Scope Boundary"
  - Must have "Functional Requirements" with at least one FR-NN identifier
  - Each FR must have: Input Parameters, Processing Logic, Output/Response, Exception Handling
  - Must have "Integration" section with retry/error handling
  - Must have "Out of Scope" section
  - Distribution & Sign-off table must have all required roles
- **Success Criteria**:
  - Audit score matches actual document compliance
  - All gaps are actionable and accurate
  - Tests cover all audit rules

### 5. DOCX Export Module

- **Format**: Professional Word document with:
  - Proper heading hierarchy (Heading 1, 2, 3)
  - Bold text, lists, blockquotes, tables
  - Cover page with document metadata
  - Distribution & sign-off table on dedicated page
  - Page breaks between sections
  - Sanitized filename based on document title
- **Success Criteria**:
  - Export works without errors
  - Generated DOCX opens in Microsoft Word, Google Docs, LibreOffice
  - Formatting is preserved and professional
  - Filename is safe and descriptive

### 6. Enterprise Metadata Management

- **Required Fields**:
  - Document Title
  - Request ID / Demand ID
  - Region (e.g., Global, APAC, EMEA)
  - System name
  - Enhancement Title
  - Revision Version (e.g., 1.0, 1.1)
  - Revision Description
  - Updated By (name)
  - Revision Date (DD-MMM-YY format)
  - Revision Remarks
- **Distribution List**: Repeatable entries for:
  - Requestor of Business
  - Department Head
  - IT Department
  - Each with: Name, Title, Role (Reviewer/Approver/Informer)
- **Success Criteria**:
  - All fields validate correctly
  - Distribution list can be added/removed dynamically
  - Metadata is preserved across clarification and generation cycles
  - Can start new requirement cycle without resetting metadata

### 7. UI/UX Requirements

- **Responsive Design**: Works on desktop (1280px), tablet (768px), mobile (375px)
- **Split-screen Layout**: Metadata/Q&A on left, preview on right (desktop); stacked on mobile
- **Status Badge**: Shows workflow state (Idle → Clarifying → Generating → Completed)
- **Dark/Light Mode**: Theme context provider with system preference detection
- **Accessibility**:
  - Focus management on interactive elements
  - Live region announcements for status changes
  - Proper semantic HTML with landmarks
  - Reduced motion support
- **Success Criteria**:
  - No layout shifts or reflows during interactions
  - All forms are keyboard navigable
  - Touch targets are 44px minimum on mobile
  - Color contrast meets WCAG AA

### 8. LLM Integration (OpenRouter)

- **Provider**: OpenRouter API for LLM access
- **Models**: Support Claude 3.5 Sonnet (default), GPT-4, and other OpenRouter models
- **Features**:
  - Streaming responses for real-time feedback
  - Token counting and usage tracking
  - Timeout recovery with retry logic
  - Graceful degradation if model unavailable
  - Support for custom API key per session
- **Success Criteria**:
  - Questions generated within 5 seconds
  - FRD generation completes within 30 seconds
  - Streaming works on all major browsers
  - Timeouts are handled without losing user data

### 9. Database & Storage

- **Database**: MySQL with Drizzle ORM
- **Schema**: Support for document storage, user sessions, revision history
- **S3 Integration**: Support for file storage and presigned URLs for uploads/downloads
- **Success Criteria**:
  - Database migrations run without errors
  - Data persists correctly across sessions
  - S3 upload/download works if configured

### 10. Testing Requirements

- **Coverage**: Unit tests for core logic (reqToFrd, exportDocx, audit)
- **Integration**: E2E tests for clarify → generate → export flow
- **Procedure Tests**: Verify tRPC procedures work correctly
- **Mock Data**: Realistic samples for testing without live LLM calls
- **Success Criteria**:
  - All tests pass locally and in CI
  - Coverage >80% for critical paths
  - Tests run in <10 seconds

## Success Criteria (Overall)

### Functional

✅ Application builds without errors (`pnpm build`)
✅ All tests pass (`pnpm test`)
✅ Type checking passes (`pnpm check`)
✅ No console errors in browser
✅ Clarification Q&A generates and displays correctly
✅ FRD generation works end-to-end
✅ Audit compliance scoring is accurate
✅ DOCX export produces valid Word documents
✅ Responsive design works on mobile/tablet/desktop
✅ Dark/light theme toggle works

### Performance

✅ Page loads in <2 seconds
✅ Clarification response in <5 seconds
✅ FRD generation starts within 2 seconds
✅ No memory leaks or performance degradation over time

### Code Quality

✅ No TypeScript errors or warnings
✅ Code formatted consistently
✅ No dead code or unused imports
✅ Clear comments for non-obvious logic
✅ Proper error handling and user feedback

### Documentation

✅ CLAUDE.md explains architecture and development workflow
✅ REQUIREMENTS.md (this file) documents all requirements
✅ SELF_IMPROVE.md documents self-improvement process
✅ Code comments explain "why" not "what"
✅ Commit messages are clear and descriptive

## Known Constraints

1. **OpenRouter API Key**: Required for generation; must be provided by user or via env var
2. **MySQL Database**: Required for session management and document storage
3. **Browser Compatibility**: Modern browsers (Chrome, Firefox, Safari, Edge)
4. **File Upload Limit**: 50MB max for file uploads
5. **Streaming Response**: Requires browser support for fetch streaming API

## Future Enhancements (Out of Current Scope)

- Multi-user collaboration and real-time sync
- Version control and branching for documents
- Template customization UI
- Export to PDF, HTML, markdown
- Integration with Jira, GitHub, or other project management tools
- Admin panel for template management
- Analytics and usage tracking
