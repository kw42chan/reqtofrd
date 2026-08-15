# OpenRouter Generation and Rendering Verification

The live ReqToFRD workspace displayed a **Configured** masked project-key status. A representative treasury payment-control requirement was submitted through **Analyze & Clarify** without entering a session override. The workflow reached the **Clarifying** state and displayed the generated clarification queue, confirming that the server-side OpenRouter route returned mapped clarification content without exposing an API key in the interface.

The next verification step is to answer the generated questions, submit **Generate FRD**, and confirm the mapped Markdown is rendered in the document preview.

All five live clarification answers were completed and **Generate FRD** was submitted. The live workspace entered the **Generating** state, with the configured project-key indicator still masked and marked **Configured**. No session override was entered.

The live workflow reached **Completed**. The returned body rendered as Functional Requirement Item 1 in the Rendered Preview, including `FR-01: Configurable Payment Threshold Management` and the requested high-value payment controls. The expanded Model Lab reported redacted lifecycle activity with **4 mapped successes**, providing the required `response_mapped` evidence for the live server-key clarification and generation flow. Credentials remained masked in the interface and were absent from the displayed diagnostics.
