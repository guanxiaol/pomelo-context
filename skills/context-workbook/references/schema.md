# Context Workbook Schema

A `.cwb` bundle is a directory with stable paths:

```text
bundle.cwb/
  manifest.json
  workbook.xlsx
  artifact.html
  sheets/*.csv
  notes/*.md
  assets/*
```

## manifest.json

Fields:

- `version`: protocol version.
- `id`: bundle id.
- `title`: human title.
- `recipe`: recipe id.
- `summary`: short source summary.
- `tokenBudget`: full and index token estimates.
- `localFirst`: always true for default bundles.
- `ai.enabled`: false unless explicit AI enrichment is added.
- `sources`: provenance rows.
- `sheets`: sheet metadata, row count, CSV path, and suggested ranges.
- `notes`: note paths.
- `assets`: preserved snapshots or media.
- `readingGuide`: task-specific reading instructions.

## Agent Reading Contract

Agents must:

1. Read `manifest.json`.
2. Pick a task-specific sheet.
3. Read a small CSV range.
4. Ask for more ranges only if needed.

Agents should not:

- Load `workbook.xlsx` as model context.
- Read every CSV by default.
- Treat `artifact.html` as the canonical source when CSV/index data is enough.
