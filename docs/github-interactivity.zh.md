# GitHub 上能放可交互组件吗？

可以，但要区分位置。

## README 里

GitHub README 适合放：

- PNG / SVG 图表和 logo。
- Mermaid 图。
- badge。
- `<details>` 折叠块。
- 普通链接、表格、图片。

README 不适合放真正的 JavaScript 组件。GitHub 会对 README 渲染出来的 HTML 做安全清理，脚本和危险属性会被移除。因此 README 里的“交互”只能做得很轻，例如折叠、链接跳转、Mermaid 展示。

## GitHub Pages 里

GitHub Pages 适合放真正可交互的 HTML/CSS/JavaScript 静态页面。Pomelo 现在把交互 demo 放在 `site/index.html`，并用 `.github/workflows/pages.yml` 部署。

上线后地址是：

https://guanxiaol.github.io/pomelo-context/

## Pomelo 的做法

- README：放 logo、科研风格实验图、核心指标和 60 秒 demo。
- GitHub Pages：放 Benchmark Explorer 和 Agent Range-Read Simulator。
- `assets/`：放可复用的 SVG/PNG 传播素材。
- `site/`：放可以点击切换指标和模拟读取的静态交互页面。

## 参考

- GitHub Pages 是托管 HTML、CSS、JavaScript 静态文件的服务：https://docs.github.com/articles/user-organization-and-project-pages
- GitHub Pages 可以通过 GitHub Actions 部署：https://docs.github.com/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
- GitHub README 渲染会清理危险 HTML：https://github.com/github/markup
