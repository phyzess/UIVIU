# UIVIU

> A Rigorous Derivation of Something Entirely Useless, Yet Perfectly Symmetrical.
>
> 经过严谨的非严谨推导，最终得到一个没有实际用途，但看起来很对称的结果。

关于代码、生活、思考，以及一些本来不必想那么多的事情。UIVIU 记录 LIFE · THOUGHTS · CODE。

**阅读博客：[uiviu.me](https://uiviu.me)**

## 这个仓库是什么

站点代码：Astro 模板、Tailwind 设计 token、品牌文案、内容 schema、测试和构建配置。它把文章渲染成静态页面，但**不保存任何文章**。

写作内容——文章、文章图片和关于页——在私有仓库 `phyzess/uiviu-content` 里维护，构建前由 `scripts/content.mjs` 暂存到被 Git 忽略的 `src/content/`。这样代码可以公开，草稿和写作历史不必跟着公开。

## 本地运行

需要 Node.js 24.20.0 与 pnpm 12.3.4（见 `.node-version` 和 `package.json`）。

```bash
pnpm install
pnpm content:sync --from ~/personal/uiviu-content   # 暂存私有内容
pnpm dev
```

开发服务器默认在 `http://localhost:4321`。`pnpm build` 生成站点和搜索索引，`pnpm preview` 预览构建结果；`pnpm verify` 依次执行字体、类型检查、lint、格式、测试和构建。

只想验证代码、不动私有仓库时，用 `pnpm content:sync:fixtures` 暂存 `tests/fixtures/content/` 里的测试样稿——它们只用于检查，永远不会被部署。

## 内容流程

| 命令                              | 作用                                             |
| --------------------------------- | ------------------------------------------------ |
| `pnpm content:sync --from <path>` | 从本地私有克隆暂存 `posts/` 与 `pages/`          |
| `pnpm content:sync:fixtures`      | 暂存测试样稿（公开 CI 用）                       |
| `pnpm content:sync:remote`        | 用只读凭据读取私有仓库（Cloudflare 用）          |
| `pnpm content:status`             | 当前暂存的来源、提交和草稿数                     |
| `pnpm content:check`              | `src/content/` 一旦被 Git 跟踪就失败             |
| `pnpm build:prod`                 | 读取私有内容后构建，即 Cloudflare 的生产构建命令 |

文章有两种写法：没有素材时是 `posts/<slug>.md`，有图片时是 `posts/<slug>/index.md` 加同目录素材；两种写法的 URL 都是 `/posts/<slug>/`。

写作格式、草稿规则和图片约定见 [内容说明](docs/agents/content.md)；日常写作流程见内容仓库自己的 README。

## 结构

```text
src/components/  SiteHeader、PostList、Sidebar、TableOfContents 等
src/layouts/     BaseLayout、PostLayout
src/lib/         品牌文案、查询、分类、阅读时长与进度、搜索
src/pages/       首页、笔记、归档、分类、搜索、关于、404、RSS
src/styles/      Tailwind 入口、@theme token、正文排版
src/content/     （被忽略）构建时暂存的内容
scripts/         fonts.mjs（字体子集）、content.mjs（内容暂存）
tests/           Vitest 单元测试与内容 fixture
docs/agents/     设计、内容、工作流与待办说明
```

Astro 7 · TypeScript strict · Tailwind CSS 4 · Shiki · Pagefind · @astrojs/rss · @astrojs/sitemap · Vitest · Oxlint · Oxfmt。

## 部署

Cloudflare Workers Builds 负责构建与部署：推送到 `main` 触发一次构建，构建命令 `pnpm build:prod` 先从私有仓库读取内容，再交给 `npx wrangler deploy` 上传 `dist/`。私有仓库的 `push` 通过 Deploy Hook 触发同一条流水线，所以改文章不需要动这里。

`.github/workflows/ci.yml` 只做检查（类型、lint、格式、测试、构建），不持有私有仓库凭据，也不部署。运维细节见 [工作流说明](docs/agents/workflow.md)。

## 许可

站点代码采用 [MIT 许可证](LICENSE)。文章内容 © phyzess，在私有仓库维护、经站点公开。字体及其许可说明见 [字体说明](public/fonts/README.md)。
