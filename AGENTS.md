# AntD Admin Template 前端开发规则

## 作用与硬边界

本仓库是公司内部使用的 `antd-admin-template` 产品 UI 母版。它是 **Fake-only 纯前端项目**：只负责页面、通用组件、主题、响应式、国际化、前端交互、测试，以及驱动这些能力所需的 Fake Server 状态。

必须遵守：

- 禁止连接真实后端，禁止添加真实 API 地址、后端代理、数据库或 Fake/Real 开关。
- 页面和领域组件必须调用 `src/api`；`src/api` 发出 `/api/*` 请求；`fake/*.fake.ts` 实现对应接口。
- 页面禁止直接导入 Fake 数据或 Fake 文件。
- Fake Server 在开发和生产预览中都必须启用，构建后的 UI 离线即可完整运行。
- 前端权限只控制菜单、路由和操作显隐，不代表真实安全边界。
- 不实现真实认证、Session、CSRF、服务端 RBAC、生产部署、SSR 或微前端。
- 不加入 SS、Agg、Chatroom、游戏、租户等具体产品业务；具体产品从母版复制后独立演进。
- 母版保持为公司后台页面资产库，不扩张成前后端生产底座。

## 技术基线

锁文件和 `package.json` 是版本事实来源。当前基线：

- React 19、React DOM 19。
- TypeScript 6。
- Vite 8。
- React Router 8。
- Ant Design 6、`@ant-design/icons` 6。
- TanStack Query 5。
- i18next、react-i18next。
- `vite-plugin-fake-server`。
- Vitest、Testing Library、Playwright、ESLint、Knip、dependency-cruiser。
- Node.js 24、pnpm 11。

除非现有技术无法满足已经确认的项目需求，否则不增加平行的 UI 框架、请求库、全局状态库、路由、图标库或样式体系。

## 命令

包管理器固定使用 pnpm：

```bash
pnpm install --frozen-lockfile
pnpm dev
pnpm run typecheck
pnpm test -- --run
pnpm run test:e2e
pnpm run lint
pnpm run check:circular-deps
pnpm run check:unused
pnpm run build:prod
pnpm preview
```

## 架构与数据流

```text
页面 / 领域组件
  -> TanStack Query useQuery / useMutation
  -> src/api/<domain>
  -> src/api/client.ts
  -> /api/*
  -> fake/<domain>.fake.ts
```

| 路径                        | 职责                                              |
| --------------------------- | ------------------------------------------------- |
| `src/app/`                  | 应用装配、路由元数据、权限、Provider 和跨页面行为 |
| `src/features/<domain>/`    | 路由页面及领域内组件                              |
| `src/api/<domain>/index.ts` | 领域请求函数                                      |
| `src/api/<domain>/types.ts` | 请求、响应和领域契约                              |
| `src/api/client.ts`         | 唯一的 `/api` 请求与统一响应边界                  |
| `fake/<domain>.fake.ts`     | 对应领域的 Fake HTTP 接口                         |
| `fake/store.ts`             | Fake 接口共享的当前预览会话内存数据               |
| `src/locales/`              | 中文优先及其他受支持语言的文案                    |
| `src/styles/`               | 全局样式和主题 CSS                                |
| `src/features/admin-shell/` | 应用壳层、导航、账户菜单和壳层设置                |
| `src/app/adminRoutes.ts`    | 静态业务路由和导航元数据                          |
| `e2e/`                      | Playwright 浏览器流程                             |

不要新增已经废弃的 `src/pages`、`src/router/routes/static` 或 `src/store` 目录体系，除非另行批准整个仓库统一迁移。

## 页面组织规范

非简单领域优先采用：

```text
src/features/<domain>/
|-- <Feature>Page.tsx
|-- components/
|   |-- <Feature>Form.tsx
|   `-- <Feature>Detail.tsx
|-- <Feature>Page.test.tsx
`-- featureTypes.ts          # 仅在需要纯展示类型时增加

src/api/<domain>/
|-- index.ts
`-- types.ts

fake/<domain>.fake.ts
```

- 路由页面负责 Query、Mutation、URL 状态和页面级编排。
- 大段 Modal、Drawer、筛选栏、表格和详情内容拆到领域组件。
- API 契约放在 `src/api/<domain>/types.ts`，页面内不重复定义传输类型。
- 常量默认靠近所有者；只有确实降低页面复杂度或形成复用时才抽取。
- 领域组件通过明确 Props 回传用户意图，不暗中控制无关路由或全局状态。
- 本地 UI 使用 React 状态；只有真正跨路由共享的状态才提升到应用级。
- 不做推测式通用抽象；至少出现稳定的重复模式后再提炼公共能力。

## UI 与样式规则

- 标准控件和交互优先使用 Ant Design，禁止手写复刻 Button、Table、Form、Drawer、Modal、Tabs、Result、Skeleton、Upload 或通知组件。
- 有合适图标时使用 `@ant-design/icons`。
- 尺寸和颜色优先读取 Ant Design Theme Token，避免散落与主题绑定的硬编码。
- 全局 Ant Design 覆盖集中管理；页面专属样式留在所属领域。
- 中文是主要产品语言；所有用户可见文案必须进入现有国际化体系并覆盖全部受支持语言。
- 交互组件按需要覆盖 hover、focus、active、disabled、loading、error 和 danger 状态。
- 无权限操作直接隐藏，不把 `disabled` 当权限控制。
- 路由和大内容区域加载使用 Ant Design Skeleton；表格刷新使用 Table 的 `loading`，不把表格行替换成骨架屏。
- 普通管理表格必须优先复用现有标准查询栏、响应式布局 Hook 和表格工具组件；当前实现以 `LogQueryPanel`、`LogTablePanel`、`useQueryFilterLayout` 和 `resolveTableSort` 为准，不在领域页面重新实现同类算法。
- 查询栏按容器宽度自适应：窄屏默认保留一个主要查询项，其余条件通过标准展开/收起交互显示；禁止用页面专属 CSS 或固定断点复制另一套折叠逻辑。
- 管理表格默认提供 10/20/50/100 分页、升序/降序/取消排序三档排序，以及刷新、密度、列设置和全屏工具；领域页面只提供字段、列、权限和业务操作。
- 管理表格行操作默认直接展示最常用且低风险的操作（通常为编辑；角色等领域可另有一个同等高频的主操作），其余操作统一收进 Ant Design Dropdown 的“更多”；“更多”菜单项使用 `@ant-design/icons` 对应图标。
- 行操作优先复用现有 `TableActionButton`、`tableActions` 等标准能力，禁止各领域页面自行实现不同的排列、折叠或溢出算法。
- 不复制整个用户管理或日志页面来新增表格页；通过标准组件 Props 组合领域差异，稳定的公共行为只维护一份。
- 关键页面覆盖加载、正常、空数据、失败和无权限状态。
- 核对桌面和窄屏；文本、按钮和内容不得重叠或溢出容器。
- 普通编辑直接进入编辑流程，不要求确认。重置密码、强制下线、不可恢复删除等高影响操作必须保持 danger，并使用明确确认。

## API 与 Fake 规则

- 请求函数使用 `listPlatformUsers`、`getPlatformUser`、`updatePlatformUser` 等领域化命名。
- 请求统一经过 `src/api/client.ts`，页面禁止直接调用 `fetch`。
- 成功响应统一为 `{ code, msg, data }`。
- HTTP 分页数据为 `{ items, total, page, page_size }`，领域 API 层可转换为前端命名。
- Fake 文件以 `.fake.ts` 结尾，声明的 URL 不包含 Vite 的 `/api` basename。
- 生产预览启用的 Fake 文件不得依赖 Node 专属运行时模块。
- Fake CRUD 必须保留当前预览会话内的内存变化；写操作后再次查询必须看到变化。
- 种子数据应足以演示分页、筛选、排序、空态和代表性状态。
- 页面不得知道数据来自 Fake。

## 路由、菜单与权限

- 业务路由和导航统一注册在 `src/app/adminRoutes.ts`。
- 路由页面使用懒加载。
- 新增路由时同步增加标题、导航图标和全部语言文案。
- 使用现有 `PlatformPermission`、`platformPermissions` 和权限 Hook 控制显隐。
- 权限名沿用 `platform.*` 命名空间，除非另行批准全仓库统一改名。
- 删除领域时同步删除路由、导航、API、Fake、文案、权限和测试，不保留不可达残件。

## 测试与质量

- 行为修改先写失败测试，再做最小实现。
- 优先测试用户可见行为，避免以文件存在和源码字符串断言冒充功能测试。
- API 和 Fake 测试覆盖响应契约、校验、错误状态和内存 Mutation 行为。
- 页面测试使用 Testing Library 覆盖关键表单、筛选、Modal/Drawer、权限、加载、空态和失败行为。
- Playwright 只覆盖高价值跨路由流程，不重复全部组件测试。
- 重构前为即将移动的行为补特征测试。
- 不锁定偶然 DOM 结构或 Ant Design 内部实现细节。

## 标准参考领域：公告管理

首个完整参考领域按以下结构落位：

```text
src/api/announcements/index.ts
src/api/announcements/types.ts
src/features/announcements/AnnouncementsPage.tsx
src/features/announcements/components/AnnouncementFormDrawer.tsx
src/features/announcements/AnnouncementsPage.test.tsx
fake/announcements.fake.ts
src/app/adminRoutes.ts
src/locales/*.ts
```

公告管理必须通过正常 API 到 Fake 数据流演示列表、查询、分页、新增、编辑、删除、状态、权限、加载、空态、错误和响应式。

## 固定开发流程

1. 确认领域及其通用产品价值。
2. 在 `src/api/<domain>/types.ts` 定义请求和响应契约。
3. 在 `src/api/<domain>/index.ts` 编写请求函数。
4. 在 `fake/<domain>.fake.ts` 实现当前预览会话行为。
5. 先写失败的行为测试。
6. 在 `src/features/<domain>` 实现页面和领域组件。
7. 注册路由、导航、权限和全部语言文案。
8. 验证加载、正常、空态、失败、权限、主题和响应式。
9. 执行完整质量门槛。
10. 每个完成的逻辑修改提交一个本地 Git 版本；开发服务器运行时同时提供本地测试地址。

## 完成门槛

每次代码修改必须获得以下命令的新鲜通过结果：

```bash
pnpm run typecheck
pnpm test -- --run
pnpm run lint
pnpm run check:circular-deps
pnpm run check:unused
pnpm run build:prod
```

涉及路由、壳层、导航、登录预览或跨页面流程时执行 `pnpm run test:e2e`。涉及布局、主题、表格、Drawer、Modal 或响应式时还要启动页面，人工检查桌面和窄屏。没有新鲜命令输出和页面检查证据，不宣称完成。
