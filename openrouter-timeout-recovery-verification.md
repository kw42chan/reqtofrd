# OpenRouter Timeout Recovery Verification

The reported client mutation error was confirmed in browser-console logs at 02:49:36, following a two-attempt OpenRouter generation timeout. The revised generation client now uses a 38-second standard request with an 1,800-token budget, then one concise 1,200-token retry that preserves the selected model, original requirement, and clarification answers while requesting throughput-prioritized provider routing.

After the update, a fresh live treasury payment-control requirement successfully completed the clarification stage. The next step is to submit its answers to verify the revised generation path and rendered FRD output.

All five post-fix clarifying answers were supplied, and the fresh FRD generation request was submitted using the configured server-side OpenRouter key. The request is now being observed for completion or its bounded concise-retry outcome.

The post-fix request reached **Completed** and rendered Functional Requirement Item 1 in the preview, including `FR-01: High-Value Payment Threshold Evaluation` and the configured dual-control, idempotency, integration, retry, and immutable-audit requirements. This confirms the revised generation route returned usable content rather than the reported client timeout error.

The remaining verification is a controlled browser-side mutation failure, implemented at the request-routing boundary so it does not send another provider request. It will confirm the concise-retry message is surfaced while the clarification answers remain available for retry.

The development-only timeout-recovery fixture verified the persistent browser alert. It displays the exact **standard and concise retry** recovery message, states that the requirement, selected model, questions, and answers remain available, and provides a visible **Retry generation** action. The completed clarification fields remain populated in the same workspace.

After clearing the fixture notice, a route-level controlled generation failure was triggered through the actual client mutation handler. The resulting live browser alert displayed the same exact recovery message and confirmed that the requirement, selected model, questions, and answers were still available. This proves the persistent alert is produced by the failed-state handler rather than only by fixture initialization.
