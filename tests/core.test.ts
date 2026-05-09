import { mkdtemp, readFile, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import assert from "node:assert/strict";
import test from "node:test";
import { buildWorkbook } from "../src/parser.ts";
import { packBundle, inspectBundle, loadBundle } from "../src/bundle.ts";
import { readSheetRange } from "../src/range.ts";
import { benchmarkTarget } from "../src/benchmark.ts";
import { runExperiment } from "../src/experiment.ts";
import { recipes } from "../src/recipes.ts";
import { validateBundle } from "../src/validate.ts";

const execFileAsync = promisify(execFile);

test("buildWorkbook creates a local-first workbook with recipe sheets", async () => {
  const workbook = await buildWorkbook("examples/web-archive.md", "web-or-chat-archive");
  assert.equal(workbook.localFirst, true);
  assert.equal(workbook.ai.enabled, false);
  assert.ok(workbook.sheets.some((sheet) => sheet.name === "Claims"));
  assert.ok(workbook.sheets.some((sheet) => sheet.name === "Sections"));
});

test("packBundle writes manifest, csv sheets, markdown, html, and xlsx", async () => {
  const dir = await mkdtemp(join(tmpdir(), "cwb-"));
  const out = join(dir, "demo.cwb");
  await packBundle("examples/web-archive.md", out, "web-or-chat-archive");
  await stat(join(out, "manifest.json"));
  await stat(join(out, "sheets", "sections.csv"));
  await stat(join(out, "notes", "summary.md"));
  await stat(join(out, "artifact.html"));
  await stat(join(out, "workbook.xlsx"));
  const manifest = JSON.parse(await readFile(join(out, "manifest.json"), "utf8"));
  assert.equal(manifest.ai.enabled, false);
  assert.ok(manifest.sheets.find((sheet: { name: string }) => sheet.name === "Claims"));
  const loaded = await loadBundle(out);
  assert.ok(loaded.sheets.length >= 5);
});

test("readSheetRange returns a precise CSV slice", async () => {
  const dir = await mkdtemp(join(tmpdir(), "cwb-"));
  const out = join(dir, "demo.cwb");
  await packBundle("examples/pr-review.md", out, "annotated-pr-review");
  const csv = await readSheetRange(out, "Findings", "A1:E5");
  assert.match(csv, /Severity,File,Line,Finding,Suggested Fix/);
});

test("inspectBundle prints index and workbook xlsx is a valid zip", async () => {
  const dir = await mkdtemp(join(tmpdir(), "cwb-"));
  const out = join(dir, "demo.cwb");
  await packBundle("examples/chat-export.json", out, "web-or-chat-archive");
  const inspected = await inspectBundle(out, "small", true);
  assert.match(inspected, /Sheet Index/);
  assert.match(inspected, /Messages/);
  const { stdout } = await execFileAsync("unzip", ["-t", join(out, "workbook.xlsx")]);
  assert.match(stdout, /No errors detected/);
});

test("validateBundle accepts a generated bundle", async () => {
  const dir = await mkdtemp(join(tmpdir(), "cwb-"));
  const out = join(dir, "demo.cwb");
  await packBundle("examples/web-archive.md", out, "web-or-chat-archive");
  const report = await validateBundle(out);
  assert.equal(report.ok, true);
  assert.equal(report.errors.length, 0);
  assert.ok(report.checked.sheets >= 5);
});

test("benchmarkTarget returns token comparison paths", async () => {
  const dir = await mkdtemp(join(tmpdir(), "cwb-"));
  const out = join(dir, "demo.cwb");
  await packBundle("examples/chat-export.json", out, "web-or-chat-archive");
  const report = await benchmarkTarget(out);
  assert.equal(report.recipe, "web-or-chat-archive");
  assert.ok(report.manifestTokens > 0);
  assert.ok(report.smallReadTokens >= report.manifestTokens);
});

test("directory benchmark uses full file tokens, not only previews", async () => {
  const report = await benchmarkTarget(".", "module-map");
  assert.equal(report.recipe, "module-map");
  assert.ok(report.fullSourceTokens > report.manifestTokens);
  assert.ok(report.savingsVsFull.manifest > 0);
});

test("HTML effectiveness catalog maps all demos to implemented recipes", async () => {
  const catalog = JSON.parse(await readFile("examples/html-effectiveness-catalog.json", "utf8"));
  const recipeIds = new Set(recipes.map((recipe) => recipe.id));
  assert.equal(catalog.demos.length, 20);
  for (const demo of catalog.demos) {
    assert.ok(recipeIds.has(demo.recipe), `Unknown recipe ${demo.recipe}`);
    assert.ok(demo.expectedSheets.length > 0, `Missing expected sheets for ${demo.id}`);
  }
});

test("experiment shows CWB small-read is token-efficient with full fact coverage", async () => {
  const dir = await mkdtemp(join(tmpdir(), "cwb-experiment-"));
  const output = await runExperiment(dir);
  assert.equal(output.rows.length, 12);
  assert.equal(output.averages["cwb-small"].accuracy, 1);
  assert.ok(output.averages["cwb-small"].tokens < output.averages["markdown-full"].tokens);
  assert.ok(output.averages["cwb-small"].efficiency > output.averages["markdown-full"].efficiency);
  await stat(join(dir, "experiment-report.html"));
  await stat(join(dir, "experiment-summary.csv"));
});

test("HTML parser preserves text, images, tables, code, and references", async () => {
  const workbook = await buildWorkbook("examples/mixed-web.html", "web-or-chat-archive");
  const sheetNames = new Set(workbook.sheets.map((sheet) => sheet.name));
  assert.ok(sheetNames.has("Compatibility Matrix"));
  assert.ok(sheetNames.has("Text Blocks"));
  assert.ok(sheetNames.has("Images"));
  assert.ok(sheetNames.has("Extracted Tables"));
  assert.ok(sheetNames.has("Code Blocks"));
  assert.ok(sheetNames.has("Links"));
  assert.ok(workbook.references.some((reference) => reference.url.includes("html-effectiveness")));
  const images = workbook.sheets.find((sheet) => sheet.name === "Images");
  assert.equal(images?.rows[0]?.Alt, "Quarterly token savings chart");
  const tables = workbook.sheets.find((sheet) => sheet.name === "Extracted Tables");
  assert.ok(tables?.rows.some((row) => row.Value === "CWB small-read"));
  const code = workbook.sheets.find((sheet) => sheet.name === "Code Blocks");
  assert.equal(code?.rows[0]?.Language, "ts");
});
