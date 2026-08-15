# Single-Document Rendering Verification

The live multi-item FRD fixture was opened in a browser and the first completed Functional Requirement Item was edited with a deliberately pasted `MANDATORY SECTION 1: COVER PAGE` block and a `Distribution & Sign-off Table` containing a synthetic participant. After selecting **Save to FRD**, the revised requirement text appeared in both the completed-item card and the combined Rendered Preview.

The pasted participant name `Duplicate Reviewer` was absent from the resulting item and rendered FRD. The browser found exactly one `Distribution & Sign-off Table`, which was the dedicated metadata-driven page at the beginning of the document. The view was also captured at a 375px mobile viewport for readability review.

The development-only generated-append fixture was also opened with a raw model-style payload containing a duplicate Cover Page and sign-off participant. Its `FR-02 Gateway recovery` content rendered as Functional Requirement Item 2 within the existing session, while the synthetic `Generated Duplicate` participant was absent. The browser again found exactly one `Distribution & Sign-off Table`, the single metadata-driven document-control page.
