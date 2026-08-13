import { describe, expect, it } from "vitest";
import { addDistributionEntry, auditMarkdown, beginNewRequirementCycle, defaultMetadata, sanitizeFilename, updateDistributionEntry } from "../client/src/lib/reqToFrd";

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
    const report = auditMarkdown("# Draft\n## Functional Requirements", { ...defaultMetadata, revisionDate: "2026-08-13" });
    expect(report.score).toBeLessThan(60);
    expect(report.gaps).toContain("Add or verify revision history.");
    expect(report.gaps).toContain("Add or verify dd-mmm-yy revision date.");
  });
});

import { dedicatedDocumentBlocks, markdownBlocks, stripDedicatedMarkdown } from "../client/src/lib/exportDocx";
import { stripDedicatedPages } from "../client/src/lib/previewPagination";
import { ENTERPRISE_AUDIT_FRD_TEMPLATE, ENTERPRISE_AUDIT_FRD_TEMPLATE_VERSION, REQUIRED_QUESTION_CATEGORIES } from "../lib/req-to-frd/templates/enterprise-audit-frd";

describe("ReqToFRD enterprise template contracts", () => {
  it("keeps the template versioned and question categories exact", () => {
    expect(ENTERPRISE_AUDIT_FRD_TEMPLATE_VERSION).toBe("1.0.0");
    expect(REQUIRED_QUESTION_CATEGORIES).toEqual(["Business Logic", "Integration", "Scope Boundary", "Exception Handling"]);
  });

  it("parses common markdown blocks for DOCX conversion", () => {
    const blocks = markdownBlocks("# Title\n\n**bold**\n\n- item\n\n| A | B |\n| --- | --- |\n| 1 | 2 |");
    expect(blocks.length).toBe(4);
  });
});

import { canGenerate, normalizeMarkdown } from "../client/src/lib/reqToFrd";

describe("ReqToFRD workflow helpers", () => {
  it("allows generation only after a valid clarification set", () => {
    expect(canGenerate("Clarifying", 3)).toBe(true);
    expect(canGenerate("Idle", 3)).toBe(false);
    expect(canGenerate("Clarifying", 2)).toBe(false);
  });

  it("normalizes fenced markdown returned by a model", () => {
    expect(normalizeMarkdown("```markdown\n# FRD\n```\n")).toBe("# FRD");
  });
});

import { appRouter } from "./routers";

describe("ReqToFRD procedure contract", () => {
  it("registers both workflow procedures", () => {
    expect(appRouter.reqToFrd.analyze).toBeDefined();
    expect(appRouter.reqToFrd.generate).toBeDefined();
  });
});

describe("ReqToFRD distribution list", () => {
  it("starts with one controlled participant for each mandatory department", () => {
    expect(defaultMetadata.distributionList.map(entry => entry.department)).toEqual(["Requestor of Business", "Department Head", "IT Department"]);
    expect(defaultMetadata.distributionList.map(entry => entry.roleType)).toEqual(["Reviewer", "Approver", "Informer"]);
  });

  it("requires the generated cover-page table to include every supplied distribution participant", () => {
    expect(ENTERPRISE_AUDIT_FRD_TEMPLATE).toContain("Include every supplied Distribution List entry in this table.");
  });

  it("adds and updates repeatable distribution-list participants", () => {
    const added = addDistributionEntry(defaultMetadata.distributionList, "dist-extra");
    const updated = updateDistributionEntry(added, "dist-extra", "roleType", "Approver");
    expect(updated).toHaveLength(4);
    expect(updated[3]).toMatchObject({ id: "dist-extra", department: "Requestor of Business", roleType: "Approver" });
  });

  it("starts a new requirement cycle without replacing metadata", () => {
    const cycle = beginNewRequirementCycle(defaultMetadata);
    expect(cycle.metadata).toBe(defaultMetadata);
    expect(cycle.requirement).toBe("");
    expect(cycle.questions).toEqual([]);
  });
});

describe("ReqToFRD dedicated-page pagination", () => {
  it("removes generated cover and sign-off content from the DOCX body", () => {
    const markdown = "# Cover Page\nmetadata\n# Distribution & Sign-off Table\n| Name | Role |\n| --- | --- |\n| A | Reviewer |\n# Revision History\nVersion Number";
    expect(stripDedicatedMarkdown(markdown)).toBe("# Revision History\nVersion Number");
  });

  it("removes generated cover and sign-off content from the preview body", () => {
    const markdown = "# Cover Page\nmetadata\n# Distribution & Sign-off Table\nrows\n# Revision History\nVersion Number";
    expect(stripDedicatedPages(markdown)).toBe("# Revision History\nVersion Number");
  });

  it("assembles dedicated cover and sign-off blocks before the FRD body", () => {
    const blocks = dedicatedDocumentBlocks("Payments", defaultMetadata);
    expect(blocks.length).toBeGreaterThan(6);
  });
});
