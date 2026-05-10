# Contributing to Pomelo Context Workbook

Thanks for helping make agent context cheaper, clearer, and easier to preserve.

## Good First Contributions

- Add a real-world recipe for a new artifact type.
- Improve web extraction for images, tables, code blocks, links, or metadata.
- Add a benchmark fixture that compares Markdown, raw HTML source, and CWB small-read.
- Try Pomelo on a long chat export or webpage and report what information was lost.
- Improve Claude Code, Cursor, or Codex skill instructions.
- Add exporters for formats such as JSONL, SQLite, PDF, or single-file HTML.

## Local Setup

```bash
git clone https://github.com/guanxiaol/pomelo-context.git
cd pomelo-context
npm test
npm run experiment
npm run chart
```

This project has no runtime dependencies. Node 22.18+ can run the TypeScript files directly.

## Pull Request Checklist

- Keep changes focused and explain the user-facing reason.
- Add or update tests when behavior changes.
- Run `npm test`.
- Run `npm run experiment` when benchmark output changes.
- Run `npm run chart` when experiment chart assets should be regenerated.
- Avoid claiming universal token savings unless the benchmark supports it.

## 中文贡献说明

欢迎贡献真实场景、recipe、实验样例、导出格式和 Skill 工作流。最有价值的贡献不是“让 README 更热闹”，而是让 Pomelo 在真实网页、聊天记录、代码上下文、设计资料和研究报告里更少丢信息、更容易被 Agent 按需读取。

提交 PR 前请至少运行：

```bash
npm test
npm run experiment
```

如果实验图或传播图需要更新，再运行：

```bash
npm run chart
```
