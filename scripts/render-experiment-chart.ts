import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

type Row = {
  scenarioId: string;
  scenarioTitle: string;
  method: string;
  tokens: number;
  accuracy: number;
  factsFound: number;
  factsTotal: number;
  structureScore: number;
  efficiency: number;
};

const root = resolve(new URL("..", import.meta.url).pathname);
const csvPath = resolve(root, "experiments/results/experiment-summary.csv");
const chartPath = resolve(root, "assets/experiment-results.svg");
const socialPath = resolve(root, "assets/social-preview.svg");
const paperPath = resolve(root, "assets/paper-results.svg");

function parseCsv(text: string): Row[] {
  const [headerLine, ...lines] = text.trim().split(/\r?\n/);
  const headers = headerLine.split(",");
  return lines.map((line) => {
    const cells = line.split(",");
    const record = Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ""]));
    return {
      scenarioId: record.scenarioId,
      scenarioTitle: record.scenarioTitle,
      method: record.method,
      tokens: Number(record.tokens),
      accuracy: Number(record.accuracy),
      factsFound: Number(record.factsFound),
      factsTotal: Number(record.factsTotal),
      structureScore: Number(record.structureScore),
      efficiency: Number(record.efficiency),
    };
  });
}

function average(rows: Row[], method: string, key: keyof Pick<Row, "tokens" | "accuracy" | "structureScore" | "efficiency">): number {
  const values = rows.filter((row) => row.method === method).map((row) => Number(row[key]));
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function cleanSvg(value: string): string {
  return value.replace(/[ \t]+$/gm, "");
}

const rows = parseCsv(readFileSync(csvPath, "utf8"));
const methods = [
  { id: "markdown-full", label: "Markdown full read", zh: "完整 Markdown", color: "#7c8a3a" },
  { id: "html-source", label: "Raw HTML source", zh: "原始 HTML", color: "#c15f3f" },
  { id: "cwb-small", label: "Pomelo CWB small-read", zh: "Pomelo 按需读取", color: "#2f8f83" },
];

const averages = methods.map((method) => ({
  ...method,
  tokens: Math.round(average(rows, method.id, "tokens")),
  accuracy: average(rows, method.id, "accuracy"),
  structure: average(rows, method.id, "structureScore"),
  efficiency: average(rows, method.id, "efficiency"),
}));

const cwb = averages.find((method) => method.id === "cwb-small")!;
const markdown = averages.find((method) => method.id === "markdown-full")!;
const html = averages.find((method) => method.id === "html-source")!;
const savingVsMarkdown = (1 - cwb.tokens / markdown.tokens) * 100;
const savingVsHtml = (1 - cwb.tokens / html.tokens) * 100;
const maxTokens = Math.max(...averages.map((method) => method.tokens));
const maxEfficiency = Math.max(...averages.map((method) => method.efficiency));

function bar(x: number, y: number, width: number, height: number, color: string): string {
  return `<rect x="${x}" y="${y}" width="${width.toFixed(1)}" height="${height}" rx="8" fill="${color}"/>`;
}

function axisLabel(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

const rowsSvg = averages.map((method, index) => {
  const y = 360 + index * 88;
  const tokenWidth = (method.tokens / maxTokens) * 420;
  const efficiencyWidth = (method.efficiency / maxEfficiency) * 250;
  return `<text x="70" y="${y}" class="method">${escapeXml(method.label)}</text>
    <text x="70" y="${y + 24}" class="methodZh">${escapeXml(method.zh)}</text>
    ${bar(300, y - 24, tokenWidth, 26, method.color)}
    <text x="${315 + tokenWidth}" y="${y - 5}" class="value">${method.tokens} tokens</text>
    ${bar(300, y + 18, efficiencyWidth, 18, "#172a2a")}
    <text x="${315 + efficiencyWidth}" y="${y + 33}" class="value">${method.efficiency.toFixed(3)} / 1K tokens</text>
    <text x="955" y="${y - 5}" class="value">${(method.accuracy * 100).toFixed(0)}% accuracy</text>
    <text x="955" y="${y + 29}" class="value">${method.structure.toFixed(0)} structure</text>`;
}).join("\n").replace(/[ \t]+$/gm, "");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="760" viewBox="0 0 1200 760" role="img" aria-labelledby="title desc">
  <title id="title">Pomelo Context Workbook experiment results</title>
  <desc id="desc">Bilingual chart comparing token cost, fact accuracy, structure score, and accuracy per 1K tokens across Markdown, HTML source, and Pomelo CWB small-read.</desc>
  <style>
    .bg { fill: #fbfaf6; }
    .panel { fill: #ffffff; stroke: #d9d4c7; stroke-width: 1.5; }
    text { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", sans-serif; }
    .title { font-size: 44px; font-weight: 800; fill: #172a2a; }
    .subtitle { font-size: 21px; font-weight: 600; fill: #4f5b55; }
    .small { font-size: 16px; font-weight: 500; fill: #59645f; }
    .metric { font-size: 36px; font-weight: 800; fill: #172a2a; }
    .metricLabel { font-size: 15px; font-weight: 600; fill: #59645f; }
    .method { font-size: 18px; font-weight: 800; fill: #172a2a; }
    .methodZh { font-size: 15px; font-weight: 500; fill: #65706a; }
    .value { font-size: 15px; font-weight: 700; fill: #172a2a; }
    .axis { stroke: #ddd7ca; stroke-width: 1; }
    .caption { font-size: 14px; font-weight: 500; fill: #6d766f; }
  </style>
  <rect class="bg" width="1200" height="760"/>
  <rect class="panel" x="34" y="34" width="1132" height="692" rx="26"/>

  <text x="70" y="105" class="title">Pomelo Context Workbook</text>
  <text x="70" y="140" class="subtitle">低 Token、可达意、可视化归档的 AI 上下文工作簿</text>
  <text x="70" y="172" class="small">Markdown vs raw HTML source vs manifest + selected CSV ranges</text>

  <rect x="70" y="210" width="240" height="74" rx="16" fill="#edf6f2" stroke="#b9d7cd"/>
  <text x="92" y="253" class="metric">${cwb.tokens}</text>
  <text x="188" y="253" class="metricLabel">avg tokens</text>
  <text x="92" y="272" class="metricLabel">Pomelo small-read / 按需读取</text>

  <rect x="334" y="210" width="240" height="74" rx="16" fill="#fff4ec" stroke="#e1c2ae"/>
  <text x="356" y="253" class="metric">${savingVsMarkdown.toFixed(1)}%</text>
  <text x="492" y="253" class="metricLabel">less than MD</text>
  <text x="356" y="272" class="metricLabel">相比 Markdown 更省 token</text>

  <rect x="598" y="210" width="240" height="74" rx="16" fill="#f1f2df" stroke="#cfd2a4"/>
  <text x="620" y="253" class="metric">${savingVsHtml.toFixed(1)}%</text>
  <text x="756" y="253" class="metricLabel">less than HTML</text>
  <text x="620" y="272" class="metricLabel">相比 HTML source 更省 token</text>

  <rect x="862" y="210" width="240" height="74" rx="16" fill="#eff3fb" stroke="#c5d1e7"/>
  <text x="884" y="253" class="metric">${(cwb.accuracy * 100).toFixed(0)}%</text>
  <text x="984" y="253" class="metricLabel">fact accuracy</text>
  <text x="884" y="272" class="metricLabel">确定性事实覆盖准确率</text>

  <text x="300" y="326" class="caption">Token cost</text>
  <line x1="300" y1="336" x2="720" y2="336" class="axis"/>
  <text x="300" y="636" class="caption">Accuracy per 1K tokens</text>
  <line x1="300" y1="646" x2="550" y2="646" class="axis"/>

  ${rowsSvg}

  <text x="70" y="690" class="caption">Deterministic fixture benchmark, 4 scenarios, 5 required facts each. Results are directional, reproducible, and not a universal claim.</text>
  <text x="70" y="712" class="caption">确定性样例实验：4 个场景，每个 5 个必要事实。结果用于验证方向，可复现，但不代表所有材料的绝对结论。</text>
</svg>
`;

const socialSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-labelledby="title desc">
  <title id="title">Pomelo Context Workbook social preview</title>
  <desc id="desc">A bilingual preview card for Pomelo Context Workbook, a low-token context protocol for AI agents.</desc>
  <style>
    .bg { fill: #fbfaf6; }
    .panel { fill: #ffffff; stroke: #d9d4c7; stroke-width: 1.5; }
    text { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", sans-serif; }
    .name { font-size: 58px; font-weight: 850; fill: #172a2a; }
    .zh { font-size: 28px; font-weight: 700; fill: #2f4f4a; }
    .tagline { font-size: 24px; font-weight: 600; fill: #4e5b56; }
    .pill { font-size: 18px; font-weight: 800; fill: #ffffff; }
    .small { font-size: 17px; font-weight: 600; fill: #65706a; }
    .metric { font-size: 42px; font-weight: 850; fill: #172a2a; }
    .metricLabel { font-size: 16px; font-weight: 700; fill: #5e6a64; }
  </style>
  <rect class="bg" width="1200" height="630"/>
  <rect class="panel" x="42" y="42" width="1116" height="546" rx="30"/>
  <text x="82" y="132" class="name">Pomelo Context Workbook</text>
  <text x="82" y="178" class="zh">柚子上下文工作簿</text>
  <text x="82" y="226" class="tagline">Turn web pages, chats, code reviews, and HTML artifacts into low-token workbooks.</text>
  <text x="82" y="264" class="tagline">把网页、聊天记录、代码上下文变成 AI 可按需读取的人类可视化工作簿。</text>

  <rect x="82" y="316" width="230" height="96" rx="18" fill="#edf6f2" stroke="#b9d7cd"/>
  <text x="106" y="367" class="metric">${cwb.tokens}</text>
  <text x="106" y="390" class="metricLabel">avg tokens</text>
  <text x="106" y="408" class="metricLabel">CWB small-read</text>

  <rect x="340" y="316" width="230" height="96" rx="18" fill="#fff4ec" stroke="#e1c2ae"/>
  <text x="364" y="367" class="metric">${savingVsMarkdown.toFixed(1)}%</text>
  <text x="364" y="390" class="metricLabel">less than Markdown</text>
  <text x="364" y="408" class="metricLabel">相比 MD 更省 token</text>

  <rect x="598" y="316" width="230" height="96" rx="18" fill="#f1f2df" stroke="#cfd2a4"/>
  <text x="622" y="367" class="metric">${savingVsHtml.toFixed(1)}%</text>
  <text x="622" y="390" class="metricLabel">less than HTML source</text>
  <text x="622" y="408" class="metricLabel">比 HTML 更轻</text>

  <rect x="856" y="316" width="230" height="96" rx="18" fill="#eff3fb" stroke="#c5d1e7"/>
  <text x="880" y="367" class="metric">${(cwb.accuracy * 100).toFixed(0)}%</text>
  <text x="880" y="390" class="metricLabel">fact accuracy</text>
  <text x="880" y="408" class="metricLabel">必要事实覆盖</text>

  <rect x="82" y="454" width="154" height="42" rx="21" fill="#172a2a"/>
  <text x="109" y="482" class="pill">.cwb</text>
  <rect x="254" y="454" width="154" height="42" rx="21" fill="#2f8f83"/>
  <text x="284" y="482" class="pill">XLSX</text>
  <rect x="426" y="454" width="154" height="42" rx="21" fill="#7c8a3a"/>
  <text x="456" y="482" class="pill">CSV ranges</text>
  <rect x="598" y="454" width="154" height="42" rx="21" fill="#c15f3f"/>
  <text x="638" y="482" class="pill">Skills</text>

  <text x="82" y="542" class="small">github.com/guanxiaol/pomelo-context • deterministic benchmark, 4 scenarios, 5 required facts each</text>
</svg>
`;

const scenarios = Array.from(new Map(rows.map((row) => [row.scenarioId, row.scenarioTitle])).entries());
const shortScenarioLabels = ["Plan", "PR", "Editor", "Web"];
const methodById = new Map(methods.map((method) => [method.id, method]));

function rowFor(scenarioId: string, methodId: string): Row {
  const row = rows.find((candidate) => candidate.scenarioId === scenarioId && candidate.method === methodId);
  if (!row) throw new Error(`Missing experiment row for ${scenarioId}/${methodId}`);
  return row;
}

function linePanel(): string {
  const x0 = 88;
  const y0 = 262;
  const width = 430;
  const height = 150;
  const max = Math.ceil(Math.max(...rows.map((row) => row.tokens)) / 500) * 500;
  const xFor = (index: number) => x0 + (index / (scenarios.length - 1)) * width;
  const yFor = (value: number) => y0 + height - (value / max) * height;
  const grid = [0, 1000, 2000, max].map((tick) => `
    <line x1="${x0}" y1="${yFor(tick)}" x2="${x0 + width}" y2="${yFor(tick)}" class="grid"/>
    <text x="${x0 - 12}" y="${yFor(tick) + 5}" text-anchor="end" class="tick">${tick}</text>`).join("");
  const lines = methods.map((method) => {
    const points = scenarios.map(([scenarioId], index) => `${xFor(index)},${yFor(rowFor(scenarioId, method.id).tokens)}`).join(" ");
    const dots = scenarios.map(([scenarioId], index) => `<circle cx="${xFor(index)}" cy="${yFor(rowFor(scenarioId, method.id).tokens)}" r="5" fill="${method.color}"/>`).join("");
    return `<polyline points="${points}" fill="none" stroke="${method.color}" stroke-width="4" stroke-linejoin="round"/>
    ${dots}`;
  }).join("");
  const xLabels = shortScenarioLabels.map((label, index) => `<text x="${xFor(index)}" y="${y0 + height + 28}" text-anchor="middle" class="tick">${label}</text>`).join("");
  return `<g transform="translate(0 0)">
    <text x="60" y="92" class="panelTitle">A. Token cost by scenario</text>
    <text x="60" y="118" class="panelSub">Lower is better. CWB reads manifest + selected ranges.</text>
    ${grid}
    <line x1="${x0}" y1="${y0}" x2="${x0}" y2="${y0 + height}" class="axis"/>
    <line x1="${x0}" y1="${y0 + height}" x2="${x0 + width}" y2="${y0 + height}" class="axis"/>
    ${lines}
    ${xLabels}
    <text x="${x0 + width / 2}" y="${y0 + height + 58}" text-anchor="middle" class="axisText">scenario</text>
    <text x="${x0 - 56}" y="${y0 + height / 2}" text-anchor="middle" class="axisText" transform="rotate(-90 ${x0 - 56} ${y0 + height / 2})">tokens</text>
  </g>`;
}

function scatterPanel(): string {
  const x0 = 690;
  const y0 = 262;
  const width = 350;
  const height = 150;
  const tokenMin = 800;
  const tokenMax = 2500;
  const effMin = 0.35;
  const effMax = 1.1;
  const xFor = (tokens: number) => x0 + ((tokens - tokenMin) / (tokenMax - tokenMin)) * width;
  const yFor = (efficiency: number) => y0 + height - ((efficiency - effMin) / (effMax - effMin)) * height;
  const points = averages.map((method) => {
    const radius = method.id === "cwb-small" ? 10 : 8;
    return `<circle cx="${xFor(method.tokens)}" cy="${yFor(method.efficiency)}" r="${radius}" fill="${method.color}"/>
    <text x="${xFor(method.tokens) + 14}" y="${yFor(method.efficiency) + 5}" class="pointLabel">${escapeXml(method.label.replace("Pomelo ", ""))}</text>`;
  }).join("");
  return `<g>
    <text x="648" y="92" class="panelTitle">B. Accuracy per 1K tokens</text>
    <text x="648" y="118" class="panelSub">Up-left means more conveyed facts per token.</text>
    <line x1="${x0}" y1="${y0}" x2="${x0}" y2="${y0 + height}" class="axis"/>
    <line x1="${x0}" y1="${y0 + height}" x2="${x0 + width}" y2="${y0 + height}" class="axis"/>
    <line x1="${x0}" y1="${yFor(1)}" x2="${x0 + width}" y2="${yFor(1)}" class="grid dashed"/>
    <text x="${x0 - 8}" y="${yFor(1) + 5}" text-anchor="end" class="tick">1.0</text>
    <text x="${x0}" y="${y0 + height + 28}" text-anchor="middle" class="tick">${tokenMin}</text>
    <text x="${x0 + width}" y="${y0 + height + 28}" text-anchor="middle" class="tick">${tokenMax}</text>
    <text x="${x0 + width / 2}" y="${y0 + height + 58}" text-anchor="middle" class="axisText">average tokens</text>
    <text x="${x0 - 60}" y="${y0 + height / 2}" text-anchor="middle" class="axisText" transform="rotate(-90 ${x0 - 60} ${y0 + height / 2})">accuracy / 1K tokens</text>
    ${points}
  </g>`;
}

function structurePanel(): string {
  const x0 = 88;
  const y0 = 520;
  const maxWidth = 320;
  const rowsOut = averages.map((method, index) => {
    const y = y0 + index * 44;
    const width = (method.structure / 100) * maxWidth;
    return `<text x="${x0}" y="${y + 18}" class="tick">${escapeXml(method.label)}</text>
    <rect x="${x0 + 172}" y="${y}" width="${width}" height="22" rx="5" fill="${method.color}"/>
    <text x="${x0 + 184 + width}" y="${y + 17}" class="pointLabel">${axisLabel(method.structure)}</text>`;
  }).join("");
  return `<g>
    <text x="60" y="482" class="panelTitle">C. Structure score</text>
    <text x="60" y="506" class="panelSub">Navigation proxy from 0 to 100.</text>
    ${rowsOut}
  </g>`;
}

function savingsPanel(): string {
  const x0 = 704;
  const y0 = 520;
  const values = [
    { label: "vs Markdown", value: savingVsMarkdown, color: "#7c8a3a" },
    { label: "vs HTML source", value: savingVsHtml, color: "#c15f3f" },
  ];
  const rowsOut = values.map((entry, index) => {
    const y = y0 + index * 54;
    const width = (entry.value / 65) * 260;
    return `<text x="${x0}" y="${y + 20}" class="tick">${entry.label}</text>
    <rect x="${x0 + 150}" y="${y}" width="${width}" height="26" rx="6" fill="${entry.color}"/>
    <text x="${x0 + 164 + width}" y="${y + 20}" class="pointLabel">${entry.value.toFixed(1)}%</text>`;
  }).join("");
  const legend = methods.map((method, index) => `<circle cx="${x0 + index * 142}" cy="668" r="6" fill="${method.color}"/>
    <text x="${x0 + 12 + index * 142}" y="673" class="legend">${escapeXml(method.label)}</text>`).join("");
  return `<g>
    <text x="648" y="482" class="panelTitle">D. Token savings</text>
    <text x="648" y="506" class="panelSub">CWB small-read relative to full reads.</text>
    ${rowsOut}
    ${legend}
  </g>`;
}

const paperSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="760" viewBox="0 0 1200 760" role="img" aria-labelledby="title desc">
  <title id="title">Pomelo Context Workbook paper-style benchmark figure</title>
  <desc id="desc">Scientific multi-panel benchmark chart for token cost, efficiency, structure, and savings.</desc>
  <style>
    .bg { fill: #ffffff; }
    .rule { stroke: #172a2a; stroke-width: 1.2; }
    .axis { stroke: #172a2a; stroke-width: 1.5; }
    .grid { stroke: #d7d7d2; stroke-width: 1; }
    .dashed { stroke-dasharray: 5 5; }
    text { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", sans-serif; fill: #172a2a; }
    .title { font-size: 30px; font-weight: 830; }
    .subtitle { font-size: 16px; font-weight: 600; fill: #53615a; }
    .panelTitle { font-size: 20px; font-weight: 830; }
    .panelSub { font-size: 13px; font-weight: 600; fill: #53615a; }
    .tick { font-size: 12px; font-weight: 650; fill: #53615a; }
    .axisText { font-size: 12px; font-weight: 750; fill: #53615a; }
    .pointLabel { font-size: 12px; font-weight: 750; }
    .legend { font-size: 11px; font-weight: 700; fill: #53615a; }
    .caption { font-size: 13px; font-weight: 600; fill: #53615a; }
  </style>
  <rect class="bg" width="1200" height="760"/>
  <text x="60" y="48" class="title">Figure 1. Selective workbook reads preserve facts with lower token cost</text>
  <text x="60" y="76" class="subtitle">Deterministic benchmark across ${scenarios.length} artifact scenarios; each scenario contains 5 required facts.</text>
  <line x1="60" y1="132" x2="1140" y2="132" class="rule"/>
  <line x1="60" y1="452" x2="1140" y2="452" class="rule"/>
  <line x1="590" y1="132" x2="590" y2="700" class="rule"/>
  ${linePanel()}
  ${scatterPanel()}
  ${structurePanel()}
  ${savingsPanel()}
  <text x="60" y="730" class="caption">Caption: CWB small-read means reading manifest.json plus suggested CSV ranges, not the full workbook. Accuracy is exact required-fact coverage, not model judgment.</text>
</svg>
`;

mkdirSync(dirname(chartPath), { recursive: true });
writeFileSync(chartPath, cleanSvg(svg));
writeFileSync(socialPath, cleanSvg(socialSvg));
writeFileSync(paperPath, cleanSvg(paperSvg));
console.log(`Wrote ${chartPath}`);
console.log(`Wrote ${socialPath}`);
console.log(`Wrote ${paperPath}`);
