# Context Workbook 使用手册

本手册说明如何在本地、Claude Code、Cursor 中部署和调用 Context Workbook。

参考官方文档：

- Claude Code Skills 会从个人 `~/.claude/skills/`、项目 `.claude/skills/` 和插件中自动发现；也可以通过 `/skill-name` 调用。见 [Anthropic Claude Code Skills docs](https://docs.claude.com/en/docs/claude-code/skills)。
- Claude Code slash commands 和 Skills 的差异、命令目录结构见 [Claude Code slash commands docs](https://docs.claude.com/en/docs/claude-code/slash-commands)。
- Cursor Project Rules 位于 `.cursor/rules`，Custom Commands 位于 `.cursor/commands`。见 [Cursor Rules docs](https://docs.cursor.com/context/rules) 和 [Cursor Commands docs](https://docs.cursor.com/en/agent/chat/commands)。

## 1. 本地安装和自检

要求：

- Node.js 22.18 或更高版本。
- 不需要安装 npm 依赖；当前实现没有运行时依赖。

在项目根目录运行：

```bash
node --test tests/*.test.ts
npm run demo
npm run experiment
```

常用命令：

```bash
node ./src/cli.ts recipes
node ./src/cli.ts pack examples/web-archive.md --recipe web-or-chat-archive --out tmp/demo.cwb
node ./src/cli.ts inspect tmp/demo.cwb --index --budget small
node ./src/cli.ts read tmp/demo.cwb --sheet Claims --range A1:D8
node ./src/cli.ts validate tmp/demo.cwb
node ./src/cli.ts benchmark tmp/demo.cwb
node ./src/cli.ts convert tmp/demo.cwb --to html --out tmp/demo.html
node ./src/cli.ts convert tmp/demo.cwb --to xlsx --out tmp/demo.xlsx
```

## 2. Claude Code 项目级 Skill

本仓库已经包含项目级 Skill：

```text
.claude/skills/context-workbook/SKILL.md
```

在 Claude Code 中打开本项目后，可以这样测试：

```text
List all available Skills.
```

如果 Claude Code 已发现该 Skill，你可以直接说：

```text
Use the context-workbook skill to pack examples/pr-review.md as an annotated-pr-review bundle, validate it, then inspect the small index.
```

或者显式调用：

```text
/context-workbook Pack examples/pr-review.md with recipe annotated-pr-review into tmp/pr-review.cwb, validate it, then read Findings A1:E10.
```

推荐工作流：

1. 让 Claude Code 选择 recipe。
2. 运行 `pack` 生成 `.cwb`。
3. 运行 `validate` 检查包结构。
4. 运行 `inspect --index --budget small`。
5. 只用 `read --sheet ... --range ...` 读取必要范围。
6. 人类需要审阅时再打开 `workbook.xlsx` 或 `artifact.html`。

## 3. Claude Code 个人级 Skill

如果希望所有项目都能用：

```bash
mkdir -p ~/.claude/skills
cp -R skills/context-workbook ~/.claude/skills/context-workbook
```

如果你希望个人级 Skill 也能直接调用本项目 CLI，请把本项目路径加入 Skill 说明，或者在目标项目中安装/复制这个仓库。

个人级 prompt 示例：

```text
Use the context-workbook skill. My input file is /absolute/path/to/source.md. Create /absolute/path/to/out.cwb, validate it, and report the recommended sheet ranges for a small read.
```

## 4. Cursor Project Rule

本仓库已经包含 Cursor Project Rule：

```text
.cursor/rules/context-workbook.mdc
```

它是 Agent Requested 规则。Cursor Agent 在相关任务中可以自动使用；你也可以在聊天里明确提到：

```text
Use the context-workbook rule. Pack examples/web-archive.md into tmp/web.cwb, validate it, and read Claims A1:D8.
```

如果 Cursor 没自动加载规则，打开 Command Palette，运行 `New Cursor Rule` 或进入 Cursor Settings > Rules，确认项目规则存在。

## 5. Cursor Commands

本仓库还包含：

```text
.cursor/commands/cwb-pack.md
.cursor/commands/cwb-experiment.md
```

在 Cursor Chat 中输入 `/`，应该能看到这些命令。

示例：

```text
/cwb-pack examples/pr-review.md --recipe annotated-pr-review
```

```text
/cwb-experiment
```

## 6. Recipe 选择表

| 输入类型 | 推荐 recipe |
| --- | --- |
| 网页、X、文章、聊天记录 | `web-or-chat-archive` |
| 计划、规格说明、实施方案 | `implementation-plan` |
| PR、diff、代码审查 | `annotated-pr-review` |
| 代码库理解、模块图 | `module-map` |
| 设计 token、组件矩阵 | `design-system-reference` |
| 原型状态、动效参数 | `prototype-snapshot` |
| 概念解释、研究笔记 | `research-explainer` |
| 周报 | `status-report` |
| 事故复盘 | `incident-report` |
| 拖拽分桶、feature flag、prompt tuner | `custom-editor-export` |
| 多方案比较 | `compare-options` |

## 7. 读包协议

给任何 AI agent 的固定指令：

```text
Do not read the whole artifact first.
Read manifest.json.
Pick relevant sheets and suggestedRanges.
Read only those CSV ranges.
Use workbook.xlsx or artifact.html only for human visual review.
```

这条协议是省 token 的核心。

## 8. 实验复现

运行：

```bash
node ./src/cli.ts experiment --out experiments/results
```

输出：

- `experiments/results/experiment-summary.csv`
- `experiments/results/experiment-results.json`
- `experiments/results/experiment-report.md`
- `experiments/results/experiment-report.html`
- `experiments/results/bundles/*.cwb`

实验比较三种路径：

- `markdown-full`：传统 Markdown 全文读取。
- `html-source`：传统 HTML artifact 源码读取。
- `cwb-small`：Context Workbook 的 manifest + 高优先级 sheet ranges。

准确率指标是 deterministic fact coverage：每个场景有 5 个必须传达的事实，只有当消费上下文包含该事实的所有关键词时才算传达成功。

## 9. 网页兼容性检查

网页打包后，先看 `Compatibility Matrix`：

```bash
node ./src/cli.ts pack examples/mixed-web.html --recipe web-or-chat-archive --out tmp/mixed.cwb
node ./src/cli.ts read tmp/mixed.cwb --sheet "Compatibility Matrix" --range A1:D6
node ./src/cli.ts read tmp/mixed.cwb --sheet Images --range A1:H10
node ./src/cli.ts read tmp/mixed.cwb --sheet "Extracted Tables" --range A1:D20
node ./src/cli.ts read tmp/mixed.cwb --sheet "Code Blocks" --range A1:D10
```

对应关系：

- 文字：`Sections` 和 `Text Blocks`
- 照片/图片：`Images`
- 表格：`Extracted Tables`
- 代码：`Code Blocks`
- 链接：`Links`

默认不会下载远程图片，只保存 URL、alt、title、width、height、srcset。这样更安全，也更省 token。
