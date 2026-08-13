import { describe, expect, it } from "vitest";
import { auditMarkdown, defaultMetadata, sanitizeFilename } from "./reqToFrd";

describe("ReqToFRD audit helpers", () => {
  it("sanitizes document titles into safe docx filenames", () => {
    expect(sanitizeFilename("Region / Treasury: High-Value Payments")).toBe("Region-Treasury-High-Value-Payments.docx");
    expect(sanitizeFilename("***")).toBe("req-to-frd.docx");
  });

  it("recognizes an audit-compliant document structure", () => {
    const markdown = `# Cover Page\nRequest ID\n## Revision History\nVersion Number\n## Executive Summary & Scope Boundary\n## Functional Requirements\n### FR-01\nInput Parameters & Trigger Conditions\nProcessing Logic & Validation Rules\nOutput / System Response\nException & Error Handling\n## Integration\nAPI payload and retry failure handling\n## Out of Scope`;
    const report = auditMarkdown(markdown, defaultMetadata);
    expect(report.score).toBe(100);
    expect(report.gaps).toHaveLength(0);
  });

  it("flags missing mandatory controls", () => {
    const report = auditMarkdown("# Draft\n## Functional Requirements", { ...defaultMetadata, revisionDate: "2026-08-13", signOffRoles: { requestor: "Reviewer", departmentHead: "Approver", itDepartment: "Informer" } });
    expect(report.score).toBeLessThan(60);
    expect(report.gaps).toContain("Add or verify revision history.");
    expect(report.gaps).toContain("Add or verify dd-mmm-yy revision date.");
  });
});
