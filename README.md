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

模块依赖、裁剪和升级步骤见 [交接指南](docs/template-handoff.md)；本轮改动见 [变更记录](CHANGELOG.md)，验收证据见 [任务队列](docs/template-readiness-queue.md)。

## 初始化副本

初始化脚本可重复执行，并只改模板元数据、展示名称、本地 favicon 和权限字符串前缀；它不会更改 Vite Fake Server 配置或添加任何真实 API。先使用 dry-run 审阅将要变更的文件和 SHA-256，再去掉该参数执行。

```bash
pnpm init:template -- --project-name warehouse-console --display-name "仓储控制台" --permission-prefix warehouse --logo ./brand.svg --logo-sha256 <brand.svg 的 SHA-256> --dry-run
```

`--logo-sha256` 可选；提供后脚本会在写入前校验素材。执行成功会生成 `.template-init.json`，记录最终文件与 logo 的校验和，便于复核。支持 `.png`、`.svg` 和 `.ico` 图标。

## 质量命令

以下是检查入口，不要求每次修改全部执行。日常按 [项目验证规则](AGENTS.md#9-测试与完成定义) 选择相关组件、页面和测试；全量检查用于大范围改动及 CI/发布验收。

```bash
pnpm run typecheck
pnpm test -- --run
pnpm run test:e2e
pnpm run lint
pnpm run check:circular-deps
pnpm run check:unused
pnpm run build:prod
```

代码托管与 CI 唯一入口是 [GitLab 项目](https://gitlab.gx1024.com/product-ui/admin-temp)，本地 `origin` 指向该仓库；Cloudflare Pages 只承载预览，不另设 GitHub 镜像或发布入口。

GitLab CI 使用锁定的 `@playwright/test` 版本安装 Chromium，并串行执行 E2E。默认流水线只检查和构建。

经当次明确授权后，可在推送 `main` 时显式触发现有 [Cloudflare Pages 预览站](https://antd-admin-template.pages.dev) 的更新：

```bash
git push -o ci.variable="PUBLISH_TEMPLATE_PREVIEW=true" origin main
```

只有默认分支且该变量为 `true` 时才发布，代码检查和完整 E2E 必须先通过。沿用 GitLab 已配置的 `CLOUDFLARE_ACCOUNT_ID`、`CLOUDFLARE_API_TOKEN` 和现有 `production` 环境；这里发布的仍是 Fake-only UI 预览，不是生产业务系统。发布产物记录当前提交 SHA，凭据不得写入仓库。具体产品需另行明确自己的发布流程。

ESLint 拦截运行时代码中的直接 HTTP 调用、计时器补丁、类型逃逸和规则禁用；依赖检查同时覆盖 `src` 与 `fake`，禁止 API/Fake 反向依赖页面和运行时代码导入测试。例外以 `AGENTS.md` 为准。

## 边界

- 这是 UI 母版，不是生产后端、真实认证或部署底座。
- 所有请求必须经过 `src/api`，并由 `fake/*.fake.ts` 实现 `/api/*`。
- 前端权限仅控制菜单、路由和操作显隐，不构成安全边界。
- 不添加真实 API、数据库、代理、Session/CSRF、SSR、微前端或具体产品业务。
