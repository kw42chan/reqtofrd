export function stripDedicatedPages(markdown: string) {
  const lines = markdown.split("\n");
  const filtered: string[] = [];
  let skipping = false;
  for (const line of lines) {
    const heading = line.replace(/^#+\s*/, "").toLowerCase();
    if (heading.includes("cover page") || heading.includes("distribution & sign-off") || heading.includes("distribution and sign-off")) { skipping = true; continue; }
    if (skipping && /^#+\s+/.test(line)) skipping = false;
    if (!skipping) filtered.push(line);
  }
  return filtered.join("\n").trim();
}

export type RequirementPreviewPage = { label: string; markdown: string };

export function splitFunctionalRequirementPages(markdown: string): RequirementPreviewPage[] {
  const content = stripDedicatedPages(markdown);
  if (!content) return [];
  const markers = Array.from(content.matchAll(/^#\s+Functional Requirement Item\s+(\d+)\s*$/gim));
  if (!markers.length) return [{ label: "Functional Requirement Document", markdown: content }];

  const pages: RequirementPreviewPage[] = [];
  const opening = content.slice(0, markers[0].index).trim();
  if (opening) pages.push({ label: "Functional Requirement Document", markdown: opening });
  markers.forEach((marker, index) => {
    const start = marker.index ?? 0;
    const end = index + 1 < markers.length ? markers[index + 1].index : content.length;
    pages.push({ label: `Functional Requirement Item ${marker[1]}`, markdown: content.slice(start, end).trim() });
  });
  return pages;
}
