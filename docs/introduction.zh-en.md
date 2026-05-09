# Pomelo Context Workbook / 柚子上下文工作簿

## 中文介绍

Pomelo Context Workbook 是一个用于 AI Agent 的低 Token 上下文工作簿协议。它把网页、聊天记录、表格、图片、代码、报告、设计说明和可交互 HTML artifact 拆成一个可长期保存、可按需读取、可跨工具迁移的 `.cwb` bundle。

核心思想很简单：不要把完整网页、完整聊天记录或完整 Markdown 一次性塞进模型上下文。先让 Agent 读取 `manifest.json`，理解有哪些 sheet、notes、assets、来源和 token 预算；再按任务读取 `sheets/*.csv` 的精确 range；最后只在需要时打开 `workbook.xlsx`、`artifact.html` 或原始附件。

Pomelo 适合这些场景：

- 网页和 X/Twitter 线程归档：保留文字、图片、表格、代码、链接和来源。
- AI 聊天记录迁移：把长对话变成摘要、决策、待办、关键上下文和可追溯原文。
- 编程上下文管理：把模块图、关键文件、风险、调用路径和 review focus 组织成可切片工作簿。
- 设计和产品研究：把组件矩阵、状态、尺寸、用户反馈、竞品对比保存为人类可读、Agent 可读的格式。
- 交互型 artifact 留档：保留 HTML 的展示能力，同时给 Agent 提供更省 token 的索引和表格入口。

第一轮确定性实验比较了三种方式：

| 方法 | 平均 Token | 事实覆盖准确率 | 结构分 | 每 1K Token 准确效率 |
| --- | ---: | ---: | ---: | ---: |
| 完整 Markdown | 1779 | 100.0% | 50.0 | 0.562 |
| 原始 HTML source | 2323 | 100.0% | 90.0 | 0.430 |
| Pomelo CWB 按需读取 | 988 | 100.0% | 100.0 | 1.013 |

在这组样例中，Pomelo CWB 按需读取相比完整 Markdown 少 `44.5%` token，相比原始 HTML source 少 `57.5%` token，同时保持 `100%` 的必要事实覆盖。这个结果是可复现的方向性实验，不代表所有材料都一定获得同等收益；当材料越长、越结构化、越需要反复查询时，Pomelo 的优势会更明显。

项目灵感来自 Thariq Shihipar 关于 HTML artifact 的文章、示例页面和开源仓库。Pomelo 不隶属于这些项目，而是在充分致谢的基础上，把“HTML 适合展示和交互”的洞见扩展成“Workbook 适合索引、切片、迁移和低成本续读”的协议。

## English Introduction

Pomelo Context Workbook is a low-token context workbook protocol for AI agents. It turns web pages, chat logs, tables, images, code, reports, design notes, and interactive HTML artifacts into a durable `.cwb` bundle that can be archived by humans and read selectively by agents.

The idea is simple: do not push a full web page, chat export, or long Markdown document into the model context by default. Let the agent read `manifest.json` first, understand the available sheets, notes, assets, sources, and token budgets, then read precise ranges from `sheets/*.csv`. The richer `workbook.xlsx`, `artifact.html`, and original assets remain available for human review and deeper inspection.

Pomelo is useful for:

- Web and X/Twitter archiving: preserve text, images, tables, code, links, and source metadata.
- AI chat migration: convert long conversations into summaries, decisions, tasks, key context, and traceable source snippets.
- Programming context management: organize module maps, key files, risks, call paths, and review focus into sliceable workbooks.
- Design and product research: preserve component matrices, states, sizes, user feedback, and competitive research in a human-readable and agent-readable form.
- Interactive artifact preservation: keep the visual power of HTML while giving agents a lower-token indexed reading path.

The first deterministic experiment compared three approaches:

| Method | Avg Tokens | Fact Accuracy | Structure Score | Accuracy per 1K Tokens |
| --- | ---: | ---: | ---: | ---: |
| Markdown full read | 1779 | 100.0% | 50.0 | 0.562 |
| Raw HTML source | 2323 | 100.0% | 90.0 | 0.430 |
| Pomelo CWB small-read | 988 | 100.0% | 100.0 | 1.013 |

In these fixtures, Pomelo CWB small-read used `44.5%` fewer tokens than full Markdown and `57.5%` fewer tokens than raw HTML source while preserving `100%` of required facts. This is a reproducible directional benchmark, not a universal claim. The advantage should grow when the source is longer, more structured, and queried repeatedly.

This project is inspired by Thariq Shihipar's article, examples page, and repository about HTML artifacts. Pomelo is independent from those projects. It extends the insight that HTML is powerful for presentation and interaction into a workbook protocol optimized for indexing, slicing, migration, and low-cost agent continuation.

## Keywords / 关键词

AI context engineering, token optimization, agent memory, context workbook, HTML artifacts, Markdown alternative, XLSX archive, Claude Code skill, Cursor rules, web archive, chat migration, code context management.

AI 上下文工程、Token 节省、Agent 记忆、上下文工作簿、HTML Artifact、Markdown 替代方案、Excel 归档、Claude Code Skill、Cursor 规则、网页归档、聊天记录迁移、代码上下文管理。
