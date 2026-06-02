# LogDog

高性能日志分析工具，支持海量日志文件的实时浏览、搜索和高亮标记。

## 在线体验

**LogDog** 同时提供完整的 SaaS 版本，无需本地部署即可使用全部功能：**[logdog.tech](https://logdog.tech)**

本仓库为 LogDog 的前端部分，包含完整的日志查看、搜索过滤、高亮规则、时间排序等核心交互能力。

## 功能特性

- 亿级日志行流畅滚动，基于虚拟列表的 HugeList 组件
- 正则搜索与区分大小写切换
- 自定义高亮规则，支持颜色标记和预过滤器
- 多文件拖拽加载，自动按时间排序
- 多编码支持，自动检测文件编码
- 支持 ZIP / RAR / TAR / 7z 等压缩包直接加载
- 日志行选中、复制、导出
- WebAssembly 加速的日期解析
- 暗色模式
- PWA 支持，可离线使用

## 技术栈

- Vue 3 + TypeScript
- Vite
- Tailwind CSS
- PrimeVue
- Rust / WebAssembly (wasm-pack)
- Pinia

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 生产构建
npm run build
```

### 构建 WASM

```bash
# 需要预先安装 wasm-pack
# curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh

npm run build:wasm
```

## 项目结构

```
src/
├── api/          # API 接口层
├── components/   # Vue 组件
├── modules/      # 业务模块
├── router/       # 路由配置
├── utils/        # 工具函数
└── views/        # 页面视图
public/           # 静态资源
wasm/             # Rust WASM 模块
```

## License

[Apache-2.0](https://www.apache.org/licenses/LICENSE-2.0)
