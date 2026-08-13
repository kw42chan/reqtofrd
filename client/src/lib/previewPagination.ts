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
