# UIVIU

> A Rigorous Derivation of Something Entirely Useless, Yet Perfectly Symmetrical.
>
> 经过严谨的非严谨推导，最终得到一个没有实际用途，但看起来很对称的结果。

关于代码、生活、思考，以及一些本来不必想那么多的事情。

UIVIU 是一个个人博客，记录 LIFE · THOUGHTS · CODE。文章用 Markdown 编写，站点以静态页面发布。

**阅读博客：[uiviu.me](https://uiviu.me)**

## 本地运行

需要 Node.js 24.20.0 和 pnpm 12.3.4；版本分别记录在 `.node-version` 和 `package.json` 中。

```bash
pnpm install
pnpm dev
```

开发服务器默认运行在 `http://localhost:4321`。运行 `pnpm build` 构建站点及搜索索引，再用 `pnpm preview` 预览构建结果。提交前可运行 `pnpm verify` 完成检查、测试和构建。

## 写文章

每篇文章是 `src/content/posts/` 中的一个 Markdown 文件，文件名就是文章 URL 的 slug。文章的 frontmatter 必须包含 `title`、`description`、`pubDate`、`category` 和 `draft`；`category` 可选 `life`、`thoughts` 或 `code`。

`draft: true` 的文章不会出现在列表、文章页面、搜索、RSS 或站点地图中。关于页面的正文在 `src/content/pages/about.md`。完整的写作格式、图片和草稿规则见 [内容说明](docs/agents/content.md)。

## 项目说明

站点使用 Astro、TypeScript 和 Tailwind CSS 构建；搜索由 Pagefind 生成，静态文件由 Cloudflare Workers 提供。开发环境、字体和部署细节见 [项目工作流](docs/agents/workflow.md)。

## 许可

站点代码采用 [MIT 许可证](LICENSE)。文章内容 © phyzess，除非另有注明。字体及其许可说明见 [字体说明](public/fonts/README.md)。
