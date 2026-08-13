import { AlignmentType, Document, HeadingLevel, Packer, Paragraph, Table, TableCell, TableRow, TextRun } from "docx";
import { sanitizeFilename } from "./reqToFrd";

function inlineRuns(text: string) {
  const runs: TextRun[] = [];
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  parts.forEach(part => {
    if (part.startsWith("**") && part.endsWith("**")) runs.push(new TextRun({ text: part.slice(2, -2), bold: true }));
    else if (part) runs.push(new TextRun(part));
  });
  return runs.length ? runs : [new TextRun("")];
}

export function markdownBlocks(markdown: string) {
  const lines = markdown.replace(/\r/g, "").split("\n");
  const blocks: Array<Paragraph | Table> = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i] ?? "";
    if (!line.trim()) { i += 1; continue; }
    if (line.startsWith("|")) {
      const rows: string[][] = [];
      while (i < lines.length && (lines[i] ?? "").trim().startsWith("|")) {
        const cells = (lines[i] ?? "").split("|").slice(1, -1).map(cell => cell.trim());
        if (!cells.every(cell => /^:?-{3,}:?$/.test(cell))) rows.push(cells);
        i += 1;
      }
      if (rows.length) blocks.push(new Table({ rows: rows.map((row, rowIndex) => new TableRow({ children: row.map(cell => new TableCell({ children: [new Paragraph({ children: rowIndex === 0 ? [new TextRun({ text: cell, bold: true })] : inlineRuns(cell) })] })) })) }));
      continue;
    }
    const heading = line.match(/^(#{1,3})\s+(.+)/);
    if (heading) {
      const level = heading[1].length === 1 ? HeadingLevel.HEADING_1 : heading[1].length === 2 ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3;
      blocks.push(new Paragraph({ heading: level, children: inlineRuns(heading[2]) }));
    } else if (/^>\s?/.test(line)) {
      blocks.push(new Paragraph({ style: "Intense Quote", children: inlineRuns(line.replace(/^>\s?/, "")) }));
    } else if (/^\s*[-*]\s+/.test(line)) {
      blocks.push(new Paragraph({ bullet: { level: 0 }, children: inlineRuns(line.replace(/^\s*[-*]\s+/, "")) }));
    } else if (/^\s*\d+[.)]\s+/.test(line)) {
      blocks.push(new Paragraph({ numbering: { reference: "frd-numbered", level: 0 }, children: inlineRuns(line.replace(/^\s*\d+[.)]\s+/, "")) }));
    } else {
      blocks.push(new Paragraph({ spacing: { after: 120 }, children: inlineRuns(line) }));
    }
    i += 1;
  }
  return blocks;
}

export async function downloadDocx(markdown: string, title: string) {
  const doc = new Document({
    creator: "ReqToFRD",
    title,
    description: "Audit-compliant Functional Requirement Document",
    numbering: { config: [{ reference: "frd-numbered", levels: [{ level: 0, format: "decimal", text: "%1.", alignment: AlignmentType.LEFT }] }] },
    sections: [{ properties: { page: { margin: { top: 900, right: 900, bottom: 900, left: 900 } } }, children: markdownBlocks(markdown) }],
  });
  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = sanitizeFilename(title);
  anchor.click();
  URL.revokeObjectURL(url);
}
