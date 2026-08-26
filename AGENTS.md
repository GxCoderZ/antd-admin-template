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

## 技术与交付

- `package.json` 和锁文件是版本事实来源；当前基线为 React 19、TypeScript 6、Vite 8、React Router 8、Ant Design 6、TanStack Query 5、Node.js 24 和 pnpm 11。
- 主要配套包括 i18next、`vite-plugin-fake-server`、`@ant-design/pro-components`、`antd-style`、`antd-img-crop`、`@dnd-kit/*`、dayjs、Vitest、Testing Library 和 Playwright。除非已确认需求无法由现有技术满足，否则不增加平行框架或同类库。
- 包管理器固定使用 pnpm；安装、开发和预览命令分别为 `pnpm install --frozen-lockfile`、`pnpm dev` 和 `pnpm preview`。
- 唯一正式源码目录是 `D:\Dev\antd-admin-template`，用户验收地址统一为 `http://127.0.0.1:3003`。worktree 只用于隔离任务，不得直接复制覆盖正式仓库。
- 隔离任务提交本地 Git 并报告 SHA；主任务负责合并、冲突处理和最终验证。默认不推送或部署，外部仓库、Cloudflare、Webhook 等操作须获得当次明确授权。

## 架构与组织

```text
页面 / 领域组件
  -> TanStack Query useQuery / useMutation
  -> src/api/<domain>
  -> src/api/client.ts
  -> /api/*
  -> fake/<domain>.fake.ts
```

- `src/app/`：应用装配、静态路由、权限、Provider 和跨页面行为。
- `src/features/<domain>/`：路由页面、领域组件及行为测试。
- `src/api/<domain>/`：`index.ts` 放请求函数，`types.ts` 放领域契约；`src/api/client.ts` 是唯一请求边界。
- `fake/`：领域 Fake HTTP 接口和共享内存状态；`src/locales/` 放全部用户文案；`e2e/` 放 Playwright 流程。

路由页面负责 Query、Mutation、URL 状态和页面级编排；复杂表单、Drawer、筛选栏、表格及详情拆为领域组件。组件通过明确 Props 回传意图，本地 UI 优先使用局部状态。仅在重复模式稳定且能降低复杂度时提炼公共能力。

不要新增已废弃的 `src/pages`、`src/router/routes/static` 或 `src/store` 体系。公告管理是完整 Fake CRUD 参考领域，新增管理领域应沿用其数据流和行为覆盖，不复制其页面实现。

## UI 与样式规则

- 标准控件和图标使用 Ant Design、`@ant-design/icons`；禁止手写复刻 Button、Table、Form、Drawer、Modal、Tabs、Result、Skeleton、Upload 或通知组件。
- 用户指定 Ant Design 或 Pro 参考页时，先核对当前页面及可用源码，保持其信息结构、间距、加载与交互，只适配本项目版本、国际化、Fake API、主题和响应式。能由 `@ant-design/pro-components` 准确承载时直接复用，不维护平行仿制实现。
- 尺寸、颜色、圆角、边框和阴影优先使用 Theme Token 与组件默认值；页面样式留在所属领域，跨页面覆盖集中在应用层。
- 数据密集型管理页默认使用完整内容区宽度；表单、详情和设置页按官方参考保持可读宽度，不用一套全局最大宽度强行约束所有页面。
- 卡片不增加重阴影、异常圆角或重复标题。Drawer、Modal 根据内容选择克制且响应式的宽度；长内容独立滚动、操作区固定，390px 下占满可用宽度。
- 中文是主要产品语言；用户文案进入现有国际化体系并覆盖全部受支持语言。交互按需覆盖 hover、focus、active、disabled、loading、error 和 danger；无权限操作直接隐藏。
- 路由和大内容区域加载使用 Ant Design Skeleton；表格刷新使用 Table 的 `loading`，不把表格行替换成骨架屏。
- 关键页面覆盖加载、正常、空数据、失败和无权限状态；检查桌面与窄屏，避免重叠或溢出。
- 普通编辑直接进入编辑流程，不要求确认。重置密码、强制下线、不可恢复删除等高影响操作必须保持 danger，并使用明确确认。

### 管理表格

- 复用 `LogQueryPanel`、`LogTablePanel`、`useQueryFilterLayout`、`QueryFilterSubmitter` 和 `resolveTableSort` 提供的查询、响应式及表格算法，不在领域页面重写。
- 查询栏按容器宽度自适应：窄屏默认保留一个主要条件，其余通过标准展开/收起显示；查询与重置保持统一顺序、间距和靠右布局。
- 管理表格默认提供 10/20/50/100 分页、升序/降序/取消排序三档排序，以及刷新、密度、列设置和全屏工具；领域页面只提供字段、列、权限和业务操作。
- 管理表格以 1440px 桌面视口作为默认完整工作基线，1920px 只做空间增强；窄屏默认保留身份、状态、主操作等核心列，其余列可通过标准列设置恢复，必要时保留横向滚动，不为塞满单屏而压缩到不可读。
- 管理表格统一复用 `useRouteSessionState` 保存查询草稿、已应用条件、展开状态、分页和三档排序；标签切换或刷新时恢复，重置时清空，关闭标签时删除。
- 列显示、顺序和密度使用现有偏好存储；接口数据仍由 TanStack Query 管理。不要缓存整页、选中行、弹窗、未提交表单或危险确认；测试状态恢复、重置与关闭清理。
- 行操作不超过两个且不溢出时直接展示；三个及以上时保留最常用的低风险操作，其余通过带图标的 Ant Design Dropdown 展示。复用 `TableActionButton` 和 `tableActions`，不另写溢出算法。
- 主标识列和操作列不可隐藏，操作列始终位于最后；领域列只声明重要级别、最小宽度和是否必显，不改变公共排序、响应式和持久化算法。
- 只有确有批量业务价值的表格才启用 `rowSelection`；批量删除必须确认，普通批量启停不要求输入名称，操作成功后清理失效选择并刷新对应 Fake 查询。
- 新增表格页通过标准组件 Props 组合领域差异，不复制用户管理或日志页面。

## 标签栏与核心领域交互

- 页面标签使用 Ant Design Tabs 和现有 `@dnd-kit/*` 横向换位；仪表盘固定首位，不允许关闭、拖动、让位或执行其它标签操作。
- 标签右键菜单与右侧工具菜单复用同一套操作和状态。
- 用户基础编辑、角色分配和密码重置保持独立流程；角色分配使用多选草稿统一保存并展示新增/移除差异，不恢复逐项即时提交。
- 角色基础编辑与权限配置保持独立流程；权限配置使用完整 Ant Design Tree、抽屉内草稿和统一保存，不把角色名称或状态塞进权限抽屉。

## API 与 Fake 规则

- 请求函数使用 `listPlatformUsers`、`getPlatformUser`、`updatePlatformUser` 等领域化命名，统一经过 `src/api/client.ts`；页面禁止直接调用 `fetch`。
- 成功响应统一为 `{ code, msg, data }`。
- HTTP 分页数据为 `{ items, total, page, page_size }`，领域 API 层可转换为前端命名。
- Fake 文件以 `.fake.ts` 结尾，URL 不含 Vite 的 `/api` basename，且不得依赖 Node 专属运行时模块。
- Fake CRUD 必须保留当前预览会话内的内存变化；写操作后再次查询必须看到变化。
- 种子数据应足以演示分页、筛选、排序、空态和代表性状态。

## 路由、菜单与权限

- 业务路由和导航统一注册在 `src/app/adminRoutes.ts` 并使用懒加载；新增路由同步增加标题、导航图标和全部语言文案。
- 使用现有 `PlatformPermission`、`platformPermissions` 和权限 Hook 控制显隐。
- 权限名沿用 `platform.*` 命名空间，除非另行批准全仓库统一改名。
- 删除领域时同步删除路由、导航、API、Fake、文案、权限和测试，不保留不可达残件。

## 测试与质量

- 行为修改先写失败测试，再做最小实现。
- 优先测试用户可见行为，避免以文件存在和源码字符串断言冒充功能测试。
- API/Fake 测试覆盖响应契约、校验、错误和内存 Mutation；Testing Library 覆盖关键表单、筛选、弹窗、权限及页面状态。
- Playwright 只覆盖高价值跨路由流程，不重复全部组件测试。
- 重构前为即将移动的行为补特征测试。
- 不锁定偶然 DOM 结构或 Ant Design 内部实现细节。

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

每个完成的逻辑修改提交一个本地 Git 版本；开发服务器运行时提供统一验收地址。
