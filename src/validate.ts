import { readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { parseCsv, parseRange } from "./range.ts";

export interface ValidationReport {
  ok: boolean;
  errors: string[];
  warnings: string[];
  checked: {
    sheets: number;
    notes: number;
    assets: number;
  };
}

export async function validateBundle(bundlePath: string): Promise<ValidationReport> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const manifestPath = join(bundlePath, "manifest.json");
  let manifest: any;

  try {
    manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  } catch (error) {
    return {
      ok: false,
      errors: [`Cannot read manifest.json: ${error instanceof Error ? error.message : String(error)}`],
      warnings,
      checked: { sheets: 0, notes: 0, assets: 0 }
    };
  }

  if (manifest.version !== "0.1") errors.push(`Unsupported version: ${manifest.version}`);
  if (!manifest.id) errors.push("Missing id");
  if (!manifest.title) errors.push("Missing title");
  if (!Array.isArray(manifest.sources)) errors.push("sources must be an array");
  if (!Array.isArray(manifest.sheets)) errors.push("sheets must be an array");
  if (!manifest.localFirst) warnings.push("localFirst is not true");
  if (manifest.ai?.enabled) warnings.push("AI enrichment is marked enabled; verify user consent and provenance.");

  const names = new Set<string>();
  for (const sheet of manifest.sheets ?? []) {
    if (!sheet.name) errors.push("Sheet is missing name");
    if (names.has(sheet.name)) errors.push(`Duplicate sheet name: ${sheet.name}`);
    names.add(sheet.name);
    if (!sheet.csv) {
      errors.push(`Sheet ${sheet.name} is missing csv path`);
      continue;
    }
    try {
      const csv = await readFile(join(bundlePath, sheet.csv), "utf8");
      const rows = parseCsv(csv);
      const header = rows[0] ?? [];
      const expectedColumns = sheet.columns ?? [];
      if (header.join("\u0000") !== expectedColumns.join("\u0000")) {
        errors.push(`Sheet ${sheet.name} CSV header does not match manifest columns`);
      }
      if (rows.length - 1 !== sheet.rows) {
        errors.push(`Sheet ${sheet.name} row count mismatch: manifest ${sheet.rows}, csv ${rows.length - 1}`);
      }
    } catch (error) {
      errors.push(`Cannot read sheet ${sheet.name}: ${error instanceof Error ? error.message : String(error)}`);
    }
    for (const range of sheet.suggestedRanges ?? []) {
      try {
        parseRange(range);
      } catch {
        errors.push(`Sheet ${sheet.name} has invalid suggested range: ${range}`);
      }
    }
  }

  for (const note of manifest.notes ?? []) {
    if (!note.path) {
      errors.push(`Note ${note.name ?? "(unnamed)"} is missing path`);
      continue;
    }
    try {
      await stat(join(bundlePath, note.path));
    } catch {
      errors.push(`Missing note file: ${note.path}`);
    }
  }

  for (const asset of manifest.assets ?? []) {
    try {
      await stat(join(bundlePath, asset.path));
    } catch {
      warnings.push(`Declared asset is missing: ${asset.path}`);
    }
  }

  try {
    const xlsxHeader = await readFile(join(bundlePath, "workbook.xlsx"));
    if (xlsxHeader.subarray(0, 2).toString("utf8") !== "PK") {
      errors.push("workbook.xlsx does not look like a zip-based XLSX file");
    }
  } catch {
    warnings.push("workbook.xlsx is missing; bundle can still be agent-readable via CSV/manifest.");
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    checked: {
      sheets: manifest.sheets?.length ?? 0,
      notes: manifest.notes?.length ?? 0,
      assets: manifest.assets?.length ?? 0
    }
  };
}

export function formatValidationReport(report: ValidationReport): string {
  const lines = [
    report.ok ? "OK: bundle is valid" : "ERROR: bundle is invalid",
    `Checked ${report.checked.sheets} sheets, ${report.checked.notes} notes, ${report.checked.assets} assets.`
  ];
  if (report.errors.length) {
    lines.push("", "Errors:", ...report.errors.map((error) => `- ${error}`));
  }
  if (report.warnings.length) {
    lines.push("", "Warnings:", ...report.warnings.map((warning) => `- ${warning}`));
  }
  return `${lines.join("\n")}\n`;
}
