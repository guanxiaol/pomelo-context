# HTML Effectiveness Mapping

This project treats Thariq Shihipar's HTML artifact examples as a scenario matrix.

The mapping lives in `examples/html-effectiveness-catalog.json` and records:

- demo id
- title
- category
- source URL
- Context Workbook recipe
- expected sheets

## Recipe Coverage

- Exploration demos map to `compare-options`.
- Planning demos map to `implementation-plan`.
- PR and code review demos map to `annotated-pr-review`.
- Module understanding maps to `module-map`.
- Design demos map to `design-system-reference`.
- Prototype demos map to `prototype-snapshot`.
- Research, diagrams, and decks map to `research-explainer`.
- Status and incident reports map to `status-report` and `incident-report`.
- Editors map to `custom-editor-export`.

## Acceptance Standard

For each demo, a generated `.cwb` should preserve:

- source provenance
- human-readable view
- agent-readable manifest
- CSV sheets for the mapped recipe
- suggested ranges for low-token reading
- export state when the demo is an editor
