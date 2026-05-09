# Context Workbook：把 AI 产物从“页面”升级成“可迁移的上下文容器”

Thariq Shihipar 的《Using Claude Code: The Unreasonable Effectiveness of HTML》提出了一个很重要的观察：当 agent 越来越能完成复杂工作时，Markdown 开始显得太扁平。它适合写作和手改，但不适合承载多方案比较、交互原型、代码审查、设计系统、研究报告和一次性编辑器。HTML 的优势是信息密度高、视觉清晰、可交互，也更容易让人真的读完。

本文和项目原型受 Thariq Shihipar 的原文、配套 examples 页面及其 GitHub 仓库启发。完整引用见项目根目录的 `ACKNOWLEDGEMENTS.md`。

但 HTML 解决的是“人如何读”的问题，还没有完全解决“AI 如何低成本继续读”的问题。一个复杂 HTML 文件对人来说是一个好页面，对下一个 agent 来说仍然可能是一大坨上下文。Context Workbook 想补上这一层：保留 HTML 的表达力，同时增加 workbook 的索引、表格、来源、摘要、切片和读取协议。

## 核心观点

Context Workbook 不是说 Excel 比 HTML 更高级，而是说 AI artifact 需要两种视图：

- 人类视图：`workbook.xlsx` 或 `artifact.html`，用于阅读、分享、审阅、归档。
- Agent 视图：`manifest.json`、`sheets/*.csv`、`notes/*.md`，用于按需读取和迁移上下文。

真正省 token 的不是 `.xlsx` 二进制文件本身，而是协议：先读 manifest，再按任务选择 sheet 和 range，不把完整网页、完整聊天记录或完整代码解释一次性塞进上下文窗口。

## 为什么是 Workbook

Workbook 天然适合拆分信息：

- `Overview` 保存摘要和读取入口。
- `Sources` 保存来源、路径、链接、时间和 token 估算。
- `Sections` 保存文章或网页结构。
- `Claims` 保存观点和证据。
- `Messages` 保存聊天记录。
- `Findings`、`Risks`、`Milestones`、`Exports` 等 sheet 对应不同工作流。

这让一个 agent 可以说：“我只需要看 `Risks!A1:D20` 和 `Key Code!A1:D12`”，而不是读取整个 artifact。

## 从 HTML Examples 借来的场景

Thariq 的 examples 页面覆盖了 9 类高价值场景，Context Workbook 把它们转成 recipes：

- Exploration：多方案并排比较。
- Planning：里程碑、数据流、关键代码、风险表。
- Code Review：带严重级别的发现、文件风险图、下一步。
- Code Understanding：模块图、调用路径、gotchas。
- Design：设计 token 和组件矩阵。
- Prototyping：交互状态、参数、可复制 CSS/JSON。
- Research：TL;DR、步骤、术语表、FAQ。
- Reports：周报、事故时间线、指标和行动项。
- Custom Editors：拖拽分桶、feature flag 编辑、prompt tuner，并且必须有 export。

## 一个最小协议

一个 `.cwb` 包是目录：

```text
out.cwb/
  manifest.json
  workbook.xlsx
  artifact.html
  sheets/*.csv
  notes/*.md
  assets/*
```

Agent 的读取规则很简单：

1. 先读 `manifest.json`。
2. 看 sheet 索引和 suggested ranges。
3. 只读取相关 CSV range。
4. 人需要审阅时再打开 `workbook.xlsx` 或 `artifact.html`。

这就是 Context Workbook 的核心：把 AI 产物从“一个更漂亮的文件”变成“一个可以被下一个 agent 低成本接住的上下文容器”。
