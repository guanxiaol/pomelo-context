import type { CellValue, WorkbookSheet } from "../types.ts";

export function sheetToCsv(sheet: WorkbookSheet): string {
  const rows = [
    sheet.columns,
    ...sheet.rows.map((row) => sheet.columns.map((column) => row[column] ?? ""))
  ];
  return `${rows.map((row) => row.map(csvCell).join(",")).join("\n")}\n`;
}

export function csvCell(value: CellValue): string {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}
