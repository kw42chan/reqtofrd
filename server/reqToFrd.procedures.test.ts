import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./openrouter", () => ({
  DEFAULT_OPENROUTER_MODEL: "openai/gpt-4o-mini",
  OPENROUTER_CANDIDATE_MODELS: ["openai/gpt-4o-mini"],
  VERIFIED_OPENROUTER_MODELS: [],
  getOpenRouterDiagnostics: vi.fn(() => ({ version: 1, requestLifecycle: [], modelHistory: [] })),
  invokeOpenRouter: vi.fn(),
  markOpenRouterMapped: vi.fn(),
}));

import { appRouter } from "./routers";
import { invokeOpenRouter, markOpenRouterMapped } from "./openrouter";

const ctx = { user: undefined, req: { protocol: "https", headers: {} }, res: { clearCookie: vi.fn() } } as any;
const input = {
  requirement: "The treasury platform needs dual approval for high-value payment release with gateway integration and audit history.",
  templateId: "enterprise-audit-frd", formattingProfile: "Banking/Treasury Standard", customGuidelines: "", documentTitle: "Payment Workflow Enhancement",
  metadata: { requestId: "REQ-0001", region: "Global", system: "Treasury", enhancementTitle: "Payment Workflow Enhancement", revisionVersion: "1.0", revisionDescription: "Initial draft", updatedBy: "Analyst", revisionDate: "13-AUG-26", revisionRemarks: "Draft" },
};
const response = (content: string) => ({ content, model: "openai/gpt-4o-mini", requestId: "request-1", runId: "run-1", elapsedMs: 20 });

describe("ReqToFRD procedures", () => {
  beforeEach(() => vi.clearAllMocks());

  it("parses a valid clarification response and records mapped success", async () => {
    vi.mocked(invokeOpenRouter).mockResolvedValueOnce(response(JSON.stringify({ phase: "CLARIFICATION", gap_summary: "Two details remain unclear.", questions: [
      { id: "q1", category: "Business Logic", question: "What threshold applies?" },
      { id: "q2", category: "Integration", question: "Which gateway contract is authoritative?" },
      { id: "q3", category: "Scope Boundary", question: "Which payment types are excluded?" },
    ] })) as any);
    const result = await appRouter.createCaller(ctx).reqToFrd.analyze(input);
    expect(result.questions).toHaveLength(3);
    expect(markOpenRouterMapped).toHaveBeenCalledWith(expect.anything(), "clarification", "json_object", expect.objectContaining({ storyCount: 3 }));
  });

  it("rejects malformed clarification JSON", async () => {
    vi.mocked(invokeOpenRouter).mockResolvedValueOnce(response("not-json") as any);
    await expect(appRouter.createCaller(ctx).reqToFrd.analyze(input)).rejects.toThrow();
  });

  it("generates a markdown FRD from validated answers through the selected model", async () => {
    vi.mocked(invokeOpenRouter).mockResolvedValueOnce(response("# Cover Page\n\n## Functional Requirements\n\n### FR-01\n\nInput Parameters & Trigger Conditions") as any);
    const result = await appRouter.createCaller(ctx).reqToFrd.generate({ ...input, model: "openai/gpt-4o-mini", questions: [
      { id: "q1", category: "Business Logic", question: "What threshold applies?" },
      { id: "q2", category: "Integration", question: "Which gateway contract is authoritative?" },
      { id: "q3", category: "Scope Boundary", question: "Which payment types are excluded?" },
    ], answers: { q1: "100000", q2: "Core gateway v2", q3: "International payments" } });
    expect(result.markdown).toContain("FR-01");
    expect(invokeOpenRouter).toHaveBeenCalledWith(expect.objectContaining({ model: "openai/gpt-4o-mini", operation: "generation" }));
  });
});
