import { mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";
import type { ContextWorkbook, ConvertOptions, WorkbookNote, WorkbookSheet } from "./types.ts";
import { buildWorkbook } from "./parser.ts";
import { isRecipeId } from "./recipes.ts";
import { sheetToCsv } from "./exporters/csv.ts";
import { workbookToHtml } from "./exporters/html.ts";
import { workbookToMarkdown } from "./exporters/markdown.ts";
import { writeXlsx } from "./exporters/xlsx.ts";
import { parseCsv } from "./range.ts";
import { safeFileSegment } from "./utils.ts";

export async function packBundle(input: string, out: string, recipe: string, formats: string[] = ["xlsx", "json", "md", "csv", "html"]): Promise<ContextWorkbook> {
  if (!isRecipeId(recipe)) {
    throw new Error(`Unknown recipe: ${recipe}`);
  }
  const workbook = await buildWorkbook(input, recipe);
  await writeBundle(workbook, out, input, new Set(formats));
  return workbook;
}

export async function writeBundle(workbook: ContextWorkbook, out: string, inputPath: string | undefined, formats: Set<string>): Promise<void> {
  await rm(out, { recursive: true, force: true });
  await mkdir(join(out, "sheets"), { recursive: true });
  await mkdir(join(out, "notes"), { recursive: true });
  await mkdir(join(out, "assets"), { recursive: true });

  await writeFile(join(out, "manifest.json"), JSON.stringify(manifestFor(workbook), null, 2));
  for (const sheet of workbook.sheets) {
    await writeFile(join(out, "sheets", `${safeFileSegment(sheet.name)}.csv`), sheetToCsv(sheet));
  }
  for (const note of workbook.notes) {
    await writeFile(join(out, "notes", note.name), note.body);
  }
  if (formats.has("md")) {
    await writeFile(join(out, "notes", "workbook.md"), workbookToMarkdown(workbook));
  }
  if (formats.has("html")) {
    await writeFile(join(out, "artifact.html"), workbookToHtml(workbook));
  }
  if (formats.has("xlsx")) {
    await writeXlsx(workbook, join(out, "workbook.xlsx"));
  }
  if (inputPath && workbook.sources[0]?.type === "html") {
    await writeFile(join(out, "assets", "artifact.html"), await readFile(inputPath, "utf8"));
  }
}

export async function loadBundle(bundlePath: string): Promise<ContextWorkbook> {
  const manifest = JSON.parse(await readFile(join(bundlePath, "manifest.json"), "utf8"));
  const notes = await loadNotes(bundlePath);
  const sheets: WorkbookSheet[] = [];
  for (const sheetMeta of manifest.sheets as Array<Omit<WorkbookSheet, "rows"> & { csv: string }>) {
    const raw = await readFile(join(bundlePath, sheetMeta.csv), "utf8");
    const rows = parseCsv(raw);
    const columns = rows[0] ?? sheetMeta.columns;
    const body = rows.slice(1).map((row) => Object.fromEntries(columns.map((column, index) => [column, row[index] ?? ""])));
    sheets.push({ ...sheetMeta, columns, rows: body });
  }
  return {
    ...manifest,
    sheets,
    notes,
    references: manifest.references ?? [],
    localFirst: true,
    ai: manifest.ai ?? { enabled: false, note: "No external model calls are made by default." }
  };
}

export async function convertBundle(options: ConvertOptions): Promise<string> {
  const inputStat = await stat(options.input);
  const workbook = inputStat.isDirectory() && await hasManifest(options.input)
    ? await loadBundle(options.input)
    : await buildWorkbook(options.input, "web-or-chat-archive");
  if (options.to === "json") {
    const output = JSON.stringify(manifestFor(workbook), null, 2);
    if (options.out) {
      await writeFile(options.out, output);
      return options.out;
    }
    return output;
  }
  if (options.to === "md") {
    const output = workbookToMarkdown(workbook);
    if (options.out) {
      await writeFile(options.out, output);
      return options.out;
    }
    return output;
  }
  if (options.to === "html") {
    const output = workbookToHtml(workbook);
    if (options.out) {
      await writeFile(options.out, output);
      return options.out;
    }
    return output;
  }
  if (options.to === "xlsx") {
    const out = options.out ?? `${basename(options.input)}.xlsx`;
    await writeXlsx(workbook, out);
    return out;
  }
  if (options.to === "csv-dir") {
    const out = options.out ?? `${basename(options.input)}-csv`;
    await rm(out, { recursive: true, force: true });
    await mkdir(out, { recursive: true });
    for (const sheet of workbook.sheets) {
      await writeFile(join(out, `${safeFileSegment(sheet.name)}.csv`), sheetToCsv(sheet));
    }
    return out;
  }
  throw new Error(`Unsupported conversion target: ${options.to}`);
}

export async function inspectBundle(bundlePath: string, budget: "small" | "medium" | "full", includeIndex: boolean): Promise<string> {
  const manifest = JSON.parse(await readFile(join(bundlePath, "manifest.json"), "utf8"));
  const lines = [
    `# ${manifest.title}`,
    "",
    manifest.summary,
    "",
    `Recipe: ${manifest.recipe}`,
    `Created: ${manifest.createdAt}`,
    `Token estimate: full ${manifest.tokenBudget.estimatedFullTokens}, index ${manifest.tokenBudget.estimatedIndexTokens}`,
    "",
    "## Recommended Reads",
    ...manifest.readingGuide
      .filter((entry: { tokenBudget: string }) => budget === "full" || entry.tokenBudget === budget || (budget === "medium" && entry.tokenBudget === "small"))
      .map((entry: { task: string; firstRead: string[]; thenRead: string[]; rationale: string }) => `- ${entry.task}: first ${entry.firstRead.join(", ")}; then ${entry.thenRead.join(", ")}. ${entry.rationale}`)
  ];
  if (includeIndex) {
    lines.push("", "## Sheet Index");
    for (const sheet of manifest.sheets) {
      lines.push(`- ${sheet.name}: ${sheet.rows} rows, ${sheet.description}, suggested ${sheet.suggestedRanges.join(", ")}`);
    }
  }
  return `${lines.join("\n")}\n`;
}

function manifestFor(workbook: ContextWorkbook): unknown {
  return {
    version: workbook.version,
    id: workbook.id,
    title: workbook.title,
    recipe: workbook.recipe,
    createdAt: workbook.createdAt,
    summary: workbook.summary,
    tokenBudget: workbook.tokenBudget,
    localFirst: workbook.localFirst,
    ai: workbook.ai,
    sources: workbook.sources,
    sheets: workbook.sheets.map((sheet) => ({
      name: sheet.name,
      kind: sheet.kind,
      description: sheet.description,
      columns: sheet.columns,
      rows: sheet.rows.length,
      priority: sheet.priority,
      suggestedRanges: sheet.suggestedRanges,
      csv: `sheets/${safeFileSegment(sheet.name)}.csv`
    })),
    notes: workbook.notes.map((note) => ({ name: note.name, title: note.title, path: `notes/${note.name}` })),
    assets: workbook.assets,
    references: workbook.references,
    readingGuide: workbook.readingGuide
  };
}

async function hasManifest(path: string): Promise<boolean> {
  try {
    await stat(join(path, "manifest.json"));
    return true;
  } catch {
    return false;
  }
}

async function loadNotes(bundlePath: string): Promise<WorkbookNote[]> {
  const notesDir = join(bundlePath, "notes");
  try {
    const names = await readdir(notesDir);
    return Promise.all(names.filter((name) => name.endsWith(".md")).map(async (name) => ({
      name,
      title: name.replace(/[-_]/g, " ").replace(/\.md$/, ""),
      body: await readFile(join(notesDir, name), "utf8")
    })));
  } catch {
    return [];
  }
}
