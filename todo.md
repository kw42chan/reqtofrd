# Project TODO

- [x] Establish the ReqToFRD visual theme, typography, responsive split-screen shell, and top navigation.
- [x] Add exact Idle → Clarifying → Generating → Completed status badge behavior.
- [x] Add document title input, default Enterprise Audit-Compliant FRD template selector, and Export to Word control.
- [x] Build the high-level requirement textarea and sample prompt button.
- [x] Build formatting/alignment accordion with IEEE 830, Agile Enterprise, Banking/Treasury Standard, and Custom guidelines.
- [x] Add required enterprise metadata fields: Request/Demand ID, Region, System, Enhancement Title, requestor, department head, IT Department, sign-off roles, and revision history metadata.
- [x] Create `lib/req-to-frd/templates/enterprise-audit-frd.ts` as a versioned default template module.
- [x] Implement exact clarification prompt JSON contract and exact question categories.
- [x] Implement clarification API/procedure with 3–5 validated questions.
- [x] Build interactive Q&A cards with individual answer fields and workflow actions.
- [x] Implement exact FRD generation prompt with mandatory sections, FR-01 identifiers, required subsections, Markdown formatting, and enterprise language.
- [x] Implement generation API/procedure with streamed markdown output and cancellation handling.
- [x] Build rendered preview, editable raw markdown tab, and audit/gap score tab.
- [x] Add floating Copy to Clipboard, Quick Edit, and Download `.docx` toolbar actions.
- [x] Implement audit checks for mandatory sections, FR identifiers, required FR subsections, integration retry coverage, DD-MMM-YY dates, sign-off roles, and out-of-scope completeness.
- [x] Implement styled DOCX export for headings, paragraphs, bold text, lists, blockquotes, tables, and sanitized title-based filenames.
- [x] Add accessibility landmarks, focus states, live-region announcements, responsive mobile flow, and reduced-motion support.
- [x] Expand Vitest coverage for workflow state transitions, validation, prompt/template assembly, markdown normalization, DOCX blocks, and analyze/generate procedures; includes mocked analyze/generate success and malformed-output tests.
- [x] Run type checks, tests, browser verification, desktop/mobile screenshots, and fix discovered issues.
- [x] Save the final webdev checkpoint and deliver the project version.

- [x] Expose revision version, revision description, updated by, and revision remarks in the metadata UI.
- [x] Add generation cancellation/reset handling around the live preview update loop; backend output remains provider-response based.
- [x] Add Download `.docx` to the right-panel floating toolbar.
- [x] Expand Vitest coverage for workflow validation, template prompt assembly, markdown parsing, DOCX blocks, and analyze/generate procedures.
- [x] Save the final webdev checkpoint and record the delivered project version.
- [x] Handle aborted generation explicitly so reset/cancel stays Idle without an error toast.

- [x] Separate document identifiers from participant distribution-list metadata in the UI and generation payload.
- [x] Add repeatable Requestor of Business, Department Head, and IT Department distribution-list entries with Reviewer, Approver, and Informer role assignment.
- [x] Update the enterprise FRD prompt so the cover-page sign-off table uses the full distribution list.
- [x] Support starting a new high-level requirement clarification cycle without resetting the overall workspace metadata.
- [x] Add tests and responsive verification for distribution-list management and repeat clarification cycles.

- [x] Remove duplicate identifier and legacy participant controls so document metadata is represented only by identifiers, revision history, and the repeatable distribution list.
- [x] Add focused tests for distribution-list updates and the new-requirement cycle preserving metadata.
- [x] Verify the refined metadata and distribution-list experience at a mobile viewport.

- [x] Render MANDATORY SECTION 1: COVER PAGE as a dedicated single page in the document preview.
- [x] Render the Distribution & Sign-off Table as a true table on its own dedicated single preview page.
- [x] Apply matching DOCX page breaks and table styling for the cover and distribution/sign-off pages.
- [x] Add automated checks and responsive verification for the revised preview pagination.

- [x] Strip duplicate cover and distribution/sign-off content from the remaining preview and DOCX body.
- [x] Add explicit DOCX sign-off table borders and header styling.
- [x] Add pagination helper tests and capture a mobile preview verification after the page-layout update.

- [x] Add automated coverage for preview-side dedicated-page stripping and DOCX cover/sign-off page assembly.

- [x] Make the lower-panel New requirement action append a requirement item without clearing previously analyzed or generated requirements.
- [x] Add a top-left Generate new Functional Requirement Document action that resets the workspace only after user intent is explicit.
- [x] Replace the single Use sample action with multiple selectable high-level requirement samples.
- [x] Add workflow tests and responsive verification for additive requirements, document reset, and sample selection.

- [x] Retain and display prior analyzed requirement items and clarification state when adding another requirement item.
- [x] Add direct tests for additive FRD composition, new-document reset behavior, and sample selection state.
- [x] Capture desktop and mobile verification for the additive requirement controls.

- [x] Add direct unit coverage for additive FRD composition, fresh-document reset state, sample selection, and retained-analysis behavior.

- [x] Extract and test the retained-analysis transition used when adding another requirement item.
