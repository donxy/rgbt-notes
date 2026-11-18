# RGB-T 论文笔记

公开站点：https://donxy.github.io/rgbt-notes/

使用 Quartz 4 构建，内容来自 [awesome-RGBT-ObjectDetection](https://github.com/donxy/awesome-RGBT-ObjectDetection) 的论文目录及衍生笔记。当前内容包含 102 篇论文（74 核心 / 28 附录）、86 篇全文精读、24 个数据集、六个研究专题和论文四维对比页。

## 主要目录

- `content/core/`、`content/appendix/`：论文笔记。
- `content/themes/`：研究主题。
- `content/indexes/`：多维索引。
- `content/datasets/`：数据集及总览。
- `content/compare.md`：对比字段。
- `quartz.config.ts` / `quartz.layout.ts`：站点配置与布局。

## 开发与发布

```bash
npm ci
npx quartz build --serve
```

向 `main` 推送后由 `.github/workflows/deploy.yml` 发布到 GitHub Pages；PR 由 `validate-quartz.yml` 检查构建。

三个站点共享基础视觉 token（主站 `https://donxy.github.io/design/shared.css`）；本仓库保留独立配色与布局，CSS 有本地 fallback。

跨站架构与数据同步说明见 [个人主站工程文档](https://github.com/donxy/donxy.github.io/blob/main/docs/ARCHITECTURE.md)。
