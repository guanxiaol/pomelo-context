# Context Workbook Experiment Report

## Method

This experiment compares three context-transfer paths:

- `markdown-full`: a traditional linear Markdown document read in full.
- `html-source`: a self-contained HTML artifact read as source text by an agent.
- `cwb-small`: Context Workbook manifest plus high-priority CSV sheet ranges.

Accuracy is deterministic fact coverage: a required fact is counted as conveyed only when all required exact markers appear in the consumed context. Structure score is a deterministic navigation proxy from 0 to 100.

## Average Results

| Method | Avg Tokens | Fact Accuracy | Structure Score | Accuracy per 1K Tokens |
| --- | ---: | ---: | ---: | ---: |
| markdown-full | 1779 | 100.0% | 50.0 | 0.562 |
| html-source | 2323 | 100.0% | 90.0 | 0.430 |
| cwb-small | 988 | 100.0% | 100.0 | 1.013 |

## Scenario Results

| Scenario | Method | Tokens | Fact Accuracy | Facts | Structure | Accuracy per 1K Tokens |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| implementation-plan | markdown-full | 1796 | 100.0% | 5/5 | 50 | 0.557 |
| implementation-plan | html-source | 2340 | 100.0% | 5/5 | 90 | 0.427 |
| implementation-plan | cwb-small | 1037 | 100.0% | 5/5 | 100 | 0.964 |
| pr-review | markdown-full | 1766 | 100.0% | 5/5 | 50 | 0.566 |
| pr-review | html-source | 2310 | 100.0% | 5/5 | 90 | 0.433 |
| pr-review | cwb-small | 966 | 100.0% | 5/5 | 100 | 1.035 |
| custom-editor | markdown-full | 1762 | 100.0% | 5/5 | 50 | 0.568 |
| custom-editor | html-source | 2306 | 100.0% | 5/5 | 90 | 0.434 |
| custom-editor | cwb-small | 969 | 100.0% | 5/5 | 100 | 1.032 |
| web-archive | markdown-full | 1792 | 100.0% | 5/5 | 50 | 0.558 |
| web-archive | html-source | 2336 | 100.0% | 5/5 | 90 | 0.428 |
| web-archive | cwb-small | 980 | 100.0% | 5/5 | 100 | 1.020 |

## Interpretation

HTML source preserves facts well and improves visual structure for humans, but raw HTML carries tag and style overhead when used as model context. Markdown is compact and accurate for small linear documents. Context Workbook is strongest when the agent does not need the whole document: it preserves the required facts in indexed sheets while skipping low-priority prose.
