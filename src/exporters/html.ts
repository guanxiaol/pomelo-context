import type { ContextWorkbook, WorkbookSheet } from "../types.ts";
import { htmlEscape } from "../utils.ts";

export function workbookToHtml(workbook: ContextWorkbook): string {
  const nav = workbook.sheets.map((sheet) => `<a href="#${id(sheet.name)}">${htmlEscape(sheet.name)}</a>`).join("");
  const sections = workbook.sheets.map(sheetToHtml).join("\n");
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${htmlEscape(workbook.title)}</title>
  <style>
    :root { color-scheme: light; --ink:#171717; --muted:#6b7280; --line:#d7d7d2; --paper:#fbfaf7; --accent:#d97757; --soft:#f0eee6; }
    body { margin:0; font:14px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; color:var(--ink); background:var(--paper); }
    header { padding:42px max(24px,8vw) 24px; border-bottom:1px solid var(--line); background:#fff; }
    h1 { margin:0 0 10px; font-size:36px; line-height:1.1; }
    .summary { max-width:860px; color:#3f3f3a; font-size:16px; }
    nav { display:flex; flex-wrap:wrap; gap:8px; margin-top:24px; }
    nav a { color:var(--ink); text-decoration:none; border:1px solid var(--line); border-radius:999px; padding:6px 10px; background:#fff; }
    main { padding:28px max(24px,8vw) 60px; }
    section { margin:0 0 38px; }
    h2 { font-size:22px; margin:0 0 6px; }
    .meta { color:var(--muted); margin-bottom:12px; }
    table { width:100%; border-collapse:collapse; background:#fff; border:1px solid var(--line); }
    th, td { border-bottom:1px solid var(--line); padding:8px 10px; vertical-align:top; text-align:left; }
    th { background:var(--soft); font-size:12px; text-transform:uppercase; letter-spacing:.04em; }
    td { max-width:520px; }
    code { background:var(--soft); padding:2px 4px; border-radius:4px; }
  </style>
</head>
<body>
  <header>
    <h1>${htmlEscape(workbook.title)}</h1>
    <div class="summary">${htmlEscape(workbook.summary)}</div>
    <p class="meta">Recipe: <code>${htmlEscape(workbook.recipe)}</code> · Generated ${htmlEscape(workbook.createdAt)} · Local-first</p>
    <nav>${nav}</nav>
  </header>
  <main>${sections}</main>
</body>
</html>`;
}

function sheetToHtml(sheet: WorkbookSheet): string {
  const headers = sheet.columns.map((column) => `<th>${htmlEscape(column)}</th>`).join("");
  const body = sheet.rows.slice(0, 200).map((row) => `<tr>${sheet.columns.map((column) => `<td>${htmlEscape(row[column] ?? "")}</td>`).join("")}</tr>`).join("\n");
  return `<section id="${id(sheet.name)}">
  <h2>${htmlEscape(sheet.name)}</h2>
  <div class="meta">${htmlEscape(sheet.description)} · ${sheet.rows.length} rows · suggested ${htmlEscape(sheet.suggestedRanges.join(", "))}</div>
  <table>
    <thead><tr>${headers}</tr></thead>
    <tbody>${body}</tbody>
  </table>
</section>`;
}

function id(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
