# 多零标签 - 在线标签设计与条码生成工具

## 项目简介

多零标签是一个功能强大的在线标签设计与条码生成工具，支持可视化标签编辑器、二维码/条形码生成、批量导入导出、模板管理等功能。基于 Cloudflare Pages + KV 构建，提供高性能、低延迟的全球访问体验。

## 功能特性

- **可视化标签编辑器**：拖拽式设计，自由调整标签元素位置、大小、样式
- **二维码/条形码**：支持多种条码格式（Code128、EAN-13、QR Code 等）
- **批量导入导出**：支持 Excel/CSV 批量数据导入，一键生成多张标签
- **模板管理**：内置多种标签模板，支持自定义模板保存与管理
- **后台管理系统**：完整的管理员后台，支持用户、模板、数据管理
- **Cloudflare Pages 部署**：一键部署到 Cloudflare 边缘网络

## 技术栈

- **前端框架**：React 18 + TypeScript
- **构建工具**：Vite 5
- **样式方案**：TailwindCSS 3
- **部署平台**：Cloudflare Pages + KV
- **条码生成**：jsbarcode、qrcode
- **图标库**：lucide-react
- **路由管理**：react-router-dom

## 本地开发

### 环境要求

- Node.js >= 18
- npm >= 9

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

### 预览生产构建

```bash
npm run preview
```

## 部署说明

### 方式一：Cloudflare Pages Git 集成

1. **创建 KV 命名空间**

   登录 Cloudflare Dashboard，进入 Workers & Pages → KV，创建两个命名空间：
   - 生产环境命名空间（用于生产部署）
   - 预览环境命名空间（用于预览部署）

   记录下两个命名空间的 ID。

2. **创建 Pages 项目**

   - 进入 Cloudflare Dashboard → Workers & Pages → Create → Pages
   - 选择 "Connect to Git"，连接你的 Git 仓库
   - 选择项目仓库和分支

3. **配置构建参数**

   - **Build command**: `npm run build`
   - **Build output directory**: `dist`

4. **配置环境变量和 KV 绑定**

   在项目 Settings → Functions 中：
   - 添加 KV Namespace Bindings：
     - Variable name: `LABEL_KV`
     - KV namespace: 选择你创建的生产环境命名空间
     - KV namespace (preview): 选择你创建的预览环境命名空间

5. **触发部署**

   推送代码到 Git 仓库，Cloudflare Pages 会自动触发部署。

### 方式二：Wrangler CLI 部署

1. **安装 Wrangler**

   ```bash
   npm install -g wrangler
   ```

2. **登录 Cloudflare**

   ```bash
   wrangler login
   ```

3. **创建 KV 命名空间**

   ```bash
   wrangler kv:namespace create LABEL_KV
   wrangler kv:namespace create LABEL_KV --preview
   ```

4. **配置 wrangler.toml**

   将创建的 KV 命名空间 ID 填入 `wrangler.toml` 中的对应位置：
   - `LABEL_KV_ID_PLACEHOLDER` → 生产环境 KV ID
   - `LABEL_KV_PREVIEW_ID_PLACEHOLDER` → 预览环境 KV ID

5. **部署**

   ```bash
   npm run build
   npm run deploy
   ```

## 默认管理员账号

- **用户名**：admin
- **密码**：admin123

> ⚠️ 注意：首次部署后请立即修改默认管理员密码，确保系统安全。

## 项目结构

```
barcode-generator/
├── functions/              # Cloudflare Pages Functions
│   └── api/                # API 路由
│       ├── barcode.ts      # 条形码生成 API
│       └── qrcode.ts       # 二维码生成 API
├── public/                 # 静态资源
│   └── _redirects          # 重定向配置
├── src/                    # 源代码
│   ├── components/         # 公共组件
│   │   ├── AdminLayout.tsx
│   │   ├── BatchImport.tsx
│   │   ├── Header.tsx
│   │   ├── PreviewPanel.tsx
│   │   ├── ProtectedRoute.tsx
│   │   └── SettingsPanel.tsx
│   ├── data/               # 静态数据
│   │   └── templates.ts    # 模板数据
│   ├── hooks/              # 自定义 Hooks
│   │   ├── useAuth.ts
│   │   ├── useBarcode.ts
│   │   └── useQRCode.ts
│   ├── pages/              # 页面组件
│   │   ├── admin/          # 后台管理页面
│   │   │   ├── Content.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── Stats.tsx
│   │   │   ├── Templates.tsx
│   │   │   └── Users.tsx
│   │   └── Editor.tsx      # 标签编辑器页面
│   ├── types/              # TypeScript 类型定义
│   │   └── index.ts
│   ├── utils/              # 工具函数
│   │   ├── api.ts
│   │   ├── barcodeFormats.ts
│   │   ├── exportUtils.ts
│   │   ├── fileParser.ts
│   │   └── qrCodeFormats.ts
│   ├── App.tsx             # 应用入口组件
│   ├── index.css           # 全局样式
│   └── main.tsx            # 应用入口文件
├── .github/                # GitHub 配置
│   └── workflows/          # GitHub Actions
│       └── deploy.yml      # 部署工作流
├── .gitignore              # Git 忽略配置
├── index.html              # HTML 模板
├── package.json            # 项目依赖配置
├── postcss.config.js       # PostCSS 配置
├── tailwind.config.js      # TailwindCSS 配置
├── tsconfig.json           # TypeScript 配置
├── tsconfig.node.json      # TypeScript Node 配置
├── vite.config.ts          # Vite 配置
└── wrangler.toml           # Wrangler 配置
```

## 许可证

MIT License
