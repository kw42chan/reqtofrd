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

- [x] Configure a secure server-side OpenRouter API key and OpenRouter-compatible generation client.
- [x] Add redacted OpenRouter request lifecycle diagnostics and bounded per-model history.
- [x] Add model selection controls with a protected verified-model registry and safe test candidates.
- [x] Run a model probe and a representative mapped clarification/generation request after credentials are supplied.
- [x] Add unit coverage, desktop/mobile verification, and a checkpoint for the OpenRouter integration.

- [x] Probe `deepseek/deepseek-v4-pro-0813`, validate a mapped clarification response and a representative FRD generation response, and promote it only on success.

- [x] Save the validated OpenRouter integration checkpoint after the 27-test suite and responsive Model Lab verification.

- [x] Show a masked configured-key status and secure key update affordance on the front-page Model Lab without exposing the existing secret.
- [x] Add a front-page custom OpenRouter model-slug field and model selection control for generation.
- [x] Add validation, tests, responsive verification, and a checkpoint for the secure configuration UX.

- [x] Add a front-page session-only masked API key override that is sent only with generation requests and never returned, logged, or persisted by the app.
- [x] Add targeted tests for API key status exposure, key-override routing, and custom model-slug selection.
- [x] Re-verify and checkpoint the completed secure configuration UX.

- [x] Add targeted tests proving the models endpoint returns only boolean key status and custom model slugs are accepted for front-page configuration.
- [x] Save the post-change secure configuration checkpoint after the targeted tests pass.

- [x] Inspect and correct distorted Functional Requirement Item preview layout and Markdown rendering.
- [x] Add rendering regression coverage and verify the corrected document at desktop and mobile viewports.

- [x] Capture and review the corrected Functional Requirement Item preview at a mobile viewport.

- [x] Review and record mobile Functional Requirement Item readability, spacing, wrapping, and distortion outcome: dedicated item page is readable with stable wrapping and no visible distortion.

- [x] Normalize LLM clarification output to exactly 3–5 questions with canonical q1–q5 identifiers before schema validation and generation.
- [x] Guard the client generation payload against stale or oversized clarification lists.
- [x] Add regression tests for malformed/oversized model questions and verify the fixed workflow.

- [x] Merge generated retained requirement items into the composed FRD Markdown and Rendered Preview.
- [x] Add retained-item assembly regression tests and verify the combined document preview.

- [x] Verify the combined Rendered Preview after multiple completed requirement items are assembled through the focused composed-document and page-splitter regression assertion.

- [x] Add a development-only multi-item preview fixture and capture the live Rendered Preview showing all completed requirement items together.

- [x] Inspect and correct OpenRouter generation timeout configuration and abort handling.
- [x] Add bounded retry behavior and actionable timeout recovery messaging for clarification and FRD generation.
- [x] Add timeout regression tests, verify the workflow, and checkpoint the resilience fix.

- [x] Add procedure-level verification that OpenRouter timeout recovery errors surface clearly through both clarification and generation mutations.
- [x] Save the verified timeout-resilience checkpoint.

- [x] Add per-item editing controls for completed functional requirements after render.
- [x] Recompose the FRD preview, audit, copy, and DOCX output immediately after an item edit is saved.
- [x] Add post-render editing regression tests, live preview verification, and a checkpoint.

- [x] Perform and record a live Functional Requirement Item edit, save it, and confirm the rendered FRD refreshes with the revised content.

- [x] Perform browser-level Edit item → Save to FRD verification and confirm the rendered combined FRD updates with the edited text.
- [x] Save the verified post-render editing checkpoint.

- [x] Normalize generated and edited Functional Requirement Item Markdown so Cover Page and Distribution & Sign-off content never repeats within an item.
- [x] Generate appended requirement items in body-only mode under the existing FRD session, without document-control sections.
- [x] Reuse normalized item-body content for rendered preview and DOCX export, preserving one document-level cover and sign-off page.
- [x] Add regression tests and browser verification for duplicate-control stripping in saved and appended requirement items.
- [x] Perform browser-level verification that an appended requirement item remains body-only under the existing FRD session with no duplicate cover or sign-off content.
- [x] Save and deliver the verified single-document rendering checkpoint.

- [x] Verify configured and session-only OpenRouter API keys are used only for authorized server-side OpenRouter probe, clarification, and FRD generation requests, and never exposed in diagnostics or client responses.
- [x] Confirm generated OpenRouter Markdown is normalized, stored, and rendered into the FRD preview without credential exposure.
- [x] Add or update regression coverage and perform a live key-backed generation-and-rendering verification.
- [x] Save and deliver the verified OpenRouter generation/rendering checkpoint.

- [x] Inspect the live OpenRouter timeout diagnostics and generation request budget for the reported two-attempt timeout.
- [x] Implement a bounded recovery path that preserves the selected model and user requirement while avoiding repeated long generation timeouts.
- [x] Add regression coverage and browser verification for timeout recovery and actionable in-product status.
- [x] Perform a controlled browser timeout simulation to confirm the concise-retry message is shown and clarification state remains recoverable.
- [x] Display a persistent, retryable generation-recovery notice that preserves the actionable timeout guidance after a request failure.
- [x] Repeat the controlled generation-timeout simulation after the persistent notice update and verify the real failed state shows the recovery alert with preserved answers.
- [ ] Save and deliver the verified OpenRouter timeout recovery checkpoint.
