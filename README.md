# LogDog

[![Build and Test](https://github.com/logdog-tech/logdog/actions/workflows/build.yml/badge.svg?branch=main)](https://github.com/logdog-tech/logdog/actions/workflows/build.yml)
![License](https://img.shields.io/github/license/logdog-tech/logdog)
![Version](https://img.shields.io/github/package-json/v/logdog-tech/logdog)

A high-performance log viewer for massive log files, with real-time browsing, search, and highlighting.

[中文文档](./README.zh-CN.md)

## Online

**LogDog** is also available as a fully-managed SaaS platform — no deployment needed: **[logdog.tech](https://logdog.tech)**

This repository contains the LogDog frontend, providing the full log viewing, searching, filtering, highlighting, and time-sorting experience.

## Features

- Smooth scrolling through billions of log lines via the HugeList virtual list component
- Regex search with case-sensitivity toggle
- Custom highlight rules with color markers and pre-filters
- Multi-file drag-and-drop, auto-sorted by timestamp
- Multi-encoding support with automatic detection
- Direct loading of ZIP, RAR, TAR, 7z, and other archive formats
- Log line selection, copy, and export
- WebAssembly-accelerated date parsing
- Dark mode
- PWA support for offline use

## Tech Stack

- Vue 3 + TypeScript
- Vite
- Tailwind CSS
- PrimeVue
- Rust / WebAssembly (wasm-pack)
- Pinia

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Production build
npm run build
```

### Build WASM

```bash
# Requires wasm-pack
# curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh

npm run build:wasm
```

## Project Structure

```
src/
├── api/          # API layer
├── components/   # Vue components
├── modules/      # Business modules
├── router/       # Route config
├── utils/        # Utility functions
└── views/        # Page views
public/           # Static assets
wasm/             # Rust WASM module
```

## License

[Apache-2.0](https://www.apache.org/licenses/LICENSE-2.0)
