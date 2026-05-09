import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { buildWorkbook } from "./parser.ts";
import type { ContextWorkbook, RecipeId, WorkbookSheet } from "./types.ts";
import { estimateTokens, htmlEscape, safeFileSegment } from "./utils.ts";
import { writeBundle } from "./bundle.ts";

type MethodId = "markdown-full" | "html-source" | "cwb-small";

interface ExperimentFact {
  id: string;
  description: string;
  mustContain: string[];
}

interface ExperimentScenario {
  id: string;
  title: string;
  recipe: RecipeId;
  sourceMarkdown: string;
  facts: ExperimentFact[];
}

export interface ExperimentRow {
  scenarioId: string;
  scenarioTitle: string;
  method: MethodId;
  tokens: number;
  accuracy: number;
  factsFound: number;
  factsTotal: number;
  structureScore: number;
  efficiency: number;
}

export interface ExperimentOutput {
  rows: ExperimentRow[];
  averages: Record<MethodId, {
    tokens: number;
    accuracy: number;
    structureScore: number;
    efficiency: number;
  }>;
}

const filler = `Background notes: this section includes implementation context, alternatives considered, historical notes, and discussion that a human may want later but an agent should not read by default. The purpose of the experiment is to see whether the retrieval path can preserve the facts while skipping this lower-priority prose.`;

export const experimentScenarios: ExperimentScenario[] = [
  {
    id: "implementation-plan",
    title: "Checkout Animation Implementation Plan",
    recipe: "implementation-plan",
    sourceMarkdown: `# Checkout Animation Implementation Plan

## Goal
Ship the checkout button animation behind feature flag FLAG_CHECKOUT_ANIM_V2. Success requires p95 click latency below 120ms and zero layout shift.

${repeat(filler, 8)}

## Milestones
Milestone M1 is prototype tuning, M2 is React integration, and M3 is production rollout. The owner is Design Systems.

${repeat(filler, 8)}

## Risk
Risk R1 is motion sickness for reduced-motion users. Mitigation is to respect prefers-reduced-motion and fall back to a static purple state.

${repeat(filler, 8)}

## Open Question
Question Q1 is whether the final easing should be cubic-bezier(0.2, 0.8, 0.2, 1) or spring-like.
`,
    facts: [
      { id: "flag", description: "Feature flag name", mustContain: ["FLAG_CHECKOUT_ANIM_V2"] },
      { id: "latency", description: "Latency target", mustContain: ["120ms"] },
      { id: "risk", description: "Reduced motion mitigation", mustContain: ["prefers-reduced-motion", "static purple state"] },
      { id: "owner", description: "Owner", mustContain: ["Design Systems"] },
      { id: "easing", description: "Open easing question", mustContain: ["cubic-bezier(0.2, 0.8, 0.2, 1)"] }
    ]
  },
  {
    id: "pr-review",
    title: "Streaming Backpressure PR Review",
    recipe: "annotated-pr-review",
    sourceMarkdown: `# Streaming Backpressure PR Review

## Summary
The PR changes stream flushing in src/stream/writer.ts and introduces MAX_IN_FLIGHT_CHUNKS=32.

${repeat(filler, 8)}

## Finding
Severity P1: abort signals are not forwarded to the retry loop. The fix is to pass AbortSignal into retryWithBackoff.

${repeat(filler, 8)}

## Finding
Severity P2: queue depth metrics are emitted after await writer.flush(), which hides stalls. Emit queue_depth before flush.

${repeat(filler, 8)}

## Test Gap
Add a slow-consumer test that asserts backpressure pauses reads after 32 chunks.
`,
    facts: [
      { id: "file", description: "Changed file", mustContain: ["src/stream/writer.ts"] },
      { id: "limit", description: "Chunk limit", mustContain: ["MAX_IN_FLIGHT_CHUNKS=32"] },
      { id: "p1", description: "P1 issue", mustContain: ["abort signals", "retryWithBackoff"] },
      { id: "p2", description: "P2 metric issue", mustContain: ["queue_depth", "before flush"] },
      { id: "test", description: "Required test", mustContain: ["slow-consumer test", "32 chunks"] }
    ]
  },
  {
    id: "custom-editor",
    title: "Feature Flag Editor Export",
    recipe: "custom-editor-export",
    sourceMarkdown: `# Feature Flag Editor Export

## Editor State
Flag enable_new_onboarding is ON for beta users and OFF for everyone else. It depends on auth_session_v3.

${repeat(filler, 8)}

## Validation
Warning W1: enabling enable_new_onboarding while auth_session_v3 is OFF is invalid.

${repeat(filler, 8)}

## Export
Export JSON must include {"enable_new_onboarding":"beta","auth_session_v3":true}. Export diff must only include changed keys.

${repeat(filler, 8)}

## Decision
The final bucket is Now, not Next, because the launch is tied to the Monday onboarding review.
`,
    facts: [
      { id: "flag", description: "Primary flag", mustContain: ["enable_new_onboarding"] },
      { id: "dependency", description: "Dependency", mustContain: ["auth_session_v3"] },
      { id: "warning", description: "Validation warning", mustContain: ["Warning W1"] },
      { id: "json", description: "Export JSON", mustContain: ["\"enable_new_onboarding\":\"beta\"", "\"auth_session_v3\":true"] },
      { id: "bucket", description: "Final bucket", mustContain: ["Now", "Monday onboarding review"] }
    ]
  },
  {
    id: "web-archive",
    title: "HTML Artifact Article Archive",
    recipe: "web-or-chat-archive",
    sourceMarkdown: `# HTML Artifact Article Archive

## Claim
The central claim is that HTML improves information density, visual clarity, sharing, and two-way interaction compared with long Markdown files.

${repeat(filler, 8)}

## Use Cases
The article's major use cases are specs and planning, code review, design prototypes, research reports, and custom editing interfaces.

${repeat(filler, 8)}

## Export Pattern
Custom editing interfaces should end with an export button that copies JSON, diff, markdown, or prompt text back into the agent.

${repeat(filler, 8)}

## Workbook Extension
Context Workbook keeps the rich human artifact while adding manifest-first reading, CSV ranges, provenance, and token budgets.
`,
    facts: [
      { id: "claim", description: "HTML advantages", mustContain: ["information density", "visual clarity", "two-way interaction"] },
      { id: "usecases", description: "Use cases", mustContain: ["code review", "custom editing interfaces"] },
      { id: "export", description: "Export pattern", mustContain: ["JSON", "diff", "markdown", "prompt"] },
      { id: "manifest", description: "Workbook reading", mustContain: ["manifest-first reading", "CSV ranges"] },
      { id: "budget", description: "Token budgets", mustContain: ["token budgets"] }
    ]
  }
];

export async function runExperiment(outDir: string): Promise<ExperimentOutput> {
  await mkdir(outDir, { recursive: true });
  const fixtureDir = join(outDir, "fixtures");
  const bundleDir = join(outDir, "bundles");
  await mkdir(fixtureDir, { recursive: true });
  await mkdir(bundleDir, { recursive: true });

  const rows: ExperimentRow[] = [];
  for (const scenario of experimentScenarios) {
    const sourcePath = join(fixtureDir, `${scenario.id}.md`);
    await writeFile(sourcePath, scenario.sourceMarkdown);
    const workbook = await buildWorkbook(sourcePath, scenario.recipe);
    await writeBundle(workbook, join(bundleDir, `${scenario.id}.cwb`), sourcePath, new Set(["xlsx", "json", "md", "csv", "html"]));

    const markdownConsumer = scenario.sourceMarkdown;
    const htmlConsumer = scenarioToHtml(scenario);
    const cwbConsumer = cwbSmallConsumerText(workbook);

    rows.push(scoreMethod(scenario, "markdown-full", markdownConsumer, structureMarkdown(scenario.sourceMarkdown)));
    rows.push(scoreMethod(scenario, "html-source", htmlConsumer, structureHtml(htmlConsumer)));
    rows.push(scoreMethod(scenario, "cwb-small", cwbConsumer, structureCwb(workbook)));
  }

  const output = { rows, averages: averageRows(rows) };
  await writeFile(join(outDir, "experiment-summary.csv"), rowsToCsv(rows));
  await writeFile(join(outDir, "experiment-report.md"), experimentToMarkdown(output));
  await writeFile(join(outDir, "experiment-report.html"), experimentToHtml(output));
  await writeFile(join(outDir, "experiment-results.json"), JSON.stringify(output, null, 2));
  return output;
}

function scoreMethod(scenario: ExperimentScenario, method: MethodId, consumerText: string, structureScore: number): ExperimentRow {
  const normalized = normalize(consumerText);
  const factsFound = scenario.facts.filter((fact) => fact.mustContain.every((needle) => normalized.includes(normalize(needle)))).length;
  const accuracy = factsFound / scenario.facts.length;
  const tokens = estimateTokens(consumerText);
  return {
    scenarioId: scenario.id,
    scenarioTitle: scenario.title,
    method,
    tokens,
    accuracy,
    factsFound,
    factsTotal: scenario.facts.length,
    structureScore,
    efficiency: tokens > 0 ? (accuracy * 1000) / tokens : 0
  };
}

function cwbSmallConsumerText(workbook: ContextWorkbook): string {
  const manifest = {
    title: workbook.title,
    recipe: workbook.recipe,
    summary: workbook.summary,
    sheets: workbook.sheets.map((sheet) => ({
      name: sheet.name,
      rows: sheet.rows.length,
      suggestedRanges: sheet.suggestedRanges
    }))
  };
  const targetSheets = chooseSmallReadSheets(workbook);
  const sheetText = targetSheets
    .map((sheet) => sheetPreview(sheet, 12))
    .join("\n\n");
  return `manifest.json\n${JSON.stringify(manifest)}\n\n${sheetText}`;
}

function chooseSmallReadSheets(workbook: ContextWorkbook): WorkbookSheet[] {
  const preferred = ["Sections", "Claims", "Findings", "Exports", "TLDR", "Milestones"];
  for (const name of preferred) {
    const sheet = workbook.sheets.find((entry) => entry.name === name && entry.rows.length > 0);
    if (sheet) return [sheet];
  }
  return workbook.sheets.filter((sheet) => sheet.priority <= 2).slice(0, 1);
}

function sheetPreview(sheet: WorkbookSheet, maxRows: number): string {
  return [
    `# ${sheet.name}`,
    sheet.description,
    sheet.columns.join(","),
    sheet.rows.slice(0, maxRows).map((row) => JSON.stringify(row)).join("\n")
  ].join("\n");
}

function scenarioToHtml(scenario: ExperimentScenario): string {
  const body = scenario.sourceMarkdown
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/^## (.+)$/gm, "<section class=\"panel\"><h2>$1</h2>")
    .split(/\n\n+/)
    .map((block) => block.startsWith("<") ? block : `<p>${htmlEscape(block)}</p>`)
    .join("\n");
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${htmlEscape(scenario.title)}</title>
  <style>
    body { font-family: Inter, system-ui, sans-serif; margin: 0; background: #fbfaf7; color: #171717; }
    header { padding: 48px 8vw 24px; background: white; border-bottom: 1px solid #d7d7d2; }
    main { padding: 28px 8vw; display: grid; gap: 18px; }
    .panel { border: 1px solid #d7d7d2; background: white; padding: 18px; border-radius: 8px; }
    h1 { font-size: 42px; line-height: 1.05; margin: 0 0 12px; }
    h2 { color: #b65f43; }
    p { max-width: 74ch; }
  </style>
</head>
<body>
  <header><h1>${htmlEscape(scenario.title)}</h1><p>Self-contained HTML artifact for visual review.</p></header>
  <main>${body}</main>
</body>
</html>`;
}

function experimentToMarkdown(output: ExperimentOutput): string {
  const markdown = output.averages["markdown-full"];
  const html = output.averages["html-source"];
  const cwb = output.averages["cwb-small"];
  const scenarioCount = new Set(output.rows.map((row) => row.scenarioId)).size;
  const savingVsMarkdown = (1 - cwb.tokens / markdown.tokens) * 100;
  const savingVsHtml = (1 - cwb.tokens / html.tokens) * 100;
  const summaryRows = methodOrder().map((method) => {
    const avg = output.averages[method];
    return `| ${method} | ${avg.tokens.toFixed(0)} | ${(avg.accuracy * 100).toFixed(1)}% | ${avg.structureScore.toFixed(1)} | ${avg.efficiency.toFixed(3)} |`;
  }).join("\n");
  const detailRows = output.rows.map((row) =>
    `| ${row.scenarioId} | ${row.method} | ${row.tokens} | ${(row.accuracy * 100).toFixed(1)}% | ${row.factsFound}/${row.factsTotal} | ${row.structureScore} | ${row.efficiency.toFixed(3)} |`
  ).join("\n");
  return `# Context Workbook Experiment Report

![Pomelo Context Workbook experiment results](../../assets/experiment-results.png)

中文摘要：在 ${scenarioCount} 个确定性样例场景中，Pomelo CWB small-read 用 \`${cwb.tokens.toFixed(0)}\` 平均 token 达到 \`${(cwb.accuracy * 100).toFixed(1)}%\` 必要事实覆盖准确率，比完整 Markdown 少 \`${savingVsMarkdown.toFixed(1)}%\` token，比原始 HTML source 少 \`${savingVsHtml.toFixed(1)}%\` token。该实验用于验证方向，可复现，但不代表所有材料的绝对结论。

## Method

This experiment compares three context-transfer paths:

- \`markdown-full\`: a traditional linear Markdown document read in full.
- \`html-source\`: a self-contained HTML artifact read as source text by an agent.
- \`cwb-small\`: Context Workbook manifest plus high-priority CSV sheet ranges.

Accuracy is deterministic fact coverage: a required fact is counted as conveyed only when all required exact markers appear in the consumed context. Structure score is a deterministic navigation proxy from 0 to 100.

## Average Results

| Method | Avg Tokens | Fact Accuracy | Structure Score | Accuracy per 1K Tokens |
| --- | ---: | ---: | ---: | ---: |
${summaryRows}

## Scenario Results

| Scenario | Method | Tokens | Fact Accuracy | Facts | Structure | Accuracy per 1K Tokens |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
${detailRows}

## Interpretation

HTML source preserves facts well and improves visual structure for humans, but raw HTML carries tag and style overhead when used as model context. Markdown is compact and accurate for small linear documents. Context Workbook is strongest when the agent does not need the whole document: it preserves the required facts in indexed sheets while skipping low-priority prose.
`;
}

function experimentToHtml(output: ExperimentOutput): string {
  const markdown = output.averages["markdown-full"];
  const html = output.averages["html-source"];
  const cwb = output.averages["cwb-small"];
  const scenarioCount = new Set(output.rows.map((row) => row.scenarioId)).size;
  const savingVsMarkdown = (1 - cwb.tokens / markdown.tokens) * 100;
  const savingVsHtml = (1 - cwb.tokens / html.tokens) * 100;
  const tokenData = methodOrder().map((method) => ({ label: method, value: output.averages[method].tokens }));
  const accuracyData = methodOrder().map((method) => ({ label: method, value: output.averages[method].accuracy * 100 }));
  const efficiencyData = methodOrder().map((method) => ({ label: method, value: output.averages[method].efficiency }));
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Context Workbook Experiment Report</title>
  <style>
    body { margin: 0; font: 14px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #171717; background: #fbfaf7; }
    header { padding: 42px max(24px, 8vw); background: white; border-bottom: 1px solid #d7d7d2; }
    main { padding: 28px max(24px, 8vw) 60px; display: grid; gap: 28px; }
    h1 { margin: 0 0 8px; font-size: 36px; }
    section { background: white; border: 1px solid #d7d7d2; padding: 20px; border-radius: 8px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border-bottom: 1px solid #e7e5df; padding: 8px; text-align: left; }
    th { background: #f0eee6; }
    svg { width: 100%; height: auto; }
    .hero-image { width: min(100%, 1100px); border: 1px solid #d7d7d2; border-radius: 8px; display: block; }
  </style>
</head>
<body>
  <header>
    <h1>Context Workbook Experiment Report</h1>
    <p>Markdown vs raw HTML artifact vs Context Workbook small-read path.</p>
    <p>中文摘要：${scenarioCount} 个确定性样例中，Pomelo CWB small-read 平均 ${cwb.tokens.toFixed(0)} tokens，事实覆盖准确率 ${(cwb.accuracy * 100).toFixed(1)}%，比完整 Markdown 少 ${savingVsMarkdown.toFixed(1)}% token，比原始 HTML source 少 ${savingVsHtml.toFixed(1)}% token。</p>
  </header>
  <main>
    <section><h2>Experiment Image / 实验图</h2><img class="hero-image" src="../../assets/experiment-results.png" alt="Pomelo Context Workbook experiment results"></section>
    <section><h2>Average Token Cost</h2>${barChart(tokenData, "tokens", false)}</section>
    <section><h2>Fact Accuracy</h2>${barChart(accuracyData, "%", true)}</section>
    <section><h2>Accuracy per 1K Tokens</h2>${barChart(efficiencyData, "score", false)}</section>
    <section>
      <h2>Detailed Results</h2>
      <table>
        <thead><tr><th>Scenario</th><th>Method</th><th>Tokens</th><th>Accuracy</th><th>Facts</th><th>Structure</th><th>Efficiency</th></tr></thead>
        <tbody>
          ${output.rows.map((row) => `<tr><td>${htmlEscape(row.scenarioId)}</td><td>${row.method}</td><td>${row.tokens}</td><td>${(row.accuracy * 100).toFixed(1)}%</td><td>${row.factsFound}/${row.factsTotal}</td><td>${row.structureScore}</td><td>${row.efficiency.toFixed(3)}</td></tr>`).join("")}
        </tbody>
      </table>
    </section>
  </main>
</body>
</html>`;
}

function barChart(data: Array<{ label: string; value: number }>, unit: string, fixedMax100: boolean): string {
  const width = 760;
  const rowHeight = 54;
  const max = fixedMax100 ? 100 : Math.max(...data.map((entry) => entry.value), 1);
  const bars = data.map((entry, index) => {
    const y = 34 + index * rowHeight;
    const barWidth = Math.max(2, Math.round((entry.value / max) * 500));
    return `<text x="0" y="${y + 17}" font-size="13">${htmlEscape(entry.label)}</text>
<rect x="180" y="${y}" width="${barWidth}" height="26" fill="#d97757" rx="4"/>
<text x="${190 + barWidth}" y="${y + 18}" font-size="13">${formatValue(entry.value)} ${unit}</text>`;
  }).join("\n");
  return `<svg viewBox="0 0 ${width} ${data.length * rowHeight + 28}" role="img">${bars}</svg>`;
}

function rowsToCsv(rows: ExperimentRow[]): string {
  const header = ["scenarioId", "scenarioTitle", "method", "tokens", "accuracy", "factsFound", "factsTotal", "structureScore", "efficiency"];
  return `${header.join(",")}\n${rows.map((row) => header.map((key) => csvCell(String(row[key as keyof ExperimentRow]))).join(",")).join("\n")}\n`;
}

function averageRows(rows: ExperimentRow[]): ExperimentOutput["averages"] {
  const averages = {} as ExperimentOutput["averages"];
  for (const method of methodOrder()) {
    const methodRows = rows.filter((row) => row.method === method);
    averages[method] = {
      tokens: avg(methodRows.map((row) => row.tokens)),
      accuracy: avg(methodRows.map((row) => row.accuracy)),
      structureScore: avg(methodRows.map((row) => row.structureScore)),
      efficiency: avg(methodRows.map((row) => row.efficiency))
    };
  }
  return averages;
}

function structureMarkdown(markdown: string): number {
  let score = 20;
  if (/^# /m.test(markdown)) score += 10;
  score += Math.min(25, (markdown.match(/^## /gm)?.length ?? 0) * 5);
  if (markdown.includes("| --- |")) score += 15;
  if (markdown.includes("```")) score += 10;
  if (/^- /m.test(markdown) || /^\d+\. /m.test(markdown)) score += 10;
  return Math.min(100, score);
}

function structureHtml(html: string): number {
  let score = 30;
  if (html.includes("<style>")) score += 20;
  if (html.includes("<section")) score += 20;
  if (html.includes("viewport")) score += 10;
  if (html.includes("class=")) score += 10;
  return Math.min(100, score);
}

function structureCwb(workbook: ContextWorkbook): number {
  let score = 30;
  if (workbook.sheets.length >= 5) score += 20;
  if (workbook.sheets.every((sheet) => sheet.suggestedRanges.length > 0)) score += 20;
  if (workbook.sources.length > 0) score += 10;
  if (workbook.notes.length > 0) score += 10;
  if (workbook.localFirst) score += 10;
  return Math.min(100, score);
}

function methodOrder(): MethodId[] {
  return ["markdown-full", "html-source", "cwb-small"];
}

function avg(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);
}

function formatValue(value: number): string {
  return value >= 100 ? value.toFixed(0) : value.toFixed(2);
}

function csvCell(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/\\/g, "").replace(/\s+/g, " ");
}

function repeat(text: string, count: number): string {
  return Array.from({ length: count }, () => text).join("\n\n");
}
