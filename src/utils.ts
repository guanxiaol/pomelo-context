import { createHash, randomUUID } from "node:crypto";
import { basename, extname } from "node:path";

export function nowIso(): string {
  return new Date().toISOString();
}

export function stableId(input: string): string {
  return createHash("sha1").update(input).digest("hex").slice(0, 12);
}

export function newWorkbookId(): string {
  return `cwb_${randomUUID().replace(/-/g, "").slice(0, 16)}`;
}

export function estimateTokens(text: string): number {
  if (!text) return 0;
  const asciiWords = text.match(/[A-Za-z0-9_]+/g)?.length ?? 0;
  const nonAscii = Array.from(text.replace(/[A-Za-z0-9_\s]/g, "")).length;
  const punctuation = Math.ceil((text.match(/[^\w\s]/g)?.length ?? 0) / 4);
  return Math.max(1, Math.ceil(asciiWords * 1.25 + nonAscii * 0.8 + punctuation));
}

export function sourceTypeForPath(path: string): "html" | "markdown" | "text" | "json" | "csv" | "unknown" {
  const ext = extname(path).toLowerCase();
  if ([".html", ".htm"].includes(ext)) return "html";
  if ([".md", ".markdown", ".mdx"].includes(ext)) return "markdown";
  if (ext === ".json") return "json";
  if ([".csv", ".tsv"].includes(ext)) return "csv";
  if ([".txt", ".log"].includes(ext)) return "text";
  return "unknown";
}

export function titleFromPath(path: string): string {
  return basename(path).replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ");
}

export function sanitizeSheetName(name: string): string {
  const cleaned = name.replace(/[\\/?*[\]:]/g, " ").replace(/\s+/g, " ").trim();
  return (cleaned || "Sheet").slice(0, 31);
}

export function safeFileSegment(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "sheet";
}

export function truncate(text: string, max = 240): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  return cleaned.length <= max ? cleaned : `${cleaned.slice(0, max - 1)}...`;
}

export function xmlEscape(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function htmlEscape(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function uniqueName(base: string, used: Set<string>): string {
  let candidate = sanitizeSheetName(base);
  let index = 2;
  while (used.has(candidate)) {
    const suffix = ` ${index}`;
    candidate = sanitizeSheetName(`${base.slice(0, 31 - suffix.length)}${suffix}`);
    index += 1;
  }
  used.add(candidate);
  return candidate;
}
