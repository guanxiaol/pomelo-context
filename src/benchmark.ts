import { readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { loadBundle } from "./bundle.ts";
import { buildWorkbook } from "./parser.ts";
import type { ContextWorkbook, WorkbookSheet } from "./types.ts";
import { estimateTokens } from "./utils.ts";

export interface BenchmarkReport {
  title: string;
  recipe: string;
  fullSourceTokens: number;
  manifestTokens: number;
  smallReadTokens: number;
  mediumReadTokens: number;
  fullWorkbookMarkdownTokens: number;
  savingsVsFull: {
    manifest: number;
    smallRead: number;
    mediumRead: number;
  };
}

export async function benchmarkTarget(path: string, recipe = "web-or-chat-archive"): Promise<BenchmarkReport> {
  const inputStat = await stat(path);
  const workbook = inputStat.isDirectory() && await hasManifest(path)
    ? await loadBundle(path)
    : await buildWorkbook(path, recipe as never);
  return benchmarkWorkbook(workbook);
}

export function benchmarkWorkbook(workbook: ContextWorkbook): BenchmarkReport {
  const manifestShape = {
    title: workbook.title,
    recipe: workbook.recipe,
    summary: workbook.summary,
    tokenBudget: workbook.tokenBudget,
    sheets: workbook.sheets.map((sheet) => ({
      name: sheet.name,
      kind: sheet.kind,
      rows: sheet.rows.length,
      suggestedRanges: sheet.suggestedRanges,
      description: sheet.description
    })),
    readingGuide: workbook.readingGuide
  };
  const manifestTokens = estimateTokens(JSON.stringify(manifestShape));
  const fullSourceTokens = workbook.tokenBudget.estimatedFullTokens;
  const smallSheets = workbook.sheets.filter((sheet) => sheet.priority <= 2);
  const mediumSheets = workbook.sheets.filter((sheet) => sheet.priority <= 3);
  const smallReadTokens = manifestTokens + estimateTokens(sheetsPreview(smallSheets, 12));
  const mediumReadTokens = manifestTokens + estimateTokens(sheetsPreview(mediumSheets, 24));
  const fullWorkbookMarkdownTokens = estimateTokens(sheetsPreview(workbook.sheets, 1_000));

  return {
    title: workbook.title,
    recipe: workbook.recipe,
    fullSourceTokens,
    manifestTokens,
    smallReadTokens,
    mediumReadTokens,
    fullWorkbookMarkdownTokens,
    savingsVsFull: {
      manifest: savings(fullSourceTokens, manifestTokens),
      smallRead: savings(fullSourceTokens, smallReadTokens),
      mediumRead: savings(fullSourceTokens, mediumReadTokens)
    }
  };
}

export function formatBenchmarkReport(report: BenchmarkReport): string {
  return [
    `# Token Benchmark: ${report.title}`,
    "",
    `Recipe: ${report.recipe}`,
    "",
    "| Path | Estimated Tokens | Savings vs Full Source |",
    "| --- | ---: | ---: |",
    `| Full source | ${report.fullSourceTokens} | 0% |`,
    `| Manifest only | ${report.manifestTokens} | ${formatPercent(report.savingsVsFull.manifest)} |`,
    `| Small read | ${report.smallReadTokens} | ${formatPercent(report.savingsVsFull.smallRead)} |`,
    `| Medium read | ${report.mediumReadTokens} | ${formatPercent(report.savingsVsFull.mediumRead)} |`,
    `| Full workbook markdown view | ${report.fullWorkbookMarkdownTokens} | ${formatPercent(savings(report.fullSourceTokens, report.fullWorkbookMarkdownTokens))} |`,
    "",
    "Note: savings can be negative for tiny inputs. The protocol pays off on long pages, chats, PRs, and code contexts."
  ].join("\n") + "\n";
}

function sheetsPreview(sheets: WorkbookSheet[], maxRowsPerSheet: number): string {
  return sheets.map((sheet) => {
    const rows = sheet.rows.slice(0, maxRowsPerSheet).map((row) => JSON.stringify(row)).join("\n");
    return `## ${sheet.name}\n${sheet.description}\n${sheet.columns.join(", ")}\n${rows}`;
  }).join("\n\n");
}

function savings(full: number, actual: number): number {
  if (full <= 0) return 0;
  return (full - actual) / full;
}

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

async function hasManifest(path: string): Promise<boolean> {
  try {
    await readFile(join(path, "manifest.json"), "utf8");
    return true;
  } catch {
    return false;
  }
}
