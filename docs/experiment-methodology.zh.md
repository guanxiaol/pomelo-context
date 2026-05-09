# Markdown vs HTML vs Context Workbook 实验方法

## 目标

验证三种信息传达形式在 AI 上下文迁移中的差异：

1. 传统 Markdown 文档全文。
2. 传统 HTML artifact 源码全文。
3. Context Workbook 的小上下文读取路径：`manifest.json` + 高优先级 sheet/range。

## 实验问题

- Token 消耗：哪种方式让 agent 读取的信息最少？
- 准确率：必须传达的事实是否完整保留？
- 结构性：人和 agent 是否容易导航？
- 单位 token 效率：每 1000 token 能传达多少事实？

## Fixtures

实验内置 4 个场景：

- implementation plan
- PR review
- custom editor export
- web/article archive

每个场景包含 5 个 ground-truth facts，并加入大量背景段落作为低优先级噪声。事实放在结构化段落开头，模拟真实文档里“关键事实 + 长背景”的情况。

## 指标

### Token

使用项目内置 `estimateTokens()` 估算。它不是供应商 tokenizer，但对三种格式使用同一算法，因此适合相对比较。

### Fact Accuracy

每个事实定义若干 `mustContain` marker。消费上下文中包含所有 marker，则该事实计为传达成功。

```text
accuracy = conveyed_facts / total_facts
```

### Structure Score

0-100 的确定性结构评分：

- Markdown：标题、二级标题、表格、代码块、列表。
- HTML：style、section、viewport、class 等可视结构。
- CWB：多 sheet、suggested ranges、sources、notes、local-first metadata。

该指标不是审美主观分，而是“可导航性/结构化程度”代理指标。

### Efficiency

```text
efficiency = accuracy * 1000 / tokens
```

含义：每 1000 token 传达的完整事实比例。

## 运行

```bash
node ./src/cli.ts experiment --out experiments/results
```

## 输出

- `experiment-summary.csv`：原始表格。
- `experiment-results.json`：机器可读结果。
- `experiment-report.md`：文字报告。
- `experiment-report.html`：带 SVG 图表的可视报告。
- `bundles/*.cwb`：每个场景对应的工作簿包。

## 局限

- 当前准确率是字符串事实覆盖，不等价于真实人类主观理解。
- 当前 token 估算是相对指标，不是某个模型厂商的官方 tokenizer。
- HTML 的评估使用源码输入；如果未来 agent 能直接读取浏览器可见 DOM 或截图，结果会不同。
- CWB 的优势在长文档、代码库、聊天迁移和需要选择性读取的场景更明显；短小文档可能因为 manifest 固定成本而不占优。
