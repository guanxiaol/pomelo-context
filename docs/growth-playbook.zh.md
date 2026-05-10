# Pomelo 开源增长路线

这个文档面向项目维护者，用来把“没人看”拆成可以执行的动作。Star 不是靠喊出来的，通常来自三件事：别人立刻看懂、立刻跑起来、立刻相信它解决了一个真实问题。

## 1. 首页转化

- 首屏必须回答：Pomelo 是什么、比 Markdown/HTML 好在哪里、怎么 60 秒试用。
- 首页保留一张图：实验结果图适合建立可信度，social preview 适合传播。
- 不要只讲协议，要展示真实工作流：网页归档、聊天迁移、代码上下文、PR review。

## 2. 可信证据

- 每次新增场景都补一个 benchmark fixture。
- 指标至少包含 token 成本、必要事实覆盖率、结构保留分。
- 所有实验都可本地复现：`npm run experiment`。
- 对外表达时避免夸大：当前实验是确定性样例，不是所有材料的绝对结论。

## 3. 第一批用户

优先找这些人试：

- 经常在 Claude Code / Cursor 里丢上下文的开发者。
- 需要保存网页、X 线程、AI 聊天记录的人。
- 做知识库、研究报告、产品调研、PR review 的团队。
- 对 HTML artifact 感兴趣，但担心 token 成本的人。

## 4. 内容节奏

建议发布 5 条内容，而不是只发一次链接：

1. 问题帖：为什么 Agent 不应该总是读完整 Markdown/HTML？
2. Demo 帖：60 秒把网页材料打包成 `.cwb`。
3. 实验帖：Markdown vs HTML source vs CWB small-read。
4. 场景帖：AI 聊天记录迁移、代码上下文管理、网页归档。
5. 征集帖：收集真实材料，做公开 benchmark fixtures。

## 5. 下一步最能涨 Star 的功能

- 浏览器保存网页到 `.cwb` 的命令或扩展。
- ChatGPT / Claude / Cursor 聊天导出到 `.cwb` 的 recipe。
- 一个真实 GitHub PR review 转 `.cwb` 的端到端 demo。
- 一个在线 viewer：上传 `.cwb` 后浏览 manifest、sheets、notes、assets。
- 更多可复现实验：长网页、长聊天、代码仓库、设计文档。

## 6. Star 请求文案

可以直接用这句：

> If you believe agent context should be structured, sliceable, and measurable instead of just longer prompts, please star Pomelo and try it on one real artifact.

中文：

> 如果你也觉得 AI Agent 的上下文不应该只是更长的提示词，而应该可索引、可切片、可验证，欢迎 star Pomelo，并拿一个真实网页/聊天记录/代码上下文试一下。
