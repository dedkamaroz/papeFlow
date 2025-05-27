# papeFlow - Project Setup

## 1. Create Project Directory

```bash
mkdir papeFlow
cd papeFlow
npm init -y
```

## 2. Install Dependencies

```bash
# Core Electron + React + TypeScript
npm install --save-dev electron electron-builder @types/node
npm install --save-dev typescript @types/react @types/react-dom
npm install --save-dev webpack webpack-cli webpack-dev-server
npm install --save-dev @pmmmwh/react-refresh-webpack-plugin react-refresh
npm install --save-dev html-webpack-plugin copy-webpack-plugin
npm install --save-dev ts-loader css-loader style-loader

# React and UI Libraries
npm install react react-dom
npm install reactflow @reactflow/core @reactflow/controls @reactflow/background
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-image @tiptap/extension-link
npm install zustand immer
npm install tailwindcss autoprefixer postcss
npm install lucide-react

# Database
npm install better-sqlite3 @types/better-sqlite3
npm install uuid date-fns
npm install electron-store

# Development tools
npm install --save-dev @typescript-eslint/eslint-plugin @typescript-eslint/parser
npm install --save-dev eslint prettier eslint-config-prettier
npm install --save-dev concurrently cross-env
```

## 3. Initialize TypeScript

```bash
npx tsc --init
```

## 4. Initialize Tailwind CSS

```bash
npx tailwindcss init -p
```

## 5. Create Project Structure

```bash
mkdir -p src/main/database
mkdir -p src/main/ipc
mkdir -p src/renderer/components/FlowCanvas
mkdir -p src/renderer/components/Editor
mkdir -p src/renderer/components/Checklist
mkdir -p src/renderer/components/Media
mkdir -p src/renderer/components/Layout
mkdir -p src/renderer/stores
mkdir -p src/renderer/hooks
mkdir -p src/renderer/utils
mkdir -p src/renderer/pages
mkdir -p src/shared/types
mkdir -p src/shared/constants
mkdir -p public
mkdir -p dist
```
