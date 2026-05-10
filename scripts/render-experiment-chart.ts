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

mkdirSync(dirname(chartPath), { recursive: true });
writeFileSync(chartPath, svg);
writeFileSync(socialPath, socialSvg);
console.log(`Wrote ${chartPath}`);
console.log(`Wrote ${socialPath}`);
