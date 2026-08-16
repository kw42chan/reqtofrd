import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./openrouter", () => ({
  DEFAULT_OPENROUTER_MODEL: "openai/gpt-4o-mini",
  OPENROUTER_CANDIDATE_MODELS: ["openai/gpt-4o-mini"],
  VERIFIED_OPENROUTER_MODELS: [],
  getOpenRouterDiagnostics: vi.fn(() => ({
    version: 1,
    requestLifecycle: [],
    modelHistory: [],
  })),
  invokeOpenRouter: vi.fn(),
  markOpenRouterMapped: vi.fn(),
}));

import { appRouter } from "./routers";
import { invokeOpenRouter, markOpenRouterMapped } from "./openrouter";

const ctx = {
  user: undefined,
  req: { protocol: "https", headers: {} },
  res: { clearCookie: vi.fn() },
} as any;
const input = {
  requirement:
    "The treasury platform needs dual approval for high-value payment release with gateway integration and audit history.",
  templateId: "enterprise-audit-frd",
  formattingProfile: "Banking/Treasury Standard",
  customGuidelines: "",
  documentTitle: "Payment Workflow Enhancement",
  metadata: {
    requestId: "REQ-0001",
    region: "Global",
    system: "Treasury",
    enhancementTitle: "Payment Workflow Enhancement",
    revisionVersion: "1.0",
    revisionDescription: "Initial draft",
    updatedBy: "Analyst",
    revisionDate: "13-AUG-26",
    revisionRemarks: "Draft",
  },
};
const response = (content: string) => ({
  content,
  model: "openai/gpt-4o-mini",
  requestId: "request-1",
  runId: "run-1",
  elapsedMs: 20,
});

describe("ReqToFRD procedures", () => {
  beforeEach(() => vi.clearAllMocks());

  it("parses a valid clarification response and records mapped success", async () => {
    vi.mocked(invokeOpenRouter).mockResolvedValueOnce(
      response(
        JSON.stringify({
          phase: "CLARIFICATION",
          gap_summary: "Two details remain unclear.",
          questions: [
            {
              id: "q1",
              category: "Business Logic",
              question: "What threshold applies?",
            },
            {
              id: "q2",
              category: "Integration",
              question: "Which gateway contract is authoritative?",
            },
            {
              id: "q3",
              category: "Scope Boundary",
              question: "Which payment types are excluded?",
            },
          ],
        })
      ) as any
    );
    const result = await appRouter.createCaller(ctx).reqToFrd.analyze(input);
    expect(result.questions).toHaveLength(3);
    expect(markOpenRouterMapped).toHaveBeenCalledWith(
      expect.anything(),
      "clarification",
      "json_object",
      expect.objectContaining({ storyCount: 3 })
    );
  });

  it("caps oversized model clarification output and canonicalizes q6 to the q1–q5 contract", async () => {
    const questions = [
      "Business Logic",
      "Integration",
      "Scope Boundary",
      "Exception Handling",
      "Business Logic",
      "Integration",
    ].map((category, index) => ({
      id: `q${index + 1}`,
      category,
      question: `Question ${index + 1}?`,
    }));
    vi.mocked(invokeOpenRouter).mockResolvedValueOnce(
      response(
        JSON.stringify({
          phase: "CLARIFICATION",
          gap_summary: "Gap.",
          questions,
        })
      ) as any
    );
    const result = await appRouter.createCaller(ctx).reqToFrd.analyze(input);
    expect(result.questions).toHaveLength(5);
    expect(result.questions.map(question => question.id)).toEqual([
      "q1",
      "q2",
      "q3",
      "q4",
      "q5",
    ]);
  });

  it("rejects malformed clarification JSON", async () => {
    vi.mocked(invokeOpenRouter).mockResolvedValueOnce(
      response("not-json") as any
    );
    await expect(
      appRouter.createCaller(ctx).reqToFrd.analyze(input)
    ).rejects.toThrow();
  });

  it("generates a markdown FRD from validated answers through the selected model", async () => {
    vi.mocked(invokeOpenRouter).mockResolvedValueOnce(
      response(
        "# Cover Page\n\n## Functional Requirements\n\n### FR-01\n\nInput Parameters & Trigger Conditions"
      ) as any
    );
    const result = await appRouter.createCaller(ctx).reqToFrd.generate({
      ...input,
      model: "openai/gpt-4o-mini",
      questions: [
        {
          id: "q1",
          category: "Business Logic",
          question: "What threshold applies?",
        },
        {
          id: "q2",
          category: "Integration",
          question: "Which gateway contract is authoritative?",
        },
        {
          id: "q3",
          category: "Scope Boundary",
          question: "Which payment types are excluded?",
        },
      ],
      answers: {
        q1: "100000",
        q2: "Core gateway v2",
        q3: "International payments",
      },
    });
    expect(result.markdown).toContain("FR-01");
    expect(invokeOpenRouter).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "openai/gpt-4o-mini",
        operation: "generation",
      })
    );
  });

  it("instructs appended requirement generation to remain in the existing session without document-control sections", async () => {
    vi.mocked(invokeOpenRouter).mockResolvedValueOnce(
      response(
        "## Functional Requirements\n\n### FR-02\n\nBody-only requirement"
      ) as any
    );
    await appRouter.createCaller(ctx).reqToFrd.generate({
      ...input,
      generationScope: "requirement-item",
      itemNumber: 2,
      questions: [
        {
          id: "q1",
          category: "Business Logic",
          question: "What threshold applies?",
        },
        {
          id: "q2",
          category: "Integration",
          question: "Which gateway contract is authoritative?",
        },
        {
          id: "q3",
          category: "Scope Boundary",
          question: "Which payment types are excluded?",
        },
      ],
      answers: {},
    });
    const call = vi.mocked(invokeOpenRouter).mock.calls[0]?.[0];
    expect(call?.messages[1]?.content).toContain(
      "Functional Requirement Item 2, appended to an existing FRD session"
    );
    expect(call?.messages[1]?.content).toContain(
      "Generate ONLY the Functional Requirement section for this new item"
    );
    expect(call?.messages[1]?.content).toContain(
      "Do NOT emit a Cover Page, Executive Summary, Revision History, Integration section, Out of Scope section"
    );
  });

  it("accepts a stale oversized generation payload by capping and reindexing it before prompt assembly", async () => {
    vi.mocked(invokeOpenRouter).mockResolvedValueOnce(
      response("# Functional Requirements\n\n### FR-01") as any
    );
    const questions = [
      "Business Logic",
      "Integration",
      "Scope Boundary",
      "Exception Handling",
      "Business Logic",
      "Integration",
    ].map((category, index) => ({
      id: `q${index + 1}`,
      category,
      question: `Question ${index + 1}?`,
    }));
    await expect(
      appRouter
        .createCaller(ctx)
        .reqToFrd.generate({ ...input, questions, answers: {} })
    ).resolves.toEqual(
      expect.objectContaining({ markdown: expect.stringContaining("FR-01") })
    );
    const call = vi.mocked(invokeOpenRouter).mock.calls[0]?.[0];
    expect(call?.messages[1]?.content).not.toContain("Question 6?");
  });

  it("exposes only a boolean API key status and never the raw credential", async () => {
    const models = await appRouter.createCaller(ctx).reqToFrd.models();
    expect(typeof models.apiKeyConfigured).toBe("boolean");
    expect(Object.keys(models)).not.toContain("apiKey");
    expect(JSON.stringify(models)).not.toContain(
      process.env.OPENROUTER_API_KEY ?? "definitely-not-present"
    );
  });

  it("routes a custom model slug and session key override without returning either value", async () => {
    vi.mocked(invokeOpenRouter).mockResolvedValueOnce(
      response(
        JSON.stringify({
          phase: "CLARIFICATION",
          gap_summary: "Gap.",
          questions: [
            { id: "q1", category: "Business Logic", question: "Rule?" },
            { id: "q2", category: "Integration", question: "API?" },
            { id: "q3", category: "Scope Boundary", question: "Scope?" },
          ],
        })
      ) as any
    );
    await appRouter
      .createCaller(ctx)
      .reqToFrd.analyze({
        ...input,
        model: "provider/custom-slug",
        openRouterApiKey: "session-only-key-1234567890",
      });
    expect(invokeOpenRouter).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "provider/custom-slug",
        apiKey: "session-only-key-1234567890",
      })
    );
  });

  it("surfaces the actionable timeout recovery message through clarification and generation mutations", async () => {
    const timeout = new Error(
      "OpenRouter generation timed out after a standard and concise retry. Your clarification answers are preserved; retry generation or choose a faster model."
    );
    vi.mocked(invokeOpenRouter)
      .mockRejectedValueOnce(timeout)
      .mockRejectedValueOnce(timeout);
    await expect(
      appRouter.createCaller(ctx).reqToFrd.analyze(input)
    ).rejects.toThrow("standard and concise retry");
    await expect(
      appRouter.createCaller(ctx).reqToFrd.generate({
        ...input,
        questions: [
          { id: "q1", category: "Business Logic", question: "Rule?" },
          { id: "q2", category: "Integration", question: "API?" },
          { id: "q3", category: "Scope Boundary", question: "Scope?" },
        ],
        answers: {},
      })
    ).rejects.toThrow("clarification answers are preserved");
  });
});
