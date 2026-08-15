import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  PageBreak,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
} from "docx";
import type { DocumentMetadata } from "./reqToFrd";
import { sanitizeFilename } from "./reqToFrd";
import { stripDocumentControlSections } from "./documentControl";

export function stripDedicatedMarkdown(markdown: string) {
  return stripDocumentControlSections(markdown);
}

function inlineRuns(text: string) {
  return text
    .split(/(\*\*[^*]+\*\*)/g)
    .filter(Boolean)
    .map(part =>
      part.startsWith("**") && part.endsWith("**")
        ? new TextRun({ text: part.slice(2, -2), bold: true })
        : new TextRun(part)
    );
}

export function markdownBlocks(markdown: string) {
  const lines = markdown.replace(/\r/g, "").split("\n");
  const blocks: Array<Paragraph | Table> = [];
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i] ?? "";
    if (!line.trim()) continue;
    if (line.startsWith("|")) {
      const rows: string[][] = [];
      while (i < lines.length && (lines[i] ?? "").trim().startsWith("|")) {
        const cells = (lines[i] ?? "")
          .split("|")
          .slice(1, -1)
          .map(cell => cell.trim());
        if (!cells.every(cell => /^:?-{3,}:?$/.test(cell))) rows.push(cells);
        i += 1;
      }
      i -= 1;
      if (rows.length)
        blocks.push(
          new Table({
            rows: rows.map(
              (row, index) =>
                new TableRow({
                  children: row.map(
                    cell =>
                      new TableCell({
                        children: [
                          new Paragraph({
                            children:
                              index === 0
                                ? [new TextRun({ text: cell, bold: true })]
                                : inlineRuns(cell),
                          }),
                        ],
                      })
                  ),
                })
            ),
          })
        );
      continue;
    }
    const heading = line.match(/^(#{1,3})\s+(.+)/);
    if (heading)
      blocks.push(
        new Paragraph({
          heading:
            heading[1].length === 1
              ? HeadingLevel.HEADING_1
              : heading[1].length === 2
                ? HeadingLevel.HEADING_2
                : HeadingLevel.HEADING_3,
          children: inlineRuns(heading[2]),
        })
      );
    else if (/^>\s?/.test(line))
      blocks.push(
        new Paragraph({
          style: "Intense Quote",
          children: inlineRuns(line.replace(/^>\s?/, "")),
        })
      );
    else if (/^\s*[-*]\s+/.test(line))
      blocks.push(
        new Paragraph({
          bullet: { level: 0 },
          children: inlineRuns(line.replace(/^\s*[-*]\s+/, "")),
        })
      );
    else
      blocks.push(
        new Paragraph({ spacing: { after: 120 }, children: inlineRuns(line) })
      );
  }
  return blocks;
}

function coverPage(title: string, metadata: DocumentMetadata): Paragraph[] {
  return [
    new Paragraph({
      text: "MANDATORY SECTION 1: COVER PAGE",
      alignment: AlignmentType.CENTER,
      spacing: { after: 800 },
    }),
    new Paragraph({
      text: "FUNCTIONAL REQUIREMENT DOCUMENT",
      alignment: AlignmentType.CENTER,
      heading: HeadingLevel.TITLE,
      spacing: { after: 360 },
    }),
    new Paragraph({
      text: title || metadata.enhancementTitle,
      alignment: AlignmentType.CENTER,
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 600 },
    }),
    new Paragraph({
      text: `${metadata.region}_${metadata.system}_${metadata.enhancementTitle}`,
      alignment: AlignmentType.CENTER,
      spacing: { after: 1100 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Request / Demand ID: ", bold: true }),
        new TextRun(metadata.requestId),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Revision: ", bold: true }),
        new TextRun(`${metadata.revisionVersion} · ${metadata.revisionDate}`),
      ],
    }),
    new Paragraph({ children: [new PageBreak()] }),
  ];
}

function signOffPage(metadata: DocumentMetadata): Array<Paragraph | Table> {
  const borders = {
    top: { style: BorderStyle.SINGLE, color: "112A36", size: 8 },
    bottom: { style: BorderStyle.SINGLE, color: "112A36", size: 8 },
    left: { style: BorderStyle.SINGLE, color: "112A36", size: 8 },
    right: { style: BorderStyle.SINGLE, color: "112A36", size: 8 },
    insideHorizontal: { style: BorderStyle.SINGLE, color: "B8C6C9", size: 4 },
    insideVertical: { style: BorderStyle.SINGLE, color: "B8C6C9", size: 4 },
  };
  const table = new Table({
    borders,
    rows: [
      new TableRow({
        children: ["Name", "Title", "Department", "Role Type"].map(
          cell =>
            new TableCell({
              shading: {
                type: ShadingType.CLEAR,
                color: "112A36",
                fill: "112A36",
              },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: cell, bold: true, color: "FFFFFF" }),
                  ],
                }),
              ],
            })
        ),
      }),
      ...metadata.distributionList.map(
        entry =>
          new TableRow({
            children: [
              entry.name || "—",
              entry.title || "—",
              entry.department,
              entry.roleType,
            ].map(cell => new TableCell({ children: [new Paragraph(cell)] })),
          })
      ),
    ],
  });
  return [
    new Paragraph({
      text: "Distribution & Sign-off Table",
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 240 },
    }),
    new Paragraph({ text: "MANDATORY SIGN-OFF PAGE", spacing: { after: 300 } }),
    table,
    new Paragraph({ children: [new PageBreak()] }),
  ];
}

export function dedicatedDocumentBlocks(
  title: string,
  metadata: DocumentMetadata
): Array<Paragraph | Table> {
  return [...coverPage(title, metadata), ...signOffPage(metadata)];
}

export async function downloadDocx(
  markdown: string,
  title: string,
  metadata?: DocumentMetadata
) {
  const sections = metadata
    ? [
        {
          properties: {
            page: { margin: { top: 900, right: 900, bottom: 900, left: 900 } },
          },
          children: [
            ...dedicatedDocumentBlocks(title, metadata),
            ...markdownBlocks(stripDedicatedMarkdown(markdown)),
          ],
        },
      ]
    : [
        {
          properties: {
            page: { margin: { top: 900, right: 900, bottom: 900, left: 900 } },
          },
          children: markdownBlocks(markdown),
        },
      ];
  const doc = new Document({
    creator: "ReqToFRD",
    title,
    description: "Audit-compliant Functional Requirement Document",
    numbering: {
      config: [
        {
          reference: "frd-numbered",
          levels: [
            {
              level: 0,
              format: "decimal",
              text: "%1.",
              alignment: AlignmentType.LEFT,
            },
          ],
        },
      ],
    },
    sections,
  });
  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = sanitizeFilename(title);
  anchor.click();
  URL.revokeObjectURL(url);
}
