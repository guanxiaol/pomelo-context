import type { ContextWorkbook, WorkbookSheet } from "../types.ts";

export function workbookToMarkdown(workbook: ContextWorkbook): string {
  const parts = [
    `# ${workbook.title}`,
    "",
    workbook.summary,
    "",
    `Recipe: \`${workbook.recipe}\``,
    "",
    "## Reading Protocol",
    "",
    "- Read `manifest.json` first.",
    "- Select sheets by task and token budget.",
    "- Pull CSV ranges rather than loading the whole workbook.",
    "",
    "## Sheets",
    "",
    ...workbook.sheets.map((sheet) => sheetSummary(sheet)),
    "",
    ...workbook.notes.map((note) => `## ${note.title}\n\n${note.body}`)
  ];
  return `${parts.join("\n")}\n`;
}

function sheetSummary(sheet: WorkbookSheet): string {
  return `### ${sheet.name}\n\n${sheet.description}\n\nRows: ${sheet.rows.length}. Suggested ranges: ${sheet.suggestedRanges.join(", ")}.\n`;
}
