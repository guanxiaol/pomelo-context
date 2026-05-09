# Pomelo Context Workbook

Pomelo Context Workbook (`cwb`) is a low-token artifact protocol for AI agents and humans. It turns long web pages, chat logs, Markdown notes, CSV/XLSX-like tables, and code folders into a `.cwb` bundle:

- `manifest.json` for agent-first indexing and token budgeting.
- `workbook.xlsx` for human reading and durable sharing.
- `sheets/*.csv` for cheap range reads.
- `notes/*.md` for summaries and prompt recipes.
- `assets/` for optional HTML snapshots and source artifacts.

The idea is inspired by Thariq Shihipar's HTML artifact examples: HTML is great for rich reading and interaction; Pomelo adds indexing, slicing, migration, and agent-friendly selective reads.

See `ACKNOWLEDGEMENTS.md` for the full source attribution and references.

## Quick Start

```bash
npm run cwb -- pack examples/web-archive.md --recipe web-or-chat-archive --out tmp/demo.cwb
npm run cwb -- inspect tmp/demo.cwb --index --budget small
npm run cwb -- read tmp/demo.cwb --sheet Sections --range A1:E8
npm run cwb -- validate tmp/demo.cwb
npm run cwb -- benchmark tmp/demo.cwb
npm run cwb -- convert tmp/demo.cwb --to html --out tmp/demo.html
npm run experiment
```

This repository intentionally has no runtime dependencies. Node 22.18+ can run the TypeScript entrypoint directly.

Tiny inputs may benchmark worse than raw text because the bundle has a fixed index cost. The protocol is designed for long pages, chats, PRs, and code contexts:

```bash
npm run cwb -- benchmark . --recipe module-map
```

That command estimates reading this repository directly versus reading a workbook index and selected ranges.

## Built-In Recipes

- `compare-options`
- `implementation-plan`
- `annotated-pr-review`
- `module-map`
- `design-system-reference`
- `prototype-snapshot`
- `research-explainer`
- `status-report`
- `incident-report`
- `custom-editor-export`
- `web-or-chat-archive`

## Why This Saves Tokens

The `.xlsx` file is not magic compression. The savings come from the protocol:

1. Agents read `manifest.json` first.
2. They inspect sheet names, row counts, summaries, and suggested ranges.
3. They pull only the relevant CSV ranges.
4. They use `workbook.xlsx` or `artifact.html` for human review, not as the default model input.

## Skill

See `skills/context-workbook/SKILL.md` for a cross-agent reading workflow. The skill tells agents to inspect the manifest first, then read only sheet ranges that match the task.

## Web Compatibility

Context Workbook extracts webpage text, photos/images, tables, code blocks, and links into separate sheets. See `docs/compatibility.md`.

## Benchmark Matrix

The file `examples/html-effectiveness-catalog.json` maps the 20 HTML Effectiveness demos to Context Workbook recipes and expected sheets. See `docs/html-effectiveness-mapping.md`.

## Markdown vs HTML vs CWB Experiment

Run:

```bash
npm run experiment
```

Current deterministic fixture results:

| Method | Avg Tokens | Fact Accuracy | Structure Score | Accuracy per 1K Tokens |
| --- | ---: | ---: | ---: | ---: |
| Markdown full read | 1779 | 100.0% | 50.0 | 0.562 |
| HTML source read | 2323 | 100.0% | 90.0 | 0.430 |
| CWB small read | 988 | 100.0% | 100.0 | 1.013 |

Outputs are written to `experiments/results/`, including `experiment-report.html`, `experiment-report.md`, `experiment-summary.csv`, and `experiment-results.json`.

See `docs/experiment-methodology.zh.md` for the metric definitions and limitations.

## Article Draft

See `docs/context-workbook.zh.md` for a Chinese article draft introducing the idea.

## Usage Manual

See `docs/usage-manual.zh.md` for Claude Code and Cursor deployment instructions.

## Roadmap

See `docs/roadmap.md`.

## Acknowledgements

This project is inspired by Thariq Shihipar's [Using Claude Code: The Unreasonable Effectiveness of HTML](https://x.com/trq212/status/2052809885763747935), its [companion examples page](https://thariqs.github.io/html-effectiveness/), and the [html-effectiveness repository](https://github.com/ThariqS/html-effectiveness). Context Workbook is independent and not affiliated with those projects or organizations.
