import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { safeFileSegment } from "./utils.ts";

export interface RangeRef {
  startCol: number;
  startRow: number;
  endCol: number;
  endRow: number;
}

export function parseRange(range: string): RangeRef {
  const match = range.trim().match(/^([A-Za-z]+)(\d+):([A-Za-z]+)(\d+)$/);
  if (!match) {
    throw new Error(`Invalid range "${range}". Expected A1:D20.`);
  }
  return {
    startCol: columnIndex(match[1]),
    startRow: Number(match[2]),
    endCol: columnIndex(match[3]),
    endRow: Number(match[4])
  };
}

export async function readSheetRange(bundlePath: string, sheetName: string, range: string): Promise<string> {
  const manifest = JSON.parse(await readFile(join(bundlePath, "manifest.json"), "utf8"));
  const sheet = manifest.sheets.find((entry: { name: string }) => entry.name === sheetName);
  if (!sheet) {
    throw new Error(`Sheet not found: ${sheetName}`);
  }
  const csv = await readFile(join(bundlePath, "sheets", `${safeFileSegment(sheetName)}.csv`), "utf8");
  const rows = parseCsv(csv);
  const ref = parseRange(range);
  const sliced = rows
    .slice(ref.startRow - 1, ref.endRow)
    .map((row) => row.slice(ref.startCol - 1, ref.endCol));
  return sliced.map((row) => row.map(csvCell).join(",")).join("\n") + "\n";
}

export function parseCsv(raw: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < raw.length; i += 1) {
    const char = raw[i];
    if (char === '"' && raw[i + 1] === '"') {
      cell += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && raw[i + 1] === "\n") i += 1;
      row.push(cell);
      if (row.length > 1 || row[0] !== "") rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

function columnIndex(label: string): number {
  let index = 0;
  for (const char of label.toUpperCase()) {
    index = index * 26 + char.charCodeAt(0) - 64;
  }
  return index;
}

function csvCell(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}
