# Context Workbook Prompt Recipes

These patterns are adapted from the HTML artifact workflow: make context visual enough for people, but indexed enough for agents.

## compare-options

Ask for distinct options, side-by-side comparison, tradeoffs, and a default recommendation.

Required sheets: `Option Matrix`, `Tradeoffs`, `Sources`.

## implementation-plan

Ask for milestones, data flow, mockups or screenshots if available, key code, risks, mitigations, and open questions.

Required sheets: `Milestones`, `Data Flow`, `Key Code`, `Risks`, `Open Questions`.

## annotated-pr-review

Ask for findings first, sorted by severity, then changed files, diff snippets, review focus, and next steps.

Required sheets: `Findings`, `Files`, `Suggested Next Steps`, `Code Blocks`.

## module-map

Ask for entry points, call paths, trust boundaries, key files, and gotchas.

Required sheets: `Module Map`, `Call Path`, `Gotchas`, `Files`.

## design-system-reference

Ask for tokens as copyable rows and component variants as a matrix.

Required sheets: `Tokens`, `Component Matrix`, `Links`.

## prototype-snapshot

Ask for current UI state, controls, parameter values, interaction observations, open questions, and copyable exports.

Required sheets: `Prototype State`, `Interaction Notes`, `Exports`.

## research-explainer

Ask for a TL;DR, step-by-step flow, key snippets, gotchas, glossary, and FAQ.

Required sheets: `TLDR`, `Steps`, `Code Blocks`, `Glossary`, `FAQ`.

## status-report

Ask for highlights, shipped work, metrics, carryover, blockers, and sources.

Required sheets: `Highlights`, `Metrics`, `Carryover`, `Sources`.

## incident-report

Ask for TL;DR, timeline, root cause, impact, action items, owners, and evidence.

Required sheets: `Timeline`, `Impact`, `Action Items`, `Sources`.

## custom-editor-export

Ask for a purpose-built editor state and always require export as JSON, diff, markdown, or prompt.

Required sheets: `Editor State`, `Validation`, `Exports`.

## web-or-chat-archive

Ask to freeze the source, preserve links, extract claims, capture messages, and provide reading ranges for future agents.

Required sheets: `Claims`, `Messages`, `Links`, `Sections`, `Sources`.
