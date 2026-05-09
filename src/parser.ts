import { readdir, readFile, stat } from "node:fs/promises";
import { extname, join, relative } from "node:path";
import type { CellValue, ContextWorkbook, RecipeId, WorkbookReference, WorkbookSheet, WorkbookSource } from "./types.ts";
import { getRecipe, recipeCatalogMarkdown } from "./recipes.ts";
import {
  estimateTokens,
  newWorkbookId,
  nowIso,
  sanitizeSheetName,
  sourceTypeForPath,
  stableId,
  titleFromPath,
  truncate,
  uniqueName
} from "./utils.ts";

interface ParsedContent {
  title: string;
  text: string;
  headings: Array<{ level: number; title: string; content: string }>;
  textBlocks: Array<{ kind: string; text: string }>;
  links: Array<{ text: string; url: string }>;
  codeBlocks: Array<{ language: string; code: string }>;
  tables: Array<{ columns: string[]; rows: string[][] }>;
  images: Array<{ src: string; alt: string; title: string; width: string; height: string; sourceSet: string; kind: string }>;
  messages: Array<{ role: string; author: string; content: string }>;
  artifactHtml?: string;
}

const ignoreDirs = new Set([".git", "node_modules", "dist", "tmp", ".cwb"]);
const codeExts = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".py", ".go", ".rs", ".java", ".css", ".html", ".md", ".json", ".yaml", ".yml", ".sql"]);

export const projectReferences: WorkbookReference[] = [
  {
    title: "Using Claude Code: The Unreasonable Effectiveness of HTML",
    author: "Thariq Shihipar",
    url: "https://x.com/trq212/status/2052809885763747935",
    note: "Original article that inspired the HTML-artifact framing and many prompt patterns."
  },
  {
    title: "The unreasonable effectiveness of HTML — examples",
    author: "Thariq Shihipar",
    url: "https://thariqs.github.io/html-effectiveness/",
    note: "Companion gallery of 20 self-contained HTML artifacts used as scenario references."
  },
  {
    title: "ThariqS/html-effectiveness",
    author: "Thariq Shihipar",
    url: "https://github.com/ThariqS/html-effectiveness",
    note: "Source repository for the companion examples."
  }
];

export async function buildWorkbook(inputPath: string, recipeId: RecipeId): Promise<ContextWorkbook> {
  const inputStat = await stat(inputPath);
  const recipe = getRecipe(recipeId);
  const createdAt = nowIso();
  const usedSheetNames = new Set<string>();
  const sources: WorkbookSource[] = [];
  const sheets: WorkbookSheet[] = [];
  const notes = [];
  const assets = [];

  if (inputStat.isDirectory()) {
    const dirData = await parseDirectory(inputPath);
    sources.push({
      id: stableId(inputPath),
      type: "directory",
      title: titleFromPath(inputPath),
      path: inputPath,
      capturedAt: createdAt,
      bytes: dirData.totalBytes,
      tokenEstimate: dirData.totalTokens,
      summary: `${dirData.fileSummaries.length} files scanned from a code or document directory.`
    });
    sheets.push(...baseSheets(recipeId, recipe.title, sources, usedSheetNames));
    sheets.push(sheet("Files", "code", "Directory file inventory for agent-selective reading.", ["Path", "Extension", "Lines", "Bytes", "Preview"], dirData.fileSummaries.map((file) => ({
      Path: file.path,
      Extension: file.extension,
      Lines: file.lines,
      Bytes: file.bytes,
      Preview: file.preview
    })), 2, usedSheetNames));
    sheets.push(sheet("Directories", "code", "Directory-level file counts and byte totals.", ["Directory", "Files", "Bytes"], dirData.directories, 4, usedSheetNames));
    sheets.push(...recipeSheets(recipe, usedSheetNames, {
      headings: dirData.fileSummaries.map((file) => ({ level: 2, title: file.path, content: file.preview })),
      textBlocks: dirData.fileSummaries.map((file) => ({ kind: "file-preview", text: `${file.path}: ${file.preview}` })),
      links: [],
      codeBlocks: [],
      tables: [],
      images: [],
      messages: []
    }));
    notes.push(summaryNote(recipeId, sources, sheets));
  } else {
    const raw = await readFile(inputPath, "utf8");
    const sourceType = sourceTypeForPath(inputPath);
    const parsed = parseContent(raw, sourceType, inputPath);
    sources.push({
      id: stableId(`${inputPath}:${raw.length}`),
      type: sourceType,
      title: parsed.title,
      path: inputPath,
      capturedAt: createdAt,
      bytes: Buffer.byteLength(raw),
      tokenEstimate: estimateTokens(parsed.text),
      summary: truncate(parsed.text, 320)
    });
    sheets.push(...baseSheets(recipeId, recipe.title, sources, usedSheetNames));
    sheets.push(sheet("Compatibility Matrix", "index", "Counts of source modalities preserved in the bundle.", ["Modality", "Count", "Sheet", "Notes"], [
      { Modality: "Text", Count: parsed.textBlocks.length || parsed.headings.length, Sheet: "Text Blocks / Sections", Notes: "Paragraphs, headings, and section previews." },
      { Modality: "Images", Count: parsed.images.length, Sheet: "Images", Notes: "Image URLs, alt text, dimensions, srcset, and titles; remote bytes are not downloaded by default." },
      { Modality: "Tables", Count: parsed.tables.length, Sheet: "Extracted Tables", Notes: "Markdown, CSV, and HTML tables are normalized into rows and columns." },
      { Modality: "Code", Count: parsed.codeBlocks.length, Sheet: "Code Blocks", Notes: "Fenced Markdown code and HTML pre/code blocks." },
      { Modality: "Links", Count: parsed.links.length, Sheet: "Links", Notes: "Anchor text and href/source URLs." }
    ], 1, usedSheetNames));
    sheets.push(sheet("Sections", "content", "Heading-delimited content chunks for selective reading.", ["Index", "Level", "Heading", "Preview", "Token Estimate"], parsed.headings.map((section, index) => ({
      Index: index + 1,
      Level: section.level,
      Heading: section.title,
      Preview: truncate(section.content, 500),
      "Token Estimate": estimateTokens(`${section.title}\n${section.content}`)
    })), 2, usedSheetNames));
    if (parsed.textBlocks.length > 0) {
      sheets.push(sheet("Text Blocks", "content", "Atomic text blocks extracted from paragraphs, list items, captions, and headings.", ["Index", "Kind", "Text", "Token Estimate"], parsed.textBlocks.map((block, index) => ({
        Index: index + 1,
        Kind: block.kind,
        Text: truncate(block.text, 800),
        "Token Estimate": estimateTokens(block.text)
      })), 3, usedSheetNames));
    }
    if (parsed.links.length > 0) {
      sheets.push(sheet("Links", "reference", "Extracted links and references.", ["Text", "URL", "Source"], parsed.links.map((link) => ({
        Text: link.text,
        URL: link.url,
        Source: parsed.title
      })), 4, usedSheetNames));
    }
    if (parsed.codeBlocks.length > 0) {
      sheets.push(sheet("Code Blocks", "code", "Extracted code blocks.", ["Index", "Language", "Preview", "Token Estimate"], parsed.codeBlocks.map((block, index) => ({
        Index: index + 1,
        Language: block.language || "text",
        Preview: truncate(block.code, 800),
        "Token Estimate": estimateTokens(block.code)
      })), 4, usedSheetNames));
    }
    if (parsed.tables.length > 0) {
      sheets.push(sheet("Extracted Tables", "table", "Tables parsed from Markdown or CSV-like input.", ["Table", "Row", "Column", "Value"], flattenTables(parsed.tables), 4, usedSheetNames));
    }
    if (parsed.images.length > 0) {
      sheets.push(sheet("Images", "media", "Images and photos extracted from HTML or Markdown without downloading remote bytes.", ["Index", "Kind", "Alt", "Title", "Source", "Source Set", "Width", "Height"], parsed.images.map((image, index) => ({
        Index: index + 1,
        Kind: image.kind,
        Alt: image.alt,
        Title: image.title,
        Source: image.src,
        "Source Set": image.sourceSet,
        Width: image.width,
        Height: image.height
      })), 3, usedSheetNames));
    }
    if (parsed.messages.length > 0) {
      sheets.push(sheet("Messages", "chat", "Chat messages for migration or continuation.", ["Index", "Role", "Author", "Content", "Token Estimate"], parsed.messages.map((message, index) => ({
        Index: index + 1,
        Role: message.role,
        Author: message.author,
        Content: message.content,
        "Token Estimate": estimateTokens(message.content)
      })), 2, usedSheetNames));
    }
    sheets.push(...recipeSheets(recipe, usedSheetNames, parsed));
    if (parsed.artifactHtml) {
      assets.push({ path: "assets/artifact.html", type: "text/html", description: "Original HTML artifact snapshot." });
    }
    notes.push(summaryNote(recipeId, sources, sheets));
  }

  notes.push({
    name: "prompt-recipes.md",
    title: "Prompt Recipes",
    body: recipeCatalogMarkdown()
  });
  notes.push({
    name: "references.md",
    title: "References and Acknowledgements",
    body: referencesMarkdown()
  });

  const estimatedFullTokens = sources.reduce((sum, source) => sum + source.tokenEstimate, 0);
  const estimatedIndexTokens = estimateTokens(JSON.stringify({
    sources: sources.map((source) => ({ title: source.title, type: source.type, tokenEstimate: source.tokenEstimate })),
    sheets: sheets.map((entry) => ({ name: entry.name, rows: entry.rows.length, suggestedRanges: entry.suggestedRanges }))
  }));

  const workbook: ContextWorkbook = {
    version: "0.1",
    id: newWorkbookId(),
    title: sources[0]?.title ?? recipe.title,
    recipe: recipeId,
    createdAt,
    summary: sources[0]?.summary ?? recipe.purpose,
    tokenBudget: {
      estimatedFullTokens,
      estimatedIndexTokens,
      recommendedDefault: "small"
    },
    localFirst: true,
    ai: {
      enabled: false,
      note: "No external model calls are made by default. AI enrichment must be explicit in a future adapter."
    },
    sources,
    sheets: sortSheets(sheets),
    notes,
    assets,
    references: projectReferences,
    readingGuide: recipe.readingGuide
  };

  return workbook;
}

export function parseContent(raw: string, sourceType: string, inputPath = "input"): ParsedContent {
  if (sourceType === "json") {
    const parsedJson = tryParseJson(raw);
    if (parsedJson) return parseJsonContent(parsedJson, inputPath, raw);
  }
  if (sourceType === "html") {
    return parseHtml(raw, inputPath);
  }
  if (sourceType === "csv") {
    const table = parseCsv(raw);
    return {
      title: titleFromPath(inputPath),
      text: raw,
      headings: [{ level: 1, title: titleFromPath(inputPath), content: raw }],
      textBlocks: [{ kind: "csv", text: raw }],
      links: [],
      codeBlocks: [],
      tables: table.columns.length ? [table] : [],
      images: [],
      messages: []
    };
  }
  return parseMarkdownLike(raw, inputPath);
}

function baseSheets(recipeId: RecipeId, recipeTitle: string, sources: WorkbookSource[], used: Set<string>): WorkbookSheet[] {
  return [
    sheet("Overview", "index", "Human and agent entrypoint.", ["Field", "Value"], [
      { Field: "Recipe", Value: recipeId },
      { Field: "Recipe Title", Value: recipeTitle },
      { Field: "Source Count", Value: sources.length },
      { Field: "Full Token Estimate", Value: sources.reduce((sum, source) => sum + source.tokenEstimate, 0) },
      { Field: "Default Reading Mode", Value: "Read manifest first, then CSV sheet ranges." },
      { Field: "Local First", Value: "true" }
    ], 1, used),
    sheet("Sources", "index", "Input sources and provenance.", ["ID", "Type", "Title", "Path", "URL", "Bytes", "Token Estimate", "Summary"], sources.map((source) => ({
      ID: source.id,
      Type: source.type,
      Title: source.title,
      Path: source.path ?? "",
      URL: source.url ?? "",
      Bytes: source.bytes ?? "",
      "Token Estimate": source.tokenEstimate,
      Summary: source.summary ?? ""
    })), 1, used),
    sheet("Reading Guide", "index", "How agents should read this bundle.", ["Step", "Instruction"], [
      { Step: 1, Instruction: "Read manifest.json first." },
      { Step: 2, Instruction: "Choose relevant sheets from the index; avoid loading workbook.xlsx into model context." },
      { Step: 3, Instruction: "Use cwb read --sheet <name> --range <A1:D20> for precise extraction." },
      { Step: 4, Instruction: "Open workbook.xlsx or artifact.html for human review." }
    ], 1, used)
  ];
}

function recipeSheets(recipe: ReturnType<typeof getRecipe>, used: Set<string>, parsed: Pick<ParsedContent, "headings" | "textBlocks" | "links" | "codeBlocks" | "tables" | "images" | "messages">): WorkbookSheet[] {
  return recipe.defaultSheets.filter((template) => !used.has(sanitizeSheetName(template.name))).map((template) => {
    const rows = seedRows(template.name, parsed);
    return sheet(template.name, template.kind, template.description, template.columns, rows, template.priority, used);
  });
}

function seedRows(sheetName: string, parsed: Pick<ParsedContent, "headings" | "textBlocks" | "links" | "codeBlocks" | "tables" | "images" | "messages">): Record<string, CellValue>[] {
  const lower = sheetName.toLowerCase();
  if (lower.includes("claim")) {
    return parsed.headings.slice(0, 12).map((section) => ({
      Claim: section.title,
      Source: "Sections",
      Evidence: truncate(section.content, 220),
      Confidence: "medium"
    }));
  }
  if (lower.includes("risk")) {
    return parsed.headings
      .filter((section) => /risk|gotcha|warning|caution|fail|block/i.test(`${section.title} ${section.content}`))
      .slice(0, 12)
      .map((section) => ({ Risk: section.title, Severity: "TBD", Mitigation: truncate(section.content, 220), Owner: "" }));
  }
  if (lower.includes("question")) {
    return parsed.headings
      .flatMap((section) => section.content.split(/\n+/).filter((line) => line.includes("?")).map((line) => ({ Question: truncate(line, 220), Default: "", "Decision Needed By": "", Owner: "" })))
      .slice(0, 12);
  }
  if (lower.includes("code")) {
    return parsed.codeBlocks.slice(0, 12).map((block, index) => ({ File: "", Lines: "", Snippet: truncate(block.code, 500), "Why It Matters": `Code block ${index + 1}` }));
  }
  if (lower.includes("link")) {
    return parsed.links.slice(0, 20).map((link) => ({ Text: link.text, URL: link.url, Source: "input" }));
  }
  if (lower.includes("message")) {
    return parsed.messages.slice(0, 50).map((message, index) => ({ Index: index + 1, Role: message.role, Author: message.author, Content: message.content, "Token Estimate": estimateTokens(message.content) }));
  }
  if (lower.includes("export")) {
    return [{ Format: "markdown", Content: "No explicit export found yet.", Use: "Agent continuation placeholder" }];
  }
  if (lower.includes("tldr")) {
    return parsed.headings.slice(0, 5).map((section) => ({ Point: section.title, Detail: truncate(section.content, 260), Evidence: "Sections" }));
  }
  if (lower.includes("timeline")) {
    return parsed.headings
      .flatMap((section) => section.content.split(/\n+/).filter((line) => /^\d{1,2}:\d{2}/.test(line)).map((line) => ({ Time: line.slice(0, 5), Event: truncate(line.slice(5), 240), Actor: "", Evidence: section.title })))
      .slice(0, 30);
  }
  if (lower.includes("token")) {
    return parsed.textBlocks.slice(0, 20).map((block) => ({ Group: "text", Name: block.kind, Value: truncate(block.text, 160), Usage: "Extracted text block" }));
  }
  return parsed.headings.slice(0, 10).map((section, index) => ({
    [sheetName.replace(/\s+/g, " ")]: section.title,
    Description: truncate(section.content, 240),
    Notes: index === 0 ? "Seeded from source structure; refine with an agent if needed." : ""
  }));
}

function sheet(name: string, kind: string, description: string, columns: string[], rows: Record<string, CellValue>[], priority: number, used: Set<string>): WorkbookSheet {
  const finalName = uniqueName(sanitizeSheetName(name), used);
  const normalizedColumns = normalizeColumns(columns, rows);
  return {
    name: finalName,
    kind,
    description,
    columns: normalizedColumns,
    rows,
    priority,
    suggestedRanges: [`A1:${columnName(Math.min(normalizedColumns.length, 8))}${Math.min(rows.length + 1, 25)}`]
  };
}

function normalizeColumns(columns: string[], rows: Record<string, CellValue>[]): string[] {
  const seen = new Set(columns);
  for (const row of rows) {
    for (const key of Object.keys(row)) seen.add(key);
  }
  return Array.from(seen);
}

function columnName(index: number): string {
  let n = Math.max(1, index);
  let out = "";
  while (n > 0) {
    n -= 1;
    out = String.fromCharCode(65 + (n % 26)) + out;
    n = Math.floor(n / 26);
  }
  return out;
}

function sortSheets(sheets: WorkbookSheet[]): WorkbookSheet[] {
  return [...sheets].sort((a, b) => a.priority - b.priority || a.name.localeCompare(b.name));
}

function summaryNote(recipeId: RecipeId, sources: WorkbookSource[], sheets: WorkbookSheet[]): { name: string; title: string; body: string } {
  const sheetLines = sheets.map((sheet) => `- ${sheet.name}: ${sheet.rows.length} rows; suggested ${sheet.suggestedRanges.join(", ")}`).join("\n");
  return {
    name: "summary.md",
    title: "Bundle Summary",
    body: `# Bundle Summary\n\nRecipe: ${recipeId}\n\nSources:\n${sources.map((source) => `- ${source.title} (${source.type}, ~${source.tokenEstimate} tokens)`).join("\n")}\n\nSheets:\n${sheetLines}\n\nAgent protocol: read manifest.json first, then use CSV sheet ranges.`
  };
}

function referencesMarkdown(): string {
  return `# References and Acknowledgements\n\nContext Workbook is independently implemented, but its motivating examples and several workflow patterns are inspired by:\n\n${projectReferences.map((reference) => `- ${reference.author ? `${reference.author}, ` : ""}[${reference.title}](${reference.url}) — ${reference.note}`).join("\n")}\n\nThis project is not affiliated with or endorsed by Thariq Shihipar, Anthropic, X, or GitHub.\n`;
}

function parseMarkdownLike(raw: string, inputPath: string): ParsedContent {
  const codeBlocks: Array<{ language: string; code: string }> = [];
  const images = extractMarkdownImages(raw);
  const rawWithoutImages = raw.replace(/!\[[^\]]*]\([^)]+\)/g, "");
  let textWithoutCode = rawWithoutImages.replace(/```([A-Za-z0-9_-]*)\n([\s\S]*?)```/g, (_match, language, code) => {
    codeBlocks.push({ language, code: code.trim() });
    return `\n[code block: ${language || "text"}]\n`;
  });
  const links = extractMarkdownLinks(rawWithoutImages);
  const tables = extractMarkdownTables(rawWithoutImages);
  const headings = splitHeadings(textWithoutCode, titleFromPath(inputPath));
  const textBlocks = extractMarkdownTextBlocks(textWithoutCode);
  return {
    title: firstHeading(raw) ?? titleFromPath(inputPath),
    text: textWithoutCode,
    headings,
    textBlocks,
    links,
    codeBlocks,
    tables,
    images,
    messages: parseLooseMessages(raw)
  };
}

function parseHtml(raw: string, inputPath: string): ParsedContent {
  const title = raw.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim()
    || raw.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]?.replace(/<[^>]+>/g, "").trim()
    || titleFromPath(inputPath);
  const links = [...raw.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)].map((match) => ({
    url: match[1],
    text: truncate(match[2].replace(/<[^>]+>/g, " "), 120)
  }));
  const codeBlocks = extractHtmlCodeBlocks(raw);
  const images = extractHtmlImages(raw);
  const tables = extractHtmlTables(raw);
  const headingMatches = [...raw.matchAll(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi)].map((match) => ({
    level: Number(match[1]),
    title: decodeHtml(match[2].replace(/<[^>]+>/g, " ")).trim(),
    index: match.index ?? 0
  }));
  const plain = htmlToText(raw);
  const headings = headingMatches.length
    ? headingMatches.map((heading, index) => {
        const next = headingMatches[index + 1]?.index ?? raw.length;
        return {
          level: heading.level,
          title: heading.title,
          content: truncate(htmlToText(raw.slice(heading.index, next)), 1600)
        };
      })
    : splitHeadings(plain, title);
  return {
    title,
    text: plain,
    headings,
    textBlocks: extractHtmlTextBlocks(raw),
    links,
    codeBlocks,
    tables,
    images,
    messages: parseLooseMessages(plain),
    artifactHtml: raw
  };
}

function parseJsonContent(value: unknown, inputPath: string, raw: string): ParsedContent {
  const title = titleFromPath(inputPath);
  const messages = extractJsonMessages(value);
  const rows = Array.isArray(value) && value.every((entry) => entry && typeof entry === "object" && !Array.isArray(entry))
    ? value as Record<string, unknown>[]
    : [];
  const tables = rows.length > 0 ? [jsonRowsToTable(rows)] : [];
  return {
    title,
    text: raw,
    headings: [{ level: 1, title, content: truncate(raw, 1800) }],
    textBlocks: [{ kind: "json", text: truncate(raw, 1800) }],
    links: [],
    codeBlocks: [],
    tables,
    images: [],
    messages
  };
}

function tryParseJson(raw: string): unknown | null {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function extractJsonMessages(value: unknown): Array<{ role: string; author: string; content: string }> {
  const candidates = Array.isArray(value)
    ? value
    : value && typeof value === "object" && Array.isArray((value as { messages?: unknown }).messages)
      ? (value as { messages: unknown[] }).messages
      : [];
  return candidates
    .filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === "object" && !Array.isArray(entry))
    .map((entry) => ({
      role: String(entry.role ?? entry.type ?? "message"),
      author: String(entry.author ?? entry.name ?? entry.role ?? ""),
      content: String(entry.content ?? entry.text ?? entry.message ?? "")
    }))
    .filter((message) => message.content.trim());
}

function parseLooseMessages(raw: string): Array<{ role: string; author: string; content: string }> {
  const lines = raw.split(/\n+/);
  const messages = [];
  for (const line of lines) {
    const match = line.match(/^(user|assistant|system|human|ai|bot|developer|author)\s*[:：]\s*(.+)$/i);
    if (match) {
      messages.push({ role: match[1].toLowerCase(), author: match[1], content: match[2].trim() });
    }
  }
  return messages;
}

function splitHeadings(text: string, fallbackTitle: string): Array<{ level: number; title: string; content: string }> {
  const lines = text.split(/\r?\n/);
  const sections: Array<{ level: number; title: string; content: string[] }> = [];
  let current = { level: 1, title: fallbackTitle, content: [] as string[] };
  for (const line of lines) {
    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      if (current.content.join("").trim() || sections.length === 0) sections.push(current);
      current = { level: heading[1].length, title: heading[2].trim(), content: [] };
    } else {
      current.content.push(line);
    }
  }
  if (current.content.join("").trim() || sections.length === 0) sections.push(current);
  return sections
    .map((section) => ({ level: section.level, title: section.title, content: section.content.join("\n").trim() }))
    .filter((section) => section.title || section.content);
}

function firstHeading(raw: string): string | null {
  return raw.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? null;
}

function extractMarkdownLinks(raw: string): Array<{ text: string; url: string }> {
  const links = [...raw.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g)].map((match) => ({ text: match[1], url: match[2] }));
  const bare = [...raw.matchAll(/https?:\/\/[^\s)]+/g)].map((match) => ({ text: match[0], url: match[0] }));
  return [...links, ...bare].slice(0, 200);
}

function extractMarkdownImages(raw: string): Array<{ src: string; alt: string; title: string; width: string; height: string; sourceSet: string; kind: string }> {
  return [...raw.matchAll(/!\[([^\]]*)]\(([^)\s]+)(?:\s+"([^"]+)")?\)/g)].map((match) => ({
    alt: match[1] ?? "",
    src: match[2] ?? "",
    title: match[3] ?? "",
    width: "",
    height: "",
    sourceSet: "",
    kind: "markdown-image"
  }));
}

function extractMarkdownTextBlocks(raw: string): Array<{ kind: string; text: string }> {
  return raw
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter((block) => block && !block.startsWith("|") && !/^#{1,6}\s/.test(block))
    .map((block) => ({
      kind: /^[-*]\s/m.test(block) || /^\d+\.\s/m.test(block) ? "list" : "paragraph",
      text: block.replace(/\n/g, " ")
    }))
    .filter((block) => block.text.length > 0);
}

function extractMarkdownTables(raw: string): Array<{ columns: string[]; rows: string[][] }> {
  const lines = raw.split(/\r?\n/);
  const tables = [];
  for (let i = 0; i < lines.length - 1; i += 1) {
    if (!lines[i].includes("|") || !/^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(lines[i + 1])) continue;
    const columns = splitTableRow(lines[i]);
    const rows = [];
    i += 2;
    while (i < lines.length && lines[i].includes("|") && lines[i].trim()) {
      rows.push(splitTableRow(lines[i]));
      i += 1;
    }
    tables.push({ columns, rows });
  }
  return tables;
}

function splitTableRow(line: string): string[] {
  return line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cell.trim());
}

function parseCsv(raw: string): { columns: string[]; rows: string[][] } {
  const rows = raw.split(/\r?\n/).filter(Boolean).map((line) => splitCsvLine(line));
  return { columns: rows[0] ?? [], rows: rows.slice(1) };
}

function splitCsvLine(line: string): string[] {
  const cells = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"' && line[i + 1] === '"') {
      current += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      cells.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current);
  return cells;
}

function flattenTables(tables: Array<{ columns: string[]; rows: string[][] }>): Record<string, CellValue>[] {
  return tables.flatMap((table, tableIndex) => table.rows.flatMap((row, rowIndex) => table.columns.map((column, columnIndex) => ({
    Table: tableIndex + 1,
    Row: rowIndex + 1,
    Column: column,
    Value: row[columnIndex] ?? ""
  }))));
}

function jsonRowsToTable(rows: Record<string, unknown>[]): { columns: string[]; rows: string[][] } {
  const columns = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
  return { columns, rows: rows.map((row) => columns.map((column) => String(row[column] ?? ""))) };
}

function extractHtmlImages(raw: string): Array<{ src: string; alt: string; title: string; width: string; height: string; sourceSet: string; kind: string }> {
  return [...raw.matchAll(/<img\b([^>]*)>/gi)].map((match) => {
    const attrs = parseAttrs(match[1]);
    return {
      src: attrs.src ?? "",
      alt: attrs.alt ?? "",
      title: attrs.title ?? "",
      width: attrs.width ?? "",
      height: attrs.height ?? "",
      sourceSet: attrs.srcset ?? "",
      kind: attrs.src?.startsWith("data:") ? "embedded-image" : "html-image"
    };
  }).filter((image) => image.src || image.sourceSet || image.alt);
}

function extractHtmlCodeBlocks(raw: string): Array<{ language: string; code: string }> {
  const blocks: Array<{ language: string; code: string }> = [];
  for (const match of raw.matchAll(/<pre\b([^>]*)>([\s\S]*?)<\/pre>/gi)) {
    const preAttrs = parseAttrs(match[1]);
    const inner = match[2];
    const codeMatch = inner.match(/<code\b([^>]*)>([\s\S]*?)<\/code>/i);
    const codeAttrs = codeMatch ? parseAttrs(codeMatch[1]) : {};
    const language = languageFromAttrs(codeAttrs) || languageFromAttrs(preAttrs) || "text";
    const code = decodeHtml((codeMatch ? codeMatch[2] : inner).replace(/<[^>]+>/g, " ")).trim();
    if (code) blocks.push({ language, code });
  }
  for (const match of raw.matchAll(/<code\b([^>]*)>([\s\S]*?)<\/code>/gi)) {
    const code = decodeHtml(match[2].replace(/<[^>]+>/g, " ")).trim();
    if (code && !blocks.some((block) => block.code === code)) {
      blocks.push({ language: languageFromAttrs(parseAttrs(match[1])) || "text", code });
    }
  }
  return blocks;
}

function extractHtmlTables(raw: string): Array<{ columns: string[]; rows: string[][] }> {
  return [...raw.matchAll(/<table\b[^>]*>([\s\S]*?)<\/table>/gi)].map((tableMatch) => {
    const rowMatches = [...tableMatch[1].matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)];
    const grid = rowMatches.map((rowMatch) => [...rowMatch[1].matchAll(/<(th|td)\b[^>]*>([\s\S]*?)<\/\1>/gi)].map((cellMatch) => cleanHtmlText(cellMatch[2])));
    const headerRow = rowMatches.find((rowMatch) => /<th\b/i.test(rowMatch[1]));
    let columns = headerRow
      ? [...headerRow[1].matchAll(/<th\b[^>]*>([\s\S]*?)<\/th>/gi)].map((cellMatch) => cleanHtmlText(cellMatch[1]))
      : grid[0] ?? [];
    if (columns.length === 0) {
      const maxCells = Math.max(...grid.map((row) => row.length), 0);
      columns = Array.from({ length: maxCells }, (_, index) => `Column ${index + 1}`);
    }
    const rows = headerRow ? grid.filter((row) => row.join("\u0000") !== columns.join("\u0000")) : grid.slice(1);
    return { columns, rows };
  }).filter((table) => table.columns.length > 0);
}

function extractHtmlTextBlocks(raw: string): Array<{ kind: string; text: string }> {
  const blocks: Array<{ kind: string; text: string }> = [];
  for (const match of raw.matchAll(/<(p|li|figcaption|blockquote|h[1-6])\b[^>]*>([\s\S]*?)<\/\1>/gi)) {
    const text = cleanHtmlText(match[2]);
    if (text) blocks.push({ kind: match[1].toLowerCase(), text });
  }
  return blocks;
}

function parseAttrs(raw: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  for (const match of raw.matchAll(/([:@A-Za-z0-9_-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g)) {
    attrs[match[1].toLowerCase()] = decodeHtml(match[2] ?? match[3] ?? match[4] ?? "");
  }
  return attrs;
}

function languageFromAttrs(attrs: Record<string, string>): string {
  const raw = `${attrs.class ?? ""} ${attrs["data-language"] ?? ""}`.trim();
  return raw.match(/language-([A-Za-z0-9_-]+)/)?.[1] ?? raw.match(/lang-([A-Za-z0-9_-]+)/)?.[1] ?? raw;
}

function cleanHtmlText(raw: string): string {
  return decodeHtml(raw.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function htmlToText(raw: string): string {
  return decodeHtml(raw
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<\/(h[1-6]|p|div|section|article|li|tr)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim());
}

function decodeHtml(value: string): string {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

async function parseDirectory(root: string): Promise<{
  fileSummaries: Array<{ path: string; extension: string; lines: number; bytes: number; preview: string }>;
  directories: Record<string, CellValue>[];
  totalBytes: number;
  totalTokens: number;
}> {
  const fileSummaries = [];
  const dirStats = new Map<string, { files: number; bytes: number }>();
  const paths = await walk(root);
  let totalBytes = 0;
  let totalTokens = 0;
  for (const filePath of paths) {
    const extension = extname(filePath).toLowerCase() || "(none)";
    if (!codeExts.has(extension)) continue;
    const fileStat = await stat(filePath);
    if (fileStat.size > 200_000) continue;
    const raw = await readFile(filePath, "utf8").catch(() => "");
    const rel = relative(root, filePath);
    const dir = rel.includes("/") ? rel.slice(0, rel.lastIndexOf("/")) : ".";
    const entry = dirStats.get(dir) ?? { files: 0, bytes: 0 };
    entry.files += 1;
    entry.bytes += fileStat.size;
    dirStats.set(dir, entry);
    totalBytes += fileStat.size;
    totalTokens += estimateTokens(raw);
    fileSummaries.push({
      path: rel,
      extension,
      lines: raw ? raw.split(/\r?\n/).length : 0,
      bytes: fileStat.size,
      preview: summarizeFile(raw)
    });
  }
  const directories = [...dirStats.entries()].map(([directory, value]) => ({ Directory: directory, Files: value.files, Bytes: value.bytes }));
  return { fileSummaries: fileSummaries.slice(0, 500), directories, totalBytes, totalTokens };
}

async function walk(dir: string): Promise<string[]> {
  const out: string[] = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith(".") && entry.name !== ".env.example") continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!ignoreDirs.has(entry.name)) out.push(...await walk(path));
    } else if (entry.isFile()) {
      out.push(path);
    }
  }
  return out;
}

function summarizeFile(raw: string): string {
  const lines = raw.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const interesting = lines.find((line) => /^(export |function |class |interface |type |const |#|create table|router\.|describe\()/.test(line));
  return truncate(interesting ?? lines.slice(0, 4).join(" "), 300);
}
