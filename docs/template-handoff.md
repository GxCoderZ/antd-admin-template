# AntD Admin Template 交接指南

本文面向从母版创建或维护子项目的程序员。当前版本以 `package.json` 和锁文件为准；本文不引入新的业务示例、菜单或升级脚手架。

## 1. 核心层与可裁剪领域

核心层通常保留：

- `src/app/`：应用装配、路由、权限、Provider、主题、路由会话和表格公共能力；壳层实现在 `src/features/admin-shell/`。
- `src/api/client.ts`：唯一 HTTP 边界；页面不得直接使用 `fetch`、axios 或 Fake 文件。
- `src/locales/`：所有用户可见文案；新增路由必须同步所有已支持语言。
- `src/features/admin-shell/`、异常页、账户页和仪表盘：按产品需要保留或裁剪，并检查壳层引用。
- `fake/store.ts` 与 `fake/*.fake.ts`：预览会话内的 Fake Server 和可变内存数据。

可裁剪领域示例：组织用户、角色、部门、岗位、字典、公告、审计日志、登录日志。每个领域的典型依赖如下：

```text
adminRoutes.ts / 导航
  -> src/features/<domain>/ 页面与组件
  -> src/api/<domain>/ types.ts + index.ts
  -> src/api/client.ts -> /api/*
  -> fake/<domain>.fake.ts -> fake/store.ts（如需共享会话状态）
  -> src/app/permissions.ts + src/locales/* + 测试/e2e
```

裁剪领域时，先查 `rg "<domain>|相关路由|相关权限键" src fake e2e`，再按完整引用链处理；不要留下隐藏入口或孤立导出。

| 裁剪领域       | 必须同时审阅的消费者                                           |
| -------------- | -------------------------------------------------------------- |
| 用户、角色     | 用户角色分配、角色成员数、预览账号、仪表盘统计和操作目标名称   |
| 部门、岗位     | 用户部门选择、部门成员计数、岗位部门关联和删除校验             |
| 公告           | 仪表盘公告摘要和草稿数量；站内通知是独立领域，不随公告一并删除 |
| 审计、登录日志 | 仪表盘最近活动、今日登录统计和日志导航分组                     |
| 字典           | 类型与字典项成套裁剪，清理对应权限、导航、API 和 Fake 种子     |

## 2. 从公告管理新增领域

公告是完整 Fake CRUD 参考，不要复制整页实现。按以下路径新增 `<domain>`：

1. 在 `src/api/<domain>/types.ts` 定义领域契约，在 `src/api/<domain>/index.ts` 通过 `src/api/client.ts` 实现命名请求函数。响应保持 `{ code, msg, data }`；分页使用 HTTP 的 `page_size`，只在 API 层转换为前端命名。
2. 在 `fake/<domain>.fake.ts` 注册不含 Vite `/api` basename 的 Fake 路由。校验代表性错误，种子覆盖分页、筛选、排序、空态和代表性状态；写后查询必须在当前预览会话可见。Fake 路由测试复用 `fake/route-helpers.ts`。
3. 参考 `src/features/announcements/` 拆分领域页面、查询 Hook、表格面板、表单 Drawer、详情 Drawer 和行为测试。页面只编排 Query、Mutation、路由会话状态和组件 Props。
4. 在 `src/app/adminRoutes.ts` 增加懒加载函数、路由元数据、菜单节点、图标、`contentLayout` 和权限；路由与导航节点使用同一个 route key。
5. 在 `src/api/types.ts` 扩展 `PlatformPermission`，在 `src/app/permissions.ts` 增加对应常量，并同步 Fake 权限种子与权限树文案；通过权限 Hook 隐藏无权操作。前缀保持 `platform.*`。
6. 在 `src/locales/` 的每个受支持语言补齐导航、标题、字段、校验、加载/失败/空态、确认和操作文案。组件内不散落用户文案。
7. 增加 API/Fake 契约和错误测试、Testing Library 的关键交互/权限/状态测试；只有跨路由价值明确时才增加 `e2e/` 流程。

优先组合现有 `ManagementProTable`、`LogTablePanel`、`managementQueryLayout`、`resolveTableSort`、`useRouteSessionState` 等公共能力，不重写查询、工具栏、分页、排序或偏好算法。

## 3. 删除模块清单

删除 `<domain>` 必须在同一变更中检查并移除：

- `src/app/adminRoutes.ts` 的懒加载、路由元数据、导航节点、图标类型中仅被该模块使用的项。
- `src/features/<domain>/` 全部页面、组件、样式、测试和未用导出。
- `src/api/<domain>/` 契约、请求函数及仅供该领域使用的 Query key。
- `fake/<domain>.fake.ts`、种子数据及 Fake 注册引用；相关共享状态只在无其他消费者时删除。
- `src/api/types.ts` 的权限类型、`src/app/permissions.ts` 的权限常量、Fake 默认权限和权限配置中的对应项。
- `src/locales/*` 的导航、页面、操作、错误、状态和权限说明文案。
- `e2e/`、API/Fake、页面组件测试中针对该领域的用例、fixture 和选择器。
- 壳层、通知、命令面板、仪表盘、首页摘要、权限配置等跨域引用；同时清理 Query invalidate、链接、图标映射和不可达文件。

删除后用 `rg` 扫描领域名、路由、权限键和文案 key，再运行类型、未使用导出和循环依赖检查。不要用默认值或兼容分支掩盖遗漏。

## 4. 初始化副本与品牌替换

现有 `init:template` 只处理模板元数据、展示名称、favicon 和权限字符串前缀，不是通用升级系统；不会添加真实后端、真实 API 或 Fake/Real 开关。

先在复制后的子项目根目录执行 dry-run，不直接改原始母版；参数必须完整：

```bash
pnpm init:template -- --project-name warehouse-console --display-name "仓储控制台" --permission-prefix warehouse --logo ./brand.svg --logo-sha256 <brand.svg 的 SHA-256> --dry-run
```

检查 JSON 输出中的文件列表和前后 SHA-256。`--logo-sha256` 可选但建议提供；支持 `.png`、`.svg`、`.ico`。确认后去掉 `--dry-run` 执行。脚本会生成 `.template-init.json`，记录设置、文件摘要和 logo 校验和；不要手工改写其记录来伪造迁移历史。

## 5. 版本与迁移记录

母版版本保持现有版本号，升级前先记录：母版提交 SHA、日期、子项目基线、接收的文件/逻辑、未接收的领域差异、需要手工处理的冲突和验证结果。记录可放在子项目自己的迁移日志中；本母版不提供自动升级器。

本轮变更见 `CHANGELOG.md`，完成证据与提交记录见 `docs/template-readiness-queue.md`。未发布变更不等于正式版本，不因内部整理擅自修改版本号。

子项目选择性接收变更时，按文件和行为逐项审阅并手工合并：优先接收核心层、公共组件、修复和测试，再决定是否接收领域模块。保留子项目业务代码及本地改动，禁止 `git reset`、整仓覆盖、复制 worktree 覆盖正式仓库或无审阅的批量替换。每项接收变更都要检查调用链、权限、文案、Fake 和测试是否成套。

## 6. 边界、验证与验收

这是 Fake-only 纯前端母版：开发和生产预览都启用 Fake Server，构建产物可离线演示。禁止真实 API 地址、后端代理、数据库、真实认证/Session/CSRF、服务端 RBAC、SSR、微前端和具体产品业务；前端权限只控制显隐，不是安全边界。

源码、配置或依赖修改后运行：

```bash
pnpm run typecheck
pnpm test -- --run
pnpm run lint
pnpm run check:circular-deps
pnpm run check:unused
pnpm run build:prod
```

涉及路由、壳层或跨页流程，再运行 `pnpm run test:e2e`；涉及依赖，再运行 `pnpm audit --prod`。仅文档修改至少运行 `git diff --check`，不要据此声称应用行为已验证。

涉及页面、表格、Drawer、Modal、主题或响应式时，启动 `pnpm dev`，在 `1440px`、`768px`、`390px` 检查打开、核心交互、加载/空/失败/无权限状态、横向溢出、文本重叠、按钮遮挡、弹层边界、控制台错误和请求失败。1440px 是完整工作基线，窄屏保留核心列并允许必要的横向滚动。

代表页面巡检：先运行 `pnpm run build:prod`，再运行 `pnpm exec playwright test e2e/template-experience.spec.ts`。它覆盖用户、公告、字典和审计，额外检查 1286px，输出 `test-results/template-experience-*/page-*.png`、`overlay-*.png` 和 `experience-metrics.json`。同次运行内对比桌面初始/恢复截图，不把 Windows 字体基准强加给 Linux CI；跨提交的截图仍需人工审阅，不宣称已提供跨平台静态金图测试。

浏览器验收必须使用当前源码的新构建。采样以目标页面/弹层可用和实际运动结束为准，不把不相关的按钮涟漪算入打开耗时；不得关闭动画、增加延时或放宽阈值掩盖失败。遇到失败先看 JSON、错误上下文和截图，再定位责任层。
