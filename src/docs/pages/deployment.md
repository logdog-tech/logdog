## 环境准备

前端基于 Vue 3、TypeScript 和 Vite，日期解析模块使用 Rust / WebAssembly。仓库 CI 使用 Node.js 20。完整构建还需要 Rust stable、wasm32-unknown-unknown 目标和 wasm-pack。

```bash
git clone https://github.com/logdog-tech/logdog.git
cd logdog
npm ci
```

## 本地开发

```bash
npm run dev -- --port 5175
```

分析器在 `/`，本文档在 `/docs/`。文档使用独立入口，和前端一起构建；Markdown 正文位于 `src/docs/pages/`。

开发模式使用已有的 WASM 包。修改 Rust 源码后，需要执行 `npm run build:wasm` 重新生成。

## 生产构建

在已安装 rustup 的环境中，先准备工具链：

```bash
rustup default stable
rustup target add wasm32-unknown-unknown
cargo install wasm-pack --locked
npm run build
```

`npm run build` 会复制 libarchive 资源、构建 WASM，并执行类型检查和 Vite 打包。输出目录为 `dist/`。只执行 `build-only` 会跳过前置步骤，不应替代完整发布构建。

## 静态托管

部署完整 `dist/` 目录，并确保 `.wasm` 使用 `application/wasm` MIME 类型，脚本、字体、Worker 文件可正常访问。通过 HTTP(S) 提供页面，不要直接以本地文件协议打开生产产物。

应用路由需要回退到 `index.html`，但真实的 `/docs/index.html` 与静态资源应优先返回。文档内部使用哈希路由，不需要为每篇文档添加服务器规则。

## Netlify 预览

仓库已有 `netlify.toml`：Node.js 20，发布目录 `dist`，构建前初始化 Rust 并安装 wasm-pack。连接仓库后，核对 Netlify 实际采用的构建命令，文件配置可能覆盖控制台配置。

如出现「rustup could not choose a version of cargo」，应检查默认工具链是否初始化成功。若需要重新发布，区分站点重新部署与 GitHub Release 下载包，二者不是同一流程。

## 验证与发布包

```bash
npm run type-check
npm run test:unit
npm run build
```

推送 main 会触发 Build and Test 工作流。推送 `v*` 标签会触发 Release 工作流，构建后生成 ZIP 与 tar.gz 文件。发布标签之前应确认提交内容与版本号，普通推送不会自动生成 Release。
