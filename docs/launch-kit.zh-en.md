# Pomelo Launch Kit / 传播素材包

Use this page when sharing Pomelo Context Workbook on X, GitHub, Hacker News, WeChat, blog posts, or demo videos.

在 X、GitHub、Hacker News、微信公众号、博客或 demo 视频里介绍 Pomelo 时，可以直接复用这里的中英文文案。

## Social Preview

![Pomelo social preview](../assets/social-preview.png)

## One-Liner / 一句话

**English:** Pomelo Context Workbook turns web pages, chats, code reviews, and HTML artifacts into low-token workbooks that agents can read by range and humans can archive forever.

**中文：** Pomelo Context Workbook 把网页、聊天记录、代码上下文和 HTML Artifact 变成低 Token、可切片、可归档的 AI 上下文工作簿。

## Short Post / 短帖

**English:**

I built Pomelo Context Workbook, an open protocol for low-token AI context.

Instead of feeding long Markdown or raw HTML into an agent, Pomelo packs context into `.cwb`: manifest, XLSX, CSV ranges, notes, assets, and optional HTML.

Benchmark fixtures: 988 avg tokens, 100% required fact coverage, 44.5% fewer tokens than full Markdown.

GitHub: https://github.com/guanxiaol/pomelo-context

**中文：**

我做了一个开源项目 Pomelo Context Workbook：把网页、聊天记录、代码上下文和 HTML Artifact 变成低 Token 的 AI 上下文工作簿。

它不是把全文塞给模型，而是让 Agent 先读 manifest，再按 sheet/range 读取 CSV 片段；人类可以打开 XLSX/HTML/Markdown 长期归档。

当前样例实验：平均 988 tokens，必要事实覆盖 100%，比完整 Markdown 少 44.5% token。

GitHub: https://github.com/guanxiaol/pomelo-context

## Thread Outline / 长帖结构

1. Problem: Agents waste tokens rereading long web pages, chat logs, PRs, and Markdown files.
2. Existing options: Markdown is compact but flat; HTML is rich but costly as raw context.
3. Idea: use a workbook protocol that separates index, sheets, notes, assets, and human views.
4. Demo: show `cwb pack`, `cwb inspect`, and `cwb read --sheet --range`.
5. Evidence: show the benchmark image and explain the deterministic limitations.
6. Ask: star the repo, try it on one real chat log or webpage, open a use-case issue.

## Titles / 标题候选

- Pomelo: Low-Token Context Workbooks for AI Agents
- Stop Feeding Agents Whole Documents. Give Them Workbooks.
- 把网页和聊天记录变成 AI 可按需读取的上下文工作簿
- 比 Markdown 更可索引，比 HTML source 更省 Token 的 Agent 上下文协议

## Keywords / 关键词

AI context engineering, token optimization, agent memory, context workbook, HTML artifacts, Markdown alternative, XLSX archive, Claude Code skill, Cursor rules, web archive, chat migration, code context management.

AI 上下文工程、Token 节省、Agent 记忆、上下文工作簿、HTML Artifact、Markdown 替代方案、Excel 归档、Claude Code Skill、Cursor 规则、网页归档、聊天记录迁移、代码上下文管理。

## Accuracy Note / 准确性说明

Do not claim Pomelo always saves exactly 44.5% tokens. The current result is a deterministic fixture benchmark across 4 scenarios with 5 required facts each. The stronger claim is: Pomelo creates a reproducible way to measure token cost, fact coverage, and structure preservation for selective context reads.

不要宣称 Pomelo 在所有材料上都固定节省 44.5% token。当前结果来自 4 个确定性样例场景，每个场景 5 个必要事实。更准确的说法是：Pomelo 提供了一套可复现的方法，用来衡量按需读取场景下的 token 成本、事实覆盖和结构保留。
