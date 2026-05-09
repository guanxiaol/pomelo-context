# Web Compatibility

Context Workbook preserves web content into modality-specific sheets so agents can read only the needed ranges.

## Supported Modalities

| Web information | Extraction path | Output sheet |
| --- | --- | --- |
| Text, headings, paragraphs, list items, captions | Markdown headings/paragraphs; HTML `h1-h6`, `p`, `li`, `figcaption`, `blockquote` | `Sections`, `Text Blocks` |
| Photos and images | Markdown images; HTML `img` with `src`, `alt`, `title`, `width`, `height`, `srcset` | `Images` |
| Tables | CSV, Markdown tables, HTML `table/tr/th/td` | `Extracted Tables` |
| Code | Markdown fenced code; HTML `pre` and `code` blocks with language classes | `Code Blocks` |
| Links | Markdown links and bare URLs; HTML anchors | `Links` |

## Compatibility Matrix

Every packed file includes a `Compatibility Matrix` sheet with counts for text, images, tables, code, and links. Use it as the first sanity check after packing a webpage.

```bash
node ./src/cli.ts pack examples/mixed-web.html --recipe web-or-chat-archive --out tmp/mixed.cwb
node ./src/cli.ts read tmp/mixed.cwb --sheet "Compatibility Matrix" --range A1:D6
```

## Image Policy

Remote image bytes are not downloaded by default. The `Images` sheet preserves URL, alt text, title, dimensions, and srcset so agents can understand and cite the image without making network calls. Future adapters may add explicit opt-in image download and embedding.

## HTML Table Policy

HTML tables are normalized into a long table:

- `Table`: table index.
- `Row`: row index.
- `Column`: original header or generated column name.
- `Value`: cell content.

This shape is easy for agents to read by range and survives conversion to CSV/XLSX.
