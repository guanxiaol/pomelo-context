---
name: context-workbook
description: Create, inspect, and selectively read Context Workbook (.cwb) bundles for low-token AI context transfer. Use when Codex needs to archive or migrate web pages, X threads, chat logs, Markdown notes, CSV/JSON data, codebase context, PR reviews, implementation plans, reports, design references, prototype states, or custom editor exports across agents without loading the full source into the context window.
---

# Context Workbook

Use Context Workbook bundles as agent-readable indexes plus human-readable workbooks. Prefer this skill when the user wants durable context, chat/web migration, token-efficient reading, or a workbook-style artifact.

## Reading Workflow

1. Read `manifest.json` first.
2. Identify the needed sheet names, row counts, and `suggestedRanges`.
3. Read only targeted CSV ranges from `sheets/*.csv`.
4. Open `workbook.xlsx` or `artifact.html` only for human review or visual inspection.
5. Preserve provenance: cite `Sources`, `Links`, or row references when summarizing.

Never load the whole workbook, full HTML snapshot, or all CSV files unless the user explicitly asks for exhaustive migration.

## Creating Workflow

Use the CLI from the project root:

```bash
node ./src/cli.ts pack <input> --recipe web-or-chat-archive --out out.cwb
node ./src/cli.ts inspect out.cwb --index --budget small
node ./src/cli.ts read out.cwb --sheet Sections --range A1:E20
node ./src/cli.ts validate out.cwb
node ./src/cli.ts benchmark out.cwb
node ./src/cli.ts convert out.cwb --to html --out out.html
```

Default to local-first operation. Do not call an external model unless the user explicitly asks for AI enrichment.

## Recipe Selection

Use `web-or-chat-archive` for web pages, X posts, articles, and chat exports.
Use `implementation-plan` for build plans with milestones, data flow, key code, risks, and open questions.
Use `annotated-pr-review` for diffs and PR review summaries.
Use `module-map` for codebase understanding and request paths.
Use `design-system-reference` for tokens and component matrices.
Use `prototype-snapshot` for interactive UI state, animation parameters, and copyable CSS/JSON.
Use `research-explainer` for feature or concept explainers.
Use `status-report` or `incident-report` for recurring reports and postmortems.
Use `custom-editor-export` for triage boards, feature flags, prompt tuners, and any UI that must end with JSON/diff/markdown/prompt export.
Use `compare-options` when the user wants alternatives side by side.

For detailed recipe patterns, read `references/prompt-recipes.md`. For bundle structure, read `references/schema.md`.
