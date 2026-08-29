# AntD Admin Template - AI 执行规则

## 1. 规则解释

- `MUST` / “必须”：缺失即未完成。
- `MUST NOT` / `NEVER` / “禁止”：不得以兼容、临时或保险为由绕过。
- `SHOULD` / “应”：默认执行；不执行时必须说明可验证的原因。
- 当需求与“项目边界”冲突时，停止实现并报告冲突，不得静默扩大项目职责。
- 修改前读取相关所有者、调用链、测试和 `git status`；保留用户及无关改动。
- 只调查和修改完成当前任务所需的范围。

## 2. 项目边界

本仓库是公司内部的 `antd-admin-template` 产品 UI 母版，是 **Fake-only 纯前端项目**。

### 必须包含

- 页面、通用组件、主题、响应式、国际化、前端交互、测试。
- 支撑完整演示所需的 Fake Server API 和当前预览会话内的内存状态。
- 开发和生产预览都启用 Fake Server；构建产物离线可完整运行。

### 禁止包含

- 真实后端、真实 API 地址、后端代理、数据库、Fake/Real 开关。
- 真实认证、Session、CSRF、服务端 RBAC、生产部署、SSR、微前端。
- SS、Agg、Chatroom、游戏、租户等具体产品业务。
- 真实凭据、令牌、个人数据或看起来可用的生产数据。

前端权限只控制菜单、路由和操作显隐，不是安全边界。安全改进不得把母版扩张成生产前后端底座。

## 3. 技术事实与交付边界

- `package.json` 和锁文件是版本事实来源。当前基线：React 19、TypeScript 6、Vite 8、React Router 8、Ant Design 6、TanStack Query 5、Node.js 24、pnpm 11。
- 优先使用现有依赖：i18next、`vite-plugin-fake-server`、`@ant-design/pro-components`、`antd-style`、`antd-img-crop`、`@dnd-kit/*`、dayjs、Vitest、Testing Library、Playwright。
- 仅在现有技术无法满足且有证据时增加依赖；禁止引入平行框架或同类库。
- 包管理器固定为 pnpm。安装、开发、预览使用 `pnpm install --frozen-lockfile`、`pnpm dev`、`pnpm preview`。
- 正式源码目录固定为 `D:\Dev\antd-admin-template`；统一验收地址为 `http://127.0.0.1:3003`。
- worktree 只用于隔离任务，禁止复制覆盖正式仓库；主任务负责合并、冲突处理和最终验证。
- 每个完成的逻辑修改必须提交本地 Git 并报告 SHA。默认禁止推送、部署或写入外部系统；这类操作需要当次明确授权。

## 4. 架构与数据所有权

唯一数据链路：

```text
页面 / 领域组件
  -> TanStack Query useQuery / useMutation
  -> src/api/<domain>
  -> src/api/client.ts
  -> /api/*
  -> fake/<domain>.fake.ts
```

### 目录职责

- `src/app/`：应用装配、路由、权限、Provider、跨页面行为。
- `src/features/<domain>/`：路由页面、领域组件、领域行为测试。
- `src/api/<domain>/index.ts`：领域请求函数；`types.ts`：领域契约。
- `src/api/client.ts`：唯一 HTTP 请求边界。
- `fake/*.fake.ts`：Fake HTTP 接口和共享内存状态。
- `src/locales/`：全部用户文案。
- `e2e/`：高价值跨路由流程。

禁止新增废弃体系：`src/pages`、`src/router/routes/static`、`src/store`。

### 页面与状态

- 路由页面只负责 Query、Mutation、URL/路由会话状态和页面级编排。
- 复杂表单、Drawer、筛选栏、表格、详情拆到领域组件；组件用明确 Props 回传意图。
- 服务端数据只由 TanStack Query 持有。禁止通过 `useEffect` 抄入 Zustand 或本地 state 形成第二份真值。
- 本地 state 只保存局部 UI 草稿；路由会话状态统一使用 `useRouteSessionState`。
- 查询草稿、已应用条件、分页、排序、选择、表单草稿各有一个明确所有者，禁止双向同步两份可写状态。
- 公告管理是完整 Fake CRUD 参考领域；复用其数据流和行为覆盖，禁止复制整页实现。

### API 与 Fake

- 页面和领域组件必须调用 `src/api`，禁止直接调用 `fetch`、axios 或导入 `fake`。
- 请求函数使用领域命名，如 `listPlatformUsers`、`getPlatformUser`、`updatePlatformUser`。
- 成功响应固定为 `{ code, msg, data }`。
- HTTP 分页固定为 `{ items, total, page, page_size }`；只在领域 API 层转换前端命名。
- Fake URL 不含 Vite 的 `/api` basename，且不得依赖 Node 专属运行时模块。
- Fake 接口文件必须以 `.fake.ts` 结尾；Fake 路由测试必须复用 `fake/route-helpers.ts`，禁止每个测试重复类型强转。
- Fake CRUD 必须在当前预览会话内保留写入结果；写后查询必须可见。
- Fake 必须校验代表性错误；种子数据覆盖分页、筛选、排序、空态和代表性状态。

## 5. 根因修复与反补丁

### 必须流程

1. 用最短路径复现问题，记录期望结果和可观察证据。
2. 沿输入、状态、请求、布局或生命周期找到唯一责任层（owning layer）。
3. 在责任层做最小完整修复；删除被替代的补丁、旧路径和过时测试。
4. 先复验原问题，再跑相关回归；最后扫描触及范围是否仍有补丁和重复实现。
5. 同一症状连续两次修复失败后，停止加代码，先审计相关 diff、历史和调用链。

### 禁止模式

- 禁止用 `data?.x ?? 默认值` 隐藏本应存在的数据；先修上游契约、初始化或响应转换。可选链只用于业务上确实可选的数据。
- 禁止用 `setTimeout`、`setInterval`、轮询或重复刷新等待状态“稳定”。业务确需重试时，必须是有上限、可观察、只针对已证明的瞬时失败。
- 禁止空 `catch {}` 或仅吞错。必须处理、报告，或调用命名清楚的降级函数。
- 禁止 `as any`、`: any`、`as unknown as`、`@ts-ignore`、`@ts-expect-error` 和 `eslint-disable` 掩盖契约问题。
- 禁止 `!important`、宽泛全局 CSS、Ant Design 内部类覆盖、重复硬编码颜色或无法解释的布局魔法数字。
- 禁止旧/新实现并行、兼容分支长期共存、同一功能两套入口。明确迁移合同除外，但必须有删除条件。
- 禁止绕开 `src/api/client.ts`、硬编码 API host、页面导入 Fake。
- 禁止注释掉的代码、不可达文件、未用导出，以及 `utils` / `helpers` / `common` / `Manager` 式职责不明的杂物层。
- 禁止为了通过测试而隐藏、禁用或延迟故障路径。

### 当前唯一允许的例外

- `fetch` 只允许存在于 `src/api/client.ts`。
- 主题原始十六进制颜色只允许集中在 `src/app/preferenceStorage.ts`。
- `src/app/preferenceStorage.ts` 和 `src/app/routeSessionState.ts` 的可选浏览器存储不可用时可降级；catch 必须调用各自的命名降级函数。
- `src/features/admin-shell/TwoColumnServiceMenu.module.css` 可用最窄的 `:global(ul[role="menu"])` 布局 Ant Design 生成的二级菜单 DOM。
- JSON Schema URL、SVG namespace，以及 Playwright/Vite 的本地预览 URL 不属于 API host。

新增例外必须同时满足：上游或公开 API 无法控制、范围位于责任层、代码旁说明原因、行为有测试，并把具体文件和用途加入本节。未登记的例外一律不允许。

## 6. 代码简洁与交接

- 名称必须表达领域和意图；共享逻辑放在最小共同所有者，禁止建立万能工具层。
- 只有重复模式已经稳定且抽象能减少真实复杂度时，才提取公共能力。
- 注释只解释“为什么”和不可见约束，不复述代码。
- 删除功能时同步删除路由、导航、API、Fake、文案、权限、测试和不可达残件。
- 路由文件达到 800 行，或同时拥有查询、表单、表格、详情等 3 个以上职责时，新增功能前必须审查拆分；优先拆组件或 Hook。纯声明配置可保留，禁止只为行数进行无关重构。
- 变更后，新开发者应能从路由定位到领域页面、API、Fake、文案、权限和测试，无需阅读职责混杂的巨型文件。

## 7. 界面与交互

### 通用

- 标准控件和图标使用 Ant Design、`@ant-design/icons`；禁止手写复刻 Button、Table、Form、Drawer、Modal、Tabs、Result、Skeleton、Upload、通知。
- 用户指定 Ant Design/Pro 参考页时，保持其信息结构、间距、加载和交互，只适配本项目版本、国际化、Fake API、主题、响应式。`@ant-design/pro-components` 能准确承载时直接复用。
- 尺寸、颜色、圆角、边框、阴影优先使用 Theme Token 和组件默认值。领域样式留在领域内；跨页面规则归应用层。
- 顶栏头像入口保持 44px，搜索、语言、主题、通知入口保持 36×36px。顶栏入口、侧栏、横向导航及展开子菜单的水波纹是项目增强，不是 Ant Design Pro 默认效果；统一使用 `usePressRipple` 和 `PressRipple.module.css`，导航复用 `NavigationMenu`。横向一级菜单统一直角，展开子菜单保留组件圆角。按下触发、长按保持、松开淡出、连续点击重新触发，悬停展开不触发；禁止叠加旧按压底色，保留原生导航、焦点、选中高亮、下划线和禁用状态。
- 数据管理页默认使用完整内容区宽度；表单、详情、设置页保持可读宽度。
- PageContainer 内容区四周使用 `token.paddingLG`；通过公开 Token 配置，壳层不得重复添加 padding。
- 独立表格页在路由声明 `contentLayout: "table"`，由壳层统一提供四周 `token.paddingLG`；Card、Drawer、Modal 内嵌表格沿用容器间距，不重复添加页面 padding。
- 独立表格 Card 正文使用 `0 token.paddingLG token.padding` 内边距；`ListToolBar` 必须是正文第一项，禁止使用 Card `title/head`，说明、额外内容和错误态自行提供间距。
- 卡片不增加重阴影、异常圆角或重复标题。Drawer/Modal 宽度响应内容；长内容独立滚动、操作区固定；390px 下占满可用宽度。
- 覆盖必要的 hover、focus、active、disabled、loading、error、danger 状态。
- 路由和大内容区域用 Skeleton；表格刷新只用 Table `loading`。
- 关键页面覆盖加载、正常、空、失败、无权限状态；检查桌面和窄屏无重叠、溢出。
- 普通编辑直接进入流程。重置密码、强制下线、不可恢复删除必须使用 danger 和明确确认。

### 管理表格

- 管理表格统一由 `ManagementProTable` 渲染原生 ProTable；`LogTablePanel` 只适配领域查询配置和错误态，不另建查询或表格外层。查询布局统一使用 `managementQueryLayout`，由 Pro 负责栅格、标签宽度、展开收起、工具栏和分页；排序复用 `resolveTableSort`，领域页面不得重写公共布局及工具栏算法。
- 查询栏按容器宽度自适应；窄屏默认保留一个主要条件，其余标准展开/收起；查询、重置保持统一顺序、间距和靠右布局。
- 默认提供 10/20/50/100 分页、升/降/取消三档排序、刷新、密度、列设置。工具栏遵循 ProTable 默认配置，不增加表格全屏；全屏只保留壳层标签栏入口。
- 所有 Table 和 ProTable 默认使用 `middle` 密度；允许用户主动切换并持久化，不得在页面写死 `large` 或 `small`。
- 1440px 是完整工作基线；1920px 只增强空间。窄屏保留身份、状态、主操作等核心列，必要时横向滚动，禁止为塞满单屏压缩到不可读。
- `useRouteSessionState` 保存查询草稿、已应用条件、展开、分页、排序；切换/刷新恢复，重置清空，关闭标签删除；必须测试恢复、重置和关闭清理。
- 列显示、顺序、密度使用现有偏好存储；禁止缓存整页、服务端数据、选中行、弹窗、未提交表单或危险确认。
- 行操作不超过两个时直接展示；三个及以上时保留常用低风险操作，其余进入带图标的 Ant Design Dropdown。复用 `TableActionButton` 和 `tableActions`。
- 主标识列和操作列不可隐藏；操作列始终最后。领域列只声明重要级别、最小宽度、是否必显，不得修改公共排序、响应式和持久化算法。
- 逐表按任务安排列序：通常为主标识、核心信息、归属/分类、状态、时间、操作；日志可时间优先。`required` 固定显示，`recommended` 默认显示可关闭，`optional` 默认隐藏可开启；1440px 只用于可读性验收，保留用户既有偏好。
- 只有适合横向比较的字段进入列设置；长正文、原始追踪 ID、完整变更等只进详情。详情按业务含义分组，覆盖当前契约中全部允许查看的业务字段，不含选择框和操作列；关联对象显示必要身份信息，不递归复制。只读嵌入表不强加详情与列设置。
- 只有真实批量价值时启用 `rowSelection`。批量删除必须确认；普通批量启停不要求输入名称；成功后清理失效选择并刷新 Fake 查询。
- 新表格页通过标准组件 Props 组合差异，禁止复制用户管理或日志页。

### 标签与核心管理

- 页面标签使用 Ant Design Tabs 和现有 `@dnd-kit/*` 横向换位。
- 仪表盘固定首位，不可关闭、拖动、让位或执行其他标签操作。
- 标签右键菜单和右侧工具菜单必须复用同一套状态与命令。
- 用户基础编辑、角色分配、密码重置保持独立流程；角色分配使用多选草稿统一保存并展示新增/移除差异。
- 角色基础编辑与权限配置保持独立流程；权限配置使用完整 Ant Design Tree、抽屉草稿、统一保存，禁止把角色名称或状态塞进权限抽屉。

## 8. 路由、权限、国际化与前端安全

- 业务路由和导航统一注册在 `src/app/adminRoutes.ts` 并懒加载。
- 新增路由必须同时增加标题、导航图标和所有已支持语言的文案。
- 中文是主要产品语言；禁止在组件内散落用户文案。
- 权限统一使用 `PlatformPermission`、`platformPermissions` 和现有权限 Hook；无权限操作直接隐藏。
- 权限名保持 `platform.*`，除非任务明确要求全仓库迁移。
- 禁止 `eval`、`new Function` 和未经可信清洗的 `dangerouslySetInnerHTML`。
- 本地存储只保存非敏感偏好和允许的路由会话状态；禁止保存凭据、模拟安全令牌或把前端权限当授权结果。
- 新窗口外链必须防止 opener 劫持；错误信息和日志不得包含真实秘密或个人数据。
- 依赖变更必须运行 `pnpm audit --prod`，处理或明确报告每个告警；禁止用全局 ignore 隐藏风险。

## 9. 测试与完成定义

### 测试规则

- 行为修改先写失败测试，再做最小实现。
- 重构前为即将移动的行为补特征测试。
- 测试用户可见行为、状态、响应契约和错误；禁止用文件存在、源码字符串或偶然 DOM 结构证明功能正确。
- API/Fake 测试覆盖响应契约、校验、错误和内存 Mutation。
- Testing Library 覆盖关键表单、筛选、弹窗、权限和页面状态。
- Playwright 只覆盖高价值跨路由流程，不重复组件测试。

### 页面体验巡检

- 涉及布局、主题、表格、导航、Drawer、Modal、响应式或高频交互的修改，必须运行对应页面的轻量体验巡检。
- 巡检至少覆盖 1440px、768px、390px 视口，验证页面打开、宽窄切换、核心交互和布局恢复。
- 巡检必须检查页面级横向溢出、文本重叠、按钮遮挡、弹层溢出、控制台错误、请求失败和明显卡顿。
- 有自动化脚本时必须记录页面打开、视口切换、核心交互耗时，并输出 p50 / p95。
- 浏览器验收必须使用当前源码的新构建；动画相关检查必须观察真实启动和结束状态，计时只覆盖目标界面的可用状态，不等待无关装饰动画。
- 初始阈值：单页打开 < 5000ms；页面打开 p50 < 1500ms、p95 < 3000ms；单次视口切换 < 800ms、p95 < 700ms；单次核心交互 < 1000ms、p95 < 800ms。
- 超阈值、控制台错误、请求失败、页面级横向溢出、明显重叠或明显卡顿均视为未完成。必须先定位责任层再优化，禁止用延时、强刷、禁用测试掩盖问题。

### 必跑验证

每次源码、配置或依赖修改必须获得以下命令的新鲜通过结果：

```bash
pnpm run typecheck
pnpm test -- --run
pnpm run lint
pnpm run check:circular-deps
pnpm run check:unused
pnpm run build:prod
```

- 涉及路由、壳层、导航、登录预览、跨页面流程：再运行 `pnpm run test:e2e`。
- 涉及布局、主题、表格、Drawer、Modal、响应式：启动页面，人工检查桌面和 390px 窄屏。
- 涉及依赖：再运行 `pnpm audit --prod`。
- 仅文档修改至少运行 `git diff --check`；不得宣称应用行为已验证。
- 交付前扫描触及范围：定时器/重试、吞错、类型逃逸、规则禁用、样式覆盖、API 越界、重复状态、旧实现、死代码；所有命中必须修复或符合“当前唯一允许的例外”。
- 没有新鲜验证结果、必要页面证据和干净的相关 diff，不得宣称完成。

### 完成报告

报告必须包含：根因或改动目的、责任层、删除的旧补丁/重复路径（没有则明确说明）、验证结果、本地提交 SHA、开发服务器验收地址（如已启动）。
