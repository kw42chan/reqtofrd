export type WorkflowStatus = "Idle" | "Clarifying" | "Generating" | "Completed";
export type QuestionCategory = "Business Logic" | "Integration" | "Scope Boundary" | "Exception Handling";
export type RoleType = "Reviewer" | "Approver" | "Informer";

export interface ClarifyingQuestion {
  id: string;
  category: QuestionCategory;
  question: string;
}

export interface DocumentMetadata {
  requestId: string;
  region: string;
  system: string;
  enhancementTitle: string;
  requestor: string;
  departmentHead: string;
  itDepartment: string;
  revisionVersion: string;
  revisionDescription: string;
  updatedBy: string;
  revisionDate: string;
  revisionRemarks: string;
  signOffRoles: { requestor: RoleType; departmentHead: RoleType; itDepartment: RoleType };
}

export interface AuditItem { label: string; passed: boolean; detail: string }
export interface AuditReport { score: number; items: AuditItem[]; gaps: string[] }

export const formattingProfiles = [
  { id: "ieee-830", label: "IEEE 830", description: "Classic requirements specification with formal traceability." },
  { id: "agile-enterprise", label: "Agile Enterprise", description: "Outcome-led requirements with acceptance criteria and delivery increments." },
  { id: "banking-treasury", label: "Banking/Treasury Standard", description: "Control-minded language for regulated financial workflows." },
  { id: "custom", label: "Custom", description: "Apply your own formatting and alignment rules." },
] as const;

export const defaultMetadata: DocumentMetadata = {
  requestId: "REQ-0001", region: "Global", system: "Treasury Operations Platform", enhancementTitle: "Payment Workflow Enhancement",
  requestor: "Requestor of Business", departmentHead: "Department Head of Requestor of Business", itDepartment: "IT Department",
  revisionVersion: "1.0", revisionDescription: "Initial draft", updatedBy: "ReqToFRD Analyst", revisionDate: "13-AUG-26", revisionRemarks: "Generated from approved requirement input",
  signOffRoles: { requestor: "Reviewer", departmentHead: "Approver", itDepartment: "Informer" },
};

export const sampleRequirement = `The treasury operations team needs a controlled payment release workflow for high-value domestic transfers. Payments above a configurable threshold should require dual approval, integrate with the core banking gateway, prevent duplicate submissions, and provide an auditable status trail for operations, compliance, and finance.`;

export function sanitizeFilename(title: string) {
  const safe = title.trim().replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
  return `${safe || "req-to-frd"}.docx`;
}

export function auditMarkdown(markdown: string, metadata: DocumentMetadata): AuditReport {
  const text = markdown.toLowerCase();
  const checks: Array<[string, boolean, string]> = [
    ["Cover page", /cover page|request id|demand id/.test(text), "Includes document-control metadata."],
    ["Revision history", /revision history/.test(text) && /version number/.test(text), "Includes versioning and revision tracking."],
    ["Executive summary & scope", /executive summary/.test(text) && /scope boundary/.test(text), "Defines background and boundaries."],
    ["FR-01 identifiers", /fr-0?1/.test(text), "Uses the required FR-01 numbering pattern."],
    ["Required FR subsections", /input parameters|trigger conditions/.test(text) && /processing logic|validation rules/.test(text) && /exception/.test(text), "Covers inputs, processing, outputs, and exceptions."],
    ["Integration interfaces", /integration/.test(text) && /api|batch|protocol|payload/.test(text), "Describes interface boundaries and formats."],
    ["Failure and retry handling", /retry|failure handling|reprocess/.test(text), "Addresses integration failure recovery."],
    ["Out of scope", /out of scope/.test(text), "Explicitly lists excluded capabilities."],
    ["DD-MMM-YY revision date", /^\d{2}-[A-Z]{3}-\d{2}$/i.test(metadata.revisionDate), "Revision date uses the required format."],
    ["Valid sign-off roles", [metadata.signOffRoles.requestor, metadata.signOffRoles.departmentHead, metadata.signOffRoles.itDepartment].every(role => ["Reviewer", "Approver", "Informer"].includes(role)), "Uses the controlled role vocabulary."],
  ];
  const items = checks.map(([label, passed, detail]) => ({ label, passed, detail }));
  const gaps = items.filter(item => !item.passed).map(item => `Add or verify ${item.label.toLowerCase()}.`);
  return { score: Math.round((items.filter(item => item.passed).length / items.length) * 100), items, gaps };
}
