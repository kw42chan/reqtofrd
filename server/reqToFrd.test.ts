import { describe, expect, it } from "vitest";
import { auditMarkdown, defaultMetadata, sanitizeFilename } from "../client/src/lib/reqToFrd";

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

import { markdownBlocks } from "../client/src/lib/exportDocx";
import { ENTERPRISE_AUDIT_FRD_TEMPLATE_VERSION, REQUIRED_QUESTION_CATEGORIES } from "../lib/req-to-frd/templates/enterprise-audit-frd";

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
