# Roadmap

## v0.1

- Define `.cwb` bundle layout.
- Provide local-first CLI for `pack`, `inspect`, `read`, `convert`, `validate`, and `benchmark`.
- Generate `manifest.json`, CSV sheets, Markdown notes, HTML view, and XLSX view.
- Ship a cross-agent skill and recipe references.
- Include the HTML Effectiveness demo catalog as a benchmark matrix.
- Preserve webpage text, images, tables, code blocks, and links into separate sheets.

## v0.2

- Add browser capture adapters for saved DOM, selected page regions, and screenshots.
- Add loss reports that compare original HTML sections to workbook sheets.
- Add optional `.cwb.zip` packaging.
- Add deterministic extraction for images, SVGs, tables, and form state.

## v0.3

- Add optional AI enrichment adapters with explicit user consent.
- Add richer XLSX styling, comments, image embedding, and hyperlinks.
- Add importers for common chat exports from ChatGPT, Claude, Codex, and browser extensions.
- Add benchmark runners for the 20 HTML Effectiveness demos.

## Non-goals

- Do not make XLSX the canonical model input.
- Do not call remote AI services by default.
- Do not scrape logged-in websites without user-controlled export or capture.
