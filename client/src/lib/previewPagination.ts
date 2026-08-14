import { stripDocumentControlSections } from "./documentControl";

export function stripDedicatedPages(markdown: string) {
  return stripDocumentControlSections(markdown);
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
