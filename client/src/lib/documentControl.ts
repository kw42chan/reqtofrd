const CONTROL_HEADING =
  /\b(?:mandatory\s+section\s*1\s*:?\s*)?cover\s*page\b|\bdistribution\s*(?:&|and)\s*sign[\s-]*off(?:\s*table)?\b/i;
const BODY_SECTION_HEADING =
  /^(?:mandatory\s+section\s*[2-6]\b|revision\s+history\b|executive\s+summary\b|functional\s+requirements?\b|functional\s+requirement\s+item\s+\d+\b|integration\b|out\s+of\s+scope\b|scope\s+boundary\b)/i;

function headingText(line: string) {
  const match = line.match(/^\s{0,3}#{1,6}\s+(.+?)\s*#*\s*$/);
  return match?.[1]?.replace(/[>*_`]/g, "").trim() ?? null;
}

/**
 * Removes model-generated document-control sections from requirement-item Markdown.
 * The application owns the single Cover Page and Distribution & Sign-off Table.
 */
export function stripDocumentControlSections(markdown: string) {
  const lines = markdown.replace(/\r/g, "").split("\n");
  const retained: string[] = [];
  let skippingControl = false;

  for (const line of lines) {
    const heading = headingText(line);
    if (heading && CONTROL_HEADING.test(heading)) {
      skippingControl = true;
      continue;
    }

    if (skippingControl && heading && BODY_SECTION_HEADING.test(heading)) {
      skippingControl = false;
    }

    if (!skippingControl) retained.push(line);
  }

  return retained
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
