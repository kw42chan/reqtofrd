export type WorkflowStatus = "Idle" | "Clarifying" | "Generating" | "Completed";
export type QuestionCategory = "Business Logic" | "Integration" | "Scope Boundary" | "Exception Handling";
export type RoleType = "Reviewer" | "Approver" | "Informer";
export type DistributionDepartment = "Requestor of Business" | "Department Head" | "IT Department";

export interface DistributionListEntry {
  id: string;
  department: DistributionDepartment;
  name: string;
  title: string;
  roleType: RoleType;
}

export interface ClarifyingQuestion { id: string; category: QuestionCategory; question: string; }
export interface RetainedAnalysis { id: string; requirement: string; gapSummary: string; questions: ClarifyingQuestion[]; answers: Record<string, string>; }
export interface GeneratedRequirementItem { id: string; requirement: string; markdown: string; }
export interface DocumentMetadata {
  requestId: string;
  region: string;
  system: string;
  enhancementTitle: string;
  distributionList: DistributionListEntry[];
  revisionVersion: string;
  revisionDescription: string;
  updatedBy: string;
  revisionDate: string;
  revisionRemarks: string;
}
export interface AuditItem { label: string; passed: boolean; detail: string; }
export interface AuditReport { score: number; items: AuditItem[]; gaps: string[]; }

export const formattingProfiles = [
  { id: "ieee-830", label: "IEEE 830", description: "Formal specification and traceability." },
  { id: "agile-enterprise", label: "Agile Enterprise", description: "Outcome-led requirements and acceptance criteria." },
  { id: "banking-treasury", label: "Banking/Treasury Standard", description: "Controls for regulated financial workflows." },
  { id: "custom", label: "Custom", description: "Your formatting and governance guidance." },
] as const;

export const defaultMetadata: DocumentMetadata = {
  requestId: "REQ-0001",
  region: "Global",
  system: "Treasury Operations Platform",
  enhancementTitle: "Payment Workflow Enhancement",
  distributionList: [
    { id: "dist-requestor", department: "Requestor of Business", name: "", title: "Requestor of Business", roleType: "Reviewer" },
    { id: "dist-department-head", department: "Department Head", name: "", title: "Department Head of Requestor of Business", roleType: "Approver" },
    { id: "dist-it", department: "IT Department", name: "", title: "IT Department", roleType: "Informer" },
  ],
  revisionVersion: "1.0",
  revisionDescription: "Initial draft",
  updatedBy: "ReqToFRD Analyst",
  revisionDate: "13-AUG-26",
  revisionRemarks: "Generated from approved requirement input",
};

export const sampleRequirement = "The treasury operations team needs a controlled payment release workflow for high-value domestic transfers. Payments above a configurable threshold should require dual approval, integrate with the core banking gateway, prevent duplicate submissions, and provide an auditable status trail for operations, compliance, and finance.";

export const requirementSamples = [
  { label: "Treasury payments", value: sampleRequirement },
  { label: "Customer onboarding", value: "The retail banking team needs a digital customer onboarding flow that captures identity data, validates documents against approved sources, performs sanctions and PEP screening, routes high-risk cases to compliance, and records an immutable audit trail before an account can be activated." },
  { label: "Credit review", value: "The corporate lending team needs a credit review workflow that assembles financial statements, applies configurable risk-rating rules, assigns analysts, captures approval decisions, integrates with the credit data warehouse, and prevents facility activation before all required conditions are satisfied." },
  { label: "Exception management", value: "The operations team needs an exception-management workflow for failed settlement instructions. The solution must receive gateway errors, classify severity, assign ownership, support controlled manual repair, notify downstream systems of resolution, and provide compliance reporting with full timestamps and decision history." },
] as const;

export function normalizeMarkdown(markdown: string) { return markdown.replace(/\r/g, "").replace(/```(?:markdown)?\s*/gi, "").replace(/\s*```$/g, "").trim(); }
export function normalizeClarifyingQuestions(questions: Array<Pick<ClarifyingQuestion, "id" | "category" | "question">>): ClarifyingQuestion[] { return questions.slice(0, 5).map((question, index) => ({ ...question, id: `q${index + 1}` })); }
export function canGenerate(status: WorkflowStatus, questionCount: number) { return questionCount >= 3 && questionCount <= 5 && (status === "Clarifying" || status === "Completed"); }
export function addDistributionEntry(entries: DistributionListEntry[], id: string): DistributionListEntry[] { return [...entries, { id, department: "Requestor of Business", name: "", title: "", roleType: "Reviewer" }]; }
export function updateDistributionEntry(entries: DistributionListEntry[], id: string, key: keyof DistributionListEntry, value: string): DistributionListEntry[] { return entries.map(entry => entry.id === id ? { ...entry, [key]: value } as DistributionListEntry : entry); }
export function beginNewRequirementCycle(metadata: DocumentMetadata) { return { metadata, requirement: "", questions: [] as ClarifyingQuestion[], answers: {} as Record<string, string>, markdown: "" }; }
export function retainAnalysis(current: RetainedAnalysis[], next: RetainedAnalysis): RetainedAnalysis[] { return next.requirement.trim() && next.questions.length ? [...current, next] : current; }
export function composeRequirementMarkdown(previousMarkdown: string, nextMarkdown: string, itemNumber: number) { return previousMarkdown ? `${previousMarkdown}\n\n---\n\n# Functional Requirement Item ${itemNumber}\n\n${nextMarkdown}` : nextMarkdown; }
export function composeRequirementDocument(items: GeneratedRequirementItem[], fallbackMarkdown = "") { return items.reduce((document, item, index) => composeRequirementMarkdown(document, item.markdown, index + 1), fallbackMarkdown && !items.length ? fallbackMarkdown : ""); }
export function updateGeneratedRequirementItem(items: GeneratedRequirementItem[], id: string, markdown: string): GeneratedRequirementItem[] { return items.map(item => item.id === id ? { ...item, markdown } : item); }
export function createFreshDocumentState() { return { title: "Untitled FRD", metadata: defaultMetadata, requirement: "", questions: [] as ClarifyingQuestion[], answers: {} as Record<string, string>, markdown: "# Functional Requirement Document\n\nThe remaining FRD sections will appear after generation." }; }
export function selectRequirementSample(label: string) { return requirementSamples.find(sample => sample.label === label)?.value ?? ""; }
export function sanitizeFilename(title: string) { const safe = title.trim().replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80); return `${safe || "req-to-frd"}.docx`; }
export function auditMarkdown(markdown: string, metadata: DocumentMetadata): AuditReport {
  const text = markdown.toLowerCase();
  const checks: Array<[string, boolean, string]> = [
    ["Cover page", /cover page|request id|demand id/.test(text), "Includes document control."],
    ["Revision history", /revision history/.test(text) && /version number/.test(text), "Includes version tracking."],
    ["Executive summary & scope", /executive summary/.test(text) && /scope boundary/.test(text), "Defines boundaries."],
    ["FR-01 identifiers", /fr-0?1/.test(text), "Uses required FR numbering."],
    ["Required FR subsections", /input parameters|trigger conditions/.test(text) && /processing logic|validation rules/.test(text) && /exception/.test(text), "Covers inputs, processing, outputs, exceptions."],
    ["Integration interfaces", /integration/.test(text) && /api|batch|protocol|payload/.test(text), "Describes interfaces."],
    ["Failure and retry handling", /retry|failure handling|reprocess/.test(text), "Addresses recovery."],
    ["Out of scope", /out of scope/.test(text), "Lists exclusions."],
    ["DD-MMM-YY revision date", /^\d{2}-[A-Z]{3}-\d{2}$/i.test(metadata.revisionDate), "Uses controlled date format."],
    ["Distribution list", metadata.distributionList.length >= 3 && metadata.distributionList.every(entry => ["Reviewer", "Approver", "Informer"].includes(entry.roleType)), "Includes controlled participants and roles."],
  ];
  const items = checks.map(([label, passed, detail]) => ({ label, passed, detail }));
  return { score: Math.round(items.filter(item => item.passed).length / items.length * 100), items, gaps: items.filter(item => !item.passed).map(item => `Add or verify ${item.label.toLowerCase()}.`) };
}
