# Using HTML Artifacts As Context

Source: https://thariqs.github.io/html-effectiveness/

The reference page groups agent-produced HTML files into exploration, code review, design, prototyping, diagrams, decks, research, reports, and custom editors.

## Core Claim

Markdown is portable and editable, but agent outputs increasingly need visual density, comparison, interaction, and export paths.

## Workbook Extension

A Context Workbook keeps the rich human artifact, then adds an agent index, CSV sheet ranges, provenance, and token budgeting.

## Useful Patterns

| Pattern | What It Captures | Workbook Sheet |
| --- | --- | --- |
| Side-by-side exploration | Options, tradeoffs, recommendation | Option Matrix |
| Implementation plan | Milestones, data flow, risks | Milestones |
| PR review | Findings and severity | Findings |
| Custom editor | UI state and export | Exports |

## Open Questions

- Should the first browser integration capture DOM snapshots or user-selected page regions?
- Should `.cwb` later become a zipped file or stay a folder for easy git diffs?

## Export Contract

Custom editors must end with copyable JSON, diff, markdown, or prompt output.
