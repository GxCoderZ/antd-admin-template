# Admin Temp 前端开发规则

## 作用与硬边界

本仓库是 `product-ui/admin-temp` 产品 UI 母版。母版以及从它复制出的所有产品 UI 仓库都是 **Fake-only**：只负责页面视觉、组件交互、主题和 CSS，Fake Server 只负责驱动界面状态。

必须遵守：

- 禁止连接真实后端，禁止添加后端代理、真实 API 地址或 Fake/Real 开关。
- 页面必须经过 `src/api` 发出 `/api` 请求；禁止页面直接导入 `fake/` 数据。
- Fake Server 在开发和构建预览中都必须启用，产品 UI 离线即可完整运行。
- 权限只控制前端菜单、路由、按钮的显示或隐藏，不代表真实安全控制。
- 不添加 SS、Agg、Chatroom 等具体项目业务；业务只进入复制后的独立产品仓库。
- 不随意重组现有目录；新增功能按本文同一套领域流程落位。

## 仓库生命周期

GitLab 使用一个 `product-ui` Group，仓库直接按“项目 + 端”命名：

```text
product-ui/
├── admin-temp
├── ss-platform
├── ss-tenant
├── agg-platform
└── agg-tenant
```

新平台从 `admin-temp` 复制一次形成独立仓库。复制后各仓库独立演进，不跟踪母版版本、不自动同步、不共享运行时包。母版后续新增通用能力时，产品仓库按需人工复制增量文件。

## 技术栈和命令

- React 18、TypeScript、Vite 7、React Router 7。
- Ant Design 5、Ant Design Pro Components、Tailwind CSS 4。
- TanStack Query 5、Zustand 5、Ky。
- `vite-plugin-fake-server`、Vitest、Testing Library。
- 包管理器固定使用 pnpm。

```bash
pnpm install --frozen-lockfile
pnpm dev
pnpm run typecheck
pnpm test -- --run
pnpm run lint
pnpm run check:circular-deps
pnpm run build:prod
pnpm preview
```

## 目录与数据流

```text
页面 / 子组件
  → TanStack Query useQuery / useMutation
  → src/api/<domain>
  → src/utils/request
  → /api/*
  → fake/<domain>.fake.ts
```

| 路径 | 职责 |
|---|---|
| `src/pages/<domain>/` | 页面入口、领域内组件、列配置和页面交互 |
| `src/api/<domain>/index.ts` | 请求函数，只处理传输契约 |
| `src/api/<domain>/types.ts` | 请求参数、响应数据和领域记录类型 |
| `fake/<domain>.fake.ts` | 对应领域的 Fake HTTP 接口 |
| `src/components/` | 跨领域通用 UI 组件 |
| `src/hooks/` | 跨领域、框架级 Hook |
| `src/router/routes/static/` | 产品 UI 的全部业务路由 |
| `src/store/` | 认证、用户、权限、主题等跨页面状态 |
| `src/styles/` | 全局样式、基础样式和 AntD 主题 |
| `src/locales/{zh-CN,en-US}/` | 双语文案，文件名即 namespace |

## 页面组织规范

```text
src/pages/<feature>/
├── index.tsx          # 页面状态、Query/Mutation 和组件编排
├── constants.tsx      # options、状态映射、BasicTable 列工厂
├── types.ts           # 仅页面内部使用的展示类型（需要时）
├── components/        # Drawer、Modal、Card、详情等领域组件
└── hooks/             # 仅本领域复用的复杂 Hook（需要时）
```

- `index.tsx` 不堆放大段列定义、Fake 数组或完整抽屉 JSX。
- 列配置需要权限或回调时写成工厂函数，由页面传参；`constants.tsx` 不读取页面 State，不发送请求。
- 子组件通过明确 Props 回传事件，不接管页面级路由、表格刷新或无关 Mutation。
- 简单 `useQuery`、`useMutation` 和弹窗状态直接留在页面或对应组件中。
- 只有本领域多个组件共用的复杂逻辑才放 `pages/<domain>/hooks`。
- 跨多个领域复用的 Hook 才能进入 `src/hooks`；组件私有 Hook 放 `components/<component>/hooks`。
- 请求和响应类型放 `src/api/<domain>/types.ts`；纯页面状态类型才放页面目录。

## UI 和样式规则

- AntD 是基础交互组件，不手写复刻 Button、Table、Form、Drawer、Modal。
- 页面根容器使用 `BasicContent`，普通管理列表使用 `BasicTable`，操作使用 `BasicButton`。
- 主题 Token 在 `src/styles/theme/antd/antd-theme.ts` 和 `src/app.tsx` 的 `ConfigProvider` 修改。
- 全局基础样式放 `src/styles/base.css`、`src/styles/global.css`；不要在页面散落全局 `.ant-*` 覆盖。
- Button 的通用行为和样式入口是 `src/components/basic-button`；不创建平行按钮体系。
- 页面专属样式留在对应页面或组件中，优先使用现有 Tailwind 工具类。
- 所有可交互组件都要考虑 hover、focus、active、disabled、loading 和 danger 状态。
- 关键页面必须覆盖加载、正常、空数据、失败和无权限状态，并核对桌面与窄屏。
- 无权限操作直接隐藏；不要把 `disabled` 当权限控制。

## API 和 Fake 规则

- API 按领域组织为 `index.ts + types.ts`，请求函数使用 `fetchXxx` 命名。
- 统一响应为 `{ code, msg, data }`；分页数据为 `{ items, total, page, page_size }`。
- Fake 文件必须以 `.fake.ts` 结尾，URL 不包含 Vite 配置中的 `/api` basename。
- `enableProd: true` 时 Fake 文件不能使用 Node 专属模块。
- Fake CRUD 应保留当前预览会话内的内存变化，不能所有写操作都只返回成功但页面不变化。
- 页面不得知道数据来自 Fake；将来正式项目复制页面后，由正式项目自己的 `src/api` 接真实数据。
- Zustand 只用于跨页面状态。普通列表、表单和抽屉不为套层而新增 Store。

## 路由、菜单和权限

- 业务路由只放 `src/router/routes/static/`，不使用后端动态路由。
- 新增菜单通常同时修改路由文件、`src/router/extra-info/order.ts`、菜单图标和双语文案。
- 受控路由配置 `handle.permission`；页面操作使用 `usePermission` 或 `usePermissionAll`。
- 权限码按现有格式使用，如 `system:user:view`、`system:user:add`。
- 删除领域时同步删除 Page、API、Fake、Route、Locale、Store 和专用类型，不保留不可达残件。

## 标准领域开发示例：公告管理

目标：新增公告列表、查询、新增、编辑、删除和状态展示。

### 文件落位

```text
src/api/announcements/index.ts
src/api/announcements/types.ts
src/pages/announcements/index.tsx
src/pages/announcements/constants.tsx
src/pages/announcements/components/announcement-form-drawer.tsx
src/router/routes/static/announcements.ts
src/locales/zh-CN/announcements.json
src/locales/en-US/announcements.json
fake/announcements.fake.ts
```

当前交互简单时不创建 `hooks/`。只有多个公告组件确实复用复杂逻辑时，才增加 `src/pages/announcements/hooks/use-announcement-selection.ts`。

### 数据契约

`src/api/announcements/types.ts`：

```ts
export interface AnnouncementItemType {
	id: number
	title: string
	content: string
	status: 1 | 2
	created_at: string
}

export interface AnnouncementListReq {
	page: number
	page_size: number
	title?: string
	status?: 1 | 2
}
```

### 请求入口

`src/api/announcements/index.ts`：

```ts
import type { AnnouncementItemType, AnnouncementListReq } from "./types";
import { request } from "#src/utils/request";

export * from "./types";

export function fetchAnnouncementList(data: AnnouncementListReq) {
	return request
		.post("/api/announcements/list", { json: data })
		.json<ApiListResponse<AnnouncementItemType>>();
}
```

### Fake 接口

`fake/announcements.fake.ts`：

```ts
import { defineFakeRoute } from "vite-plugin-fake-server/client";
import { resultSuccess } from "./utils";

let records = [
	{ id: 1, title: "系统维护通知", content: "本周日凌晨维护", status: 1, created_at: "2026-08-24 10:00:00" },
];

export default defineFakeRoute([
	{
		url: "/announcements/list",
		method: "post",
		response: ({ body }) => {
			const items = records.filter(item => !body.title || item.title.includes(body.title));
			return resultSuccess({ items, total: items.length, page: 1, page_size: 10 });
		},
	},
]);
```

页面只能调用 `fetchAnnouncementList`，不能导入 `records` 或 Fake 文件。`index.tsx` 负责 Query/Mutation、Drawer 开关和表格刷新；列工厂放 `constants.tsx`；表单抽屉放 `components/announcement-form-drawer.tsx`。

### 路由和权限

```ts
handle: {
	icon: "NotificationOutlined",
	title: "announcements.menu",
	permission: "announcements:view",
}
```

按钮权限使用 `announcements:add`、`announcements:edit`、`announcements:delete`，无权限时隐藏对应操作。

## 固定开发流程

1. 确定唯一领域名。
2. 在 `src/api/<domain>/types.ts` 定义契约。
3. 在 `src/api/<domain>/index.ts` 写请求函数。
4. 在 `fake/<domain>.fake.ts` 实现 Fake HTTP 行为。
5. 在 `src/pages/<domain>` 完成页面和领域组件。
6. 注册静态路由、菜单顺序、图标、文案和模拟权限。
7. 补齐加载、空数据、失败、无权限和响应式状态。
8. 先写失败测试，再实现行为；最后执行完整验证。

## 完成门槛

修改后至少执行：

```bash
pnpm run typecheck
pnpm test -- --run
pnpm run lint
pnpm run check:circular-deps
pnpm run build:prod
```

涉及布局、主题、表格、Drawer、Modal 或响应式时，还要启动页面人工核对。没有新鲜命令输出和页面检查证据，不宣称完成。
