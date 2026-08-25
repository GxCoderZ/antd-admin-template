# AntD Admin Template

`antd-admin-template` 是公司内部的 Fake-only React 后台 UI 母版。它提供可复制的页面、壳层、权限显隐、国际化和响应式交互；不连接真实服务、数据库或认证系统。开发和生产预览始终由本地 Fake Server 支撑，因此构建产物可以离线完整演示。

## 启动

需要 Node.js 24 和 pnpm 11（版本以 `package.json` 为准）。

```bash
pnpm install --frozen-lockfile
pnpm dev
```

打开终端输出的本地地址，以 `admin` / `admin` 登录预览。生产预览使用相同的 Fake 数据流：

```bash
pnpm run build:prod
pnpm preview
```

## Fake 数据流

页面和领域组件只能通过 API 层访问数据：

```text
页面 / 领域组件 → src/api/<domain> → src/api/client.ts → /api/* → fake/<domain>.fake.ts
```

`fake/store.ts` 保存当前浏览器预览会话内的可变内存数据；新增、编辑和删除后再次查询会看到变化。页面不得直接导入 Fake 文件或数据。

## 扩展一个领域

1. 在 `src/api/<domain>/types.ts` 定义请求与响应契约，并在 `index.ts` 通过 `src/api/client.ts` 请求 `/api/*`。
2. 在 `fake/<domain>.fake.ts` 实现对应接口和当前会话内存行为。
3. 先补 API/Fake 与页面行为测试，再在 `src/features/<domain>/` 编排页面和领域组件。
4. 在 `src/app/adminRoutes.ts` 注册懒加载路由、菜单图标、`platform.*` 权限和全部语言文案。
5. 覆盖加载、空态、失败、权限和窄屏，并通过下面的质量门槛。

公告管理是完整的参考领域。不要把页面直接连到真实后端，也不要添加 Fake/Real 开关。

## 初始化副本

初始化脚本可重复执行，并只改模板元数据、展示名称、本地 favicon 和权限字符串前缀；它不会更改 Vite Fake Server 配置或添加任何真实 API。先使用 dry-run 审阅将要变更的文件和 SHA-256，再去掉该参数执行。

```bash
pnpm init:template -- --project-name warehouse-console --display-name "仓储控制台" --permission-prefix warehouse --logo ./brand.svg --logo-sha256 <brand.svg 的 SHA-256> --dry-run
```

`--logo-sha256` 可选；提供后脚本会在写入前校验素材。执行成功会生成 `.template-init.json`，记录最终文件与 logo 的校验和，便于复核。支持 `.png`、`.svg` 和 `.ico` 图标。

## 质量命令

```bash
pnpm run typecheck
pnpm test -- --run
pnpm run test:e2e
pnpm run lint
pnpm run check:circular-deps
pnpm run check:unused
pnpm run build:prod
```

GitLab CI 使用锁定的 `@playwright/test` 版本安装 Chromium，并串行执行稳定的 E2E；既有的 Cloudflare Pages 发布 job 会等待质量与 E2E 都通过后，才在默认分支发布预览。

## 边界

- 这是 UI 母版，不是生产后端、真实认证或部署底座。
- 所有请求必须经过 `src/api`，并由 `fake/*.fake.ts` 实现 `/api/*`。
- 前端权限仅控制菜单、路由和操作显隐，不构成安全边界。
- 不添加真实 API、数据库、代理、Session/CSRF、SSR、微前端或具体产品业务。
