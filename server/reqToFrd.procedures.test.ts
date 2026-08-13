import { beforeEach, describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import { invokeLLM } from "./_core/llm";

vi.mock("./_core/llm", () => ({ invokeLLM: vi.fn() }));

const ctx = {
  user: undefined,
  req: { protocol: "https", headers: {} },
  res: { clearCookie: vi.fn() },
} as any;

const input = {
  requirement: "The treasury platform needs dual approval for high-value payment release with gateway integration and audit history.",
  templateId: "enterprise-audit-frd",
  formattingProfile: "Banking/Treasury Standard",
  customGuidelines: "",
  documentTitle: "Payment Workflow Enhancement",
  metadata: {
    requestId: "REQ-0001", region: "Global", system: "Treasury", enhancementTitle: "Payment Workflow Enhancement",
    requestor: "Requestor of Business", departmentHead: "Department Head of Requestor of Business", itDepartment: "IT Department",
    revisionVersion: "1.0", revisionDescription: "Initial draft", updatedBy: "Analyst", revisionDate: "13-AUG-26", revisionRemarks: "Draft",
    signOffRoles: { requestor: "Reviewer" as const, departmentHead: "Approver" as const, itDepartment: "Informer" as const },
  },
};

describe("ReqToFRD procedures", () => {
  beforeEach(() => vi.clearAllMocks());

  it("parses a valid clarification response", async () => {
    vi.mocked(invokeLLM).mockResolvedValueOnce({ choices: [{ message: { content: JSON.stringify({ phase: "CLARIFICATION", gap_summary: "Two details remain unclear. Confirm them before generation.", questions: [
      { id: "q1", category: "Business Logic", question: "What threshold applies?" },
      { id: "q2", category: "Integration", question: "Which gateway contract is authoritative?" },
      { id: "q3", category: "Scope Boundary", question: "Which payment types are excluded?" },
    ] }) } }] } as any);
    const result = await appRouter.createCaller(ctx).reqToFrd.analyze(input);
    expect(result.questions).toHaveLength(3);
    expect(result.phase).toBe("CLARIFICATION");
  });

  it("rejects malformed clarification JSON", async () => {
    vi.mocked(invokeLLM).mockResolvedValueOnce({ choices: [{ message: { content: "not-json" } }] } as any);
    await expect(appRouter.createCaller(ctx).reqToFrd.analyze(input)).rejects.toThrow();
  });

  it("generates a markdown FRD from validated answers", async () => {
    vi.mocked(invokeLLM).mockResolvedValueOnce({ choices: [{ message: { content: "# Cover Page\n\n## Functional Requirements\n\n### FR-01\n\nInput Parameters & Trigger Conditions" } }] } as any);
    const result = await appRouter.createCaller(ctx).reqToFrd.generate({ ...input, questions: [
      { id: "q1", category: "Business Logic", question: "What threshold applies?" },
      { id: "q2", category: "Integration", question: "Which gateway contract is authoritative?" },
      { id: "q3", category: "Scope Boundary", question: "Which payment types are excluded?" },
    ], answers: { q1: "100000", q2: "Core gateway v2", q3: "International payments" } });
    expect(result.markdown).toContain("FR-01");
  });
});
