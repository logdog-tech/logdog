# LogDog 静态文档与搜索接入

## 发布边界

首页 `/` 继续承载日志分析器。文档构建使用独立 Vite 配置，不加载分析器、WASM、PWA 或账户模块。每篇文章输出完整 HTML、真实目录路径、独立标题、描述、canonical 和结构化数据。搜索、深色主题与代码复制通过 Vue hydration 增强，关闭 JavaScript 仍可阅读正文和访问文章。

## 文档站与主站

- GitHub Pages：`DOCS_BASE_PATH=/logdog/ VITE_SITE_ORIGIN=https://logdog-tech.github.io npm run build:docs`。发布 `dist-docs/`。
- 主站：`npm run build`（`build:site` 为同义入口）。包含完整产品构建与 `/docs/`，发布 `dist/`。
- 主站仅更新文档：`npm run build:docs`。把 `dist-docs/` 部署到站点 root 下的 `docs/`；不覆盖首页或应用资源。

`DOCS_BASE_PATH` 必须以斜杠开头和结尾。`VITE_SITE_ORIGIN` 为站点的协议和域名。独立部署时用实际域名构建，避免 canonical 指向其他站点。现有 `#/search` 等链接在客户端自动迁移到真实路径。

主站文档已发布。GitHub Pages 继续可独立访问，其工作流使用 `VITE_CANONICAL_SITE_ORIGIN=https://logdog.tech` 与 `VITE_CANONICAL_BASE_PATH=/docs/` 将 canonical 和结构化数据统一到主站；资源路径仍使用 `/logdog/`。避免两份内容竞争主站的主要搜索入口。

## Nginx 接入与回滚

1. 备份当前 Nginx 配置与已有文档目录；使用带版本号的新目录部署文档。
2. 在现有 `server` 块中合并 `nginx-docs.conf`，确认现有 `root` 与实际静态目录一致。不要替换整个服务器配置。
3. 确认没有更高优先级的 UA 分流将所有请求送到 CLI。建议 CLI 响应限制在 `/cli/`；至少确保 docs、robots、sitemap 不经过该分流。
4. 主站根目录放置真实 `robots.txt` 与 `sitemap.xml`。`assemble-site.mjs` 可生成这些文件，但在线仅更新文档时不要覆盖整个应用 dist。
5. 执行 `nginx -t`，通过后原子切换 docs 目录并 reload。不要删除旧版本及其资源，保留用于回滚和旧标签页加载。
6. 确认 `/` 的 HTML 与上线前一致；`/docs/`、任意文章和资源返回 200，未知文章返回 404；robots 为纯文本、sitemap 为 XML；模拟百度 UA 检查结果。
7. 如出现问题，将 docs 软链接切回上一版本并恢复 Nginx 配置，验证配置后 reload。产品首页不参与这次切换。

站点已有 Service Worker 时，确保其导航回退不会接管 `/docs/`。仓库应用构建已包含 docs 排除规则。若服务器上运行旧版 Worker，应单独发布该排除修复，或评估将文档隔离到 docs.logdog.tech，不能通过清除所有用户缓存来上线。

## 百度接入

在百度搜索资源平台添加并验证 https://logdog.tech，验证文件通过精确静态路径返回。检查抓取异常与索引量；提交 https://logdog.tech/sitemap.xml，并通过账户当前提供的普通收录接口提交新页面。提交 token 只保存在服务端环境或 CI secret 中，禁止放入前端。

这次代码不会代替站点所有者登录、验证或获取提交 token。平台提交不保证收录或排名。跟踪抓取成功、有效索引、搜索曝光、点击和打开产品的转化；未配置统计事件时，不声称已获得转化数据。
