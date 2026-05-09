---
name: context-workbook
description: Pack, inspect, validate, benchmark, and selectively read Context Workbook (.cwb) bundles for low-token AI context transfer. Use for web/chat/code/PR/design/report artifacts when the agent should read manifest and CSV ranges instead of loading a full Markdown, HTML, or workbook file.
---

# Context Workbook

Use the project CLI from the repository root:

```bash
node ./src/cli.ts pack <input> --recipe web-or-chat-archive --out out.cwb
node ./src/cli.ts inspect out.cwb --index --budget small
node ./src/cli.ts read out.cwb --sheet Sections --range A1:E20
node ./src/cli.ts validate out.cwb
node ./src/cli.ts benchmark out.cwb
node ./src/cli.ts experiment --out experiments/results
```

Reading rule: inspect `manifest.json` first, choose relevant sheets and suggested ranges, then read only targeted CSV ranges. Do not load the entire `workbook.xlsx`, `artifact.html`, or all CSV files unless the user asks for exhaustive migration.

Recipe defaults:

- `web-or-chat-archive` for webpages, X threads, articles, and chat exports.
- `implementation-plan` for build plans.
- `annotated-pr-review` for PRs and diffs.
- `module-map` for codebase understanding.
- `custom-editor-export` for UI state that must export JSON, diff, markdown, or prompt.
- `compare-options`, `design-system-reference`, `prototype-snapshot`, `research-explainer`, `status-report`, and `incident-report` for matching artifact types.
