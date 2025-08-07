# LogDog 项目 AI 编码助手指南

## 架构概览

LogDog 是一个全栈日志分析工具，采用 Vue 3 前端和 FastAPI 后端：
- **前端**: Vue 3 + TypeScript + Tailwind CSS + PrimeVue + Pinia
- **后端**: FastAPI + Peewee ORM + MySQL + 微信/OAuth 认证
- **WebAssembly**: 基于 Rust 的日期解析器，用于高性能日志处理
- **存储**: IndexedDB 用于客户端持久化，MySQL 用于服务器数据

## 核心开发模式

### Vue 组件风格约定
- **重要**: 所有 Vue 组件必须使用 Options API 风格编写
- 避免使用组合式 API (Composition API)
- 使用 `data()`, `methods`, `computed`, `mounted` 等选项式语法
- 组件内使用 `this.$t()` 进行国际化，模板中使用 `$t()`

### WASM 集成
- 日期解析由 `wasm/date-parser/` 中的 Rust WASM 模块处理
- 开发前构建 WASM: `npm run build:wasm`
- WASM 输出在 `wasm/pkg/` 中，作为 `date-parser` 包被消费

### 多语言支持 (Tolgee)
- 模板中使用 `$t('key.path')`，脚本中使用 `this.$t('key.path')`
- 键值定义在 `public/i18n/*.json` 文件中
- 提取键值: `tolgee extract --patterns "src/**/*.vue" --parser vue`
- 同步到平台: `tolgee sync -au http://127.0.0.1:8080 -ak <api-key> -p 4`

### 日志处理架构
- `src/modules/base.ts` 中的 `BaseLine` 接口表示解析后的日志条目
- 通过 `LogFile` 接口处理文件，包含状态跟踪
- 使用 `HugeList` 组件进行虚拟滚动以提升性能
- 在 `src/workers/` 中使用 Web Workers 进行客户端处理

### 后端 API 结构
- `backend/app/api/` 中的模块化 FastAPI 路由器
- 通过多个提供商进行认证：微信、GitHub、Google、Linux.DO
- 使用 loguru 进行结构化日志记录，包含请求跟踪
- 通过 `backend/app/core/config.py` 进行基于环境的配置

## 关键开发命令

```bash
# 前端开发（包含 WASM 构建）
npm run dev

# 后端开发（包含 API 文档）
cd backend && ./terminal -d

# 生产环境构建
npm run build

# 仅重新构建 WASM
npm run build:wasm

# 国际化键值提取和同步
tolgee extract --patterns "src/**/*.vue" --parser vue
```

## 组件模式

### LogdogEditor.vue
- 主要日志查看组件，双面板布局（完整视图 + 搜索结果）
- 使用虚拟滚动 (`HugeList`) 处理大型日志文件
- 使用 `glow-border` 和 `border-animation` 类进行行高亮
- 与 `SearchBar` 组件集成搜索功能
- **严格使用 Options API 风格编写**

### 认证流程
- 微信二维码扫描作为主要认证方式
- OAuth 提供商作为替代方案（GitHub、Google、Linux.DO）
- JWT 令牌进行会话管理
- 用户工作区概念支持协作日志分析

## 文件组织约定

- 前端模块在 `src/modules/` 中处理核心业务逻辑
- 工具函数在 `src/utils/` 中，包含专门的子目录 (`extractors/`, `parsers/`, `providers/`)
- PrimeVue 组件使用自定义 Aura 主题预设
- 整个项目启用 TypeScript 严格模式
- **所有 Vue 组件使用 Options API 风格，避免 Composition API**

## 关键集成点

- **WebAssembly**: 性能关键的日期解析操作
- **IndexedDB**: 通过 `src/utils/db.ts` 进行客户端日志存储
- **Web Workers**: 大文件后台处理
- **PWA**: 通过 vite-plugin-pwa 注册 Service Worker
- **归档支持**: 使用 libarchive.js 处理 zip/gz/zst 文件解压

## 环境配置

后端需要环境变量（参见 `terminal` 文件）：
- `LOGDOG_FRONTEND_URL`
- OAuth 提供商凭据（微信、GitHub、Google、Linux.DO）
- 用于 JWT 签名的 `SECRET_KEY`

后端使用 Peewee ORM 配合 MySQL，前端使用 Pinia 进行状态管理。
