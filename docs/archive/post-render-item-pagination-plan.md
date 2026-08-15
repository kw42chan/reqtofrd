# Plan: Keep Edited Requirement Items Within the Existing FRD Session

## Goal

Refine the post-render Functional Requirement Item workflow so that saving an edited item updates its content **within the existing FRD session**. The document-level **Cover Page** and **Distribution & Sign-off Table** must remain single, metadata-driven surfaces at the start of the overall FRD and must never be repeated inside an edited or appended requirement item.

> **Interpretation used for implementation:** The request preserves the existing document’s one Cover Page and one Distribution & Sign-off Table. It prevents those document-control sections from appearing again in any Functional Requirement Item page after an item is generated, appended, or edited.

## Current-State Findings

| Area                                                             | Current behavior                                                                                                                               | Risk to address                                                                                                                                         |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PagedPreview` in `client/src/pages/Home.tsx`                    | Always renders one dedicated Cover Page and one dedicated Distribution & Sign-off page, then renders pages returned by the markdown paginator. | The preview structure is correct at document level, but item Markdown may still carry model-generated document-control sections into its own body.      |
| `composeRequirementDocument()` in `client/src/lib/reqToFrd.ts`   | Concatenates completed item Markdown; subsequent items receive a `# Functional Requirement Item N` boundary.                                   | It does not establish a document-level versus item-level content contract.                                                                              |
| `stripDedicatedPages()` in `client/src/lib/previewPagination.ts` | Performs line-by-line removal based on loose heading text.                                                                                     | It can be fragile when model heading levels, labels, or formatting vary, and it is applied only at preview time rather than at item normalization time. |
| FRD generation prompt in `server/routers.ts`                     | Requests the full six-section FRD for every generation.                                                                                        | Later requirement cycles can receive another model-generated cover/sign-off block despite the UI already owning those pages.                            |

## Implementation Steps

### 1. Define a robust document-control stripping contract

Create or extend a shared pure Markdown helper that removes only the document-level content from an item: **Mandatory Section 1 / Cover Page** and the **Distribution & Sign-off Table**, including their associated table rows and metadata. It will recognize the documented enterprise labels and common heading-level variations while stopping precisely at the next substantive section.

The helper will be idempotent. Re-running it on already-clean item content must not remove Functional Requirements, Integration, Revision History, Executive Summary, or Out-of-Scope content. It will be reused by preview and DOCX assembly so those outputs cannot diverge.

### 2. Normalize generated and saved item Markdown before composition

Apply the shared document-control stripping function at all item boundaries:

| Boundary                      | Planned behavior                                                                                                                              |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Initial generation result     | Store only body-level content in the first `GeneratedRequirementItem`; document controls remain supplied by `PagedPreview` metadata.          |
| Additional requirement result | Store only body-level, appended-item content before inserting the item into `requirementItems`.                                               |
| Post-render Save to FRD       | Strip accidental pasted/generated cover or distribution content from `itemDraft` before `updateGeneratedRequirementItem()` and recomposition. |
| Existing composition          | Compose clean item Markdown under stable `Functional Requirement Item N` boundaries, leaving the existing session ordering intact.            |

This ensures a user may paste or retain model output containing document-control sections without creating duplicate document surfaces.

### 3. Make generation aware of document versus appended-item scope

Extend the generation input with an explicit, typed scope such as `document` versus `requirement-item`, plus the existing item count/next item ordinal when relevant. The client will select the appropriate scope from `requirementItems.length`.

For an additional requirement item, the server prompt will instruct the model to generate only the requirement-session body that belongs below the current document, with continued FR numbering and no Cover Page or Distribution & Sign-off Table. The original/new-document flow will retain the enterprise body requirements, while the app continues to render its authoritative document-control pages once from metadata.

The implementation will avoid sending API keys, generated Markdown, or unnecessary prior document content beyond what is required for numbering/context. Existing OpenRouter timeout, retry, and redaction behavior will remain unchanged.

### 4. Preserve a single document-level preview hierarchy

Keep `PagedPreview`’s dedicated Cover Page and Distribution & Sign-off Table as the only document-control page surfaces. Update the page splitter to accept already-clean item content and ensure that appended/edit pages render after the existing requirement session rather than causing a new document shell.

The functional page labels and visual separators will remain stable, preserving readability on desktop and mobile. No database or schema changes are expected because this is an in-memory UI/workflow composition refinement.

### 5. Align DOCX export with the rendered preview

Use the same shared stripping contract in `exportDocx.ts` before body block conversion. The exported Word file will retain one dedicated cover page and one sign-off table page, followed by all clean, composed Functional Requirement Item pages.

### 6. Add targeted regression coverage

Add pure helper and workflow regression tests covering the following cases:

| Scenario                                                                                       | Expected assertion                                                                                                                                 |
| ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Full model-style item Markdown includes `MANDATORY SECTION 1: COVER PAGE` and a sign-off table | The stored/composed item body excludes both document-control sections and preserves subsequent Functional Requirements.                            |
| Edited Markdown includes an accidentally pasted Cover Page/sign-off block                      | Save normalization removes the duplicate blocks while retaining the edited requirement language.                                                   |
| Multiple retained items                                                                        | Item 2 renders after Item 1 within the same composed body; neither item contains Cover Page or Distribution & Sign-off content.                    |
| Preview pagination                                                                             | The page splitter returns only functional/body pages; the document shell remains exactly one cover and one sign-off page.                          |
| DOCX assembly                                                                                  | Dedicated document-control blocks occur once, with no duplicate cover/sign-off headings in the body.                                               |
| Procedure prompt scope                                                                         | An appended-item generation request contains the body-only/no-document-controls instruction and preserves the current request contract safeguards. |

### 7. Verify end-to-end and checkpoint

Run TypeScript checks and the full Vitest suite. Then conduct browser-level verification using a multi-item fixture and a real edit/save interaction:

1. Open an existing completed Functional Requirement Item.
2. Edit its Markdown, including a deliberate pasted Cover Page/Distribution block as a defensive test.
3. Save to FRD.
4. Confirm the revised requirement appears under the existing requirement session.
5. Confirm the overall preview and Word-export composition show exactly one cover and one Distribution & Sign-off page, with no duplicate controls in the edited item.
6. Review the same composition at a mobile viewport, update the TODO ledger, and save a checkpoint only after all regressions pass.

## Files Expected to Change

| File                                                                    | Planned change                                                                                                              |
| ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `client/src/lib/previewPagination.ts` or a small adjacent shared helper | Replace/strengthen dedicated-page stripping with reusable, idempotent document-control normalization.                       |
| `client/src/lib/reqToFrd.ts`                                            | Normalize item Markdown during document/item composition where appropriate.                                                 |
| `client/src/pages/Home.tsx`                                             | Apply clean-item handling on generation and item save; pass explicit generation scope/ordinal.                              |
| `server/routers.ts`                                                     | Validate generation scope and add the body-only instructions for appended requirements.                                     |
| `client/src/lib/exportDocx.ts`                                          | Reuse the shared clean-body behavior before Word body assembly.                                                             |
| `server/reqToFrd.test.ts` and `server/reqToFrd.procedures.test.ts`      | Add coverage for duplicate-control stripping, edited item recomposition, append scope, preview pagination, and DOCX parity. |
| `todo.md`                                                               | Add, complete, and record verification tasks during implementation.                                                         |

## Assumptions and Risks

The plan assumes that the two document-control pages should remain visible once per FRD, rather than being removed from the entire document preview. If the intended behavior is instead to hide those pages entirely after the first item, the preview contract will be adjusted before implementation.

Model-generated Markdown can vary in heading wording and depth. The stripping helper will therefore be tested against canonical enterprise headings and controlled variants, while deliberately preserving non-control business sections. The change will be designed as a pure, testable transformation so future template revisions do not silently introduce duplicate document-control content.
