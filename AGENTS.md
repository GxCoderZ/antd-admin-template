# AntD Admin Template 前端开发规则

## 作用与硬边界

本仓库是 `product-ui/antd-admin-template` 产品 UI 母版。母版以及从它复制出的所有产品 UI 仓库都是 **Fake-only**：只负责页面视觉、组件交互、主题和 CSS，Fake Server 只负责驱动界面状态。

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
├── antd-admin-template
├── ss-platform
├── ss-tenant
├── agg-platform
└── agg-tenant
```

新平台从 `antd-admin-template` 复制一次形成独立仓库。复制后各仓库独立演进，不跟踪母版版本、不自动同步、不共享运行时包。母版后续新增通用能力时，产品仓库按需人工复制增量文件。

## 技术栈和命令

- React 19、TypeScript、Vite 8、React Router 8。
- Ant Design 6、TanStack Query 5。
- `vite-plugin-fake-server`、Vitest、Testing Library、Playwright、Knip。
- 包管理器固定使用 pnpm。

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

## 目录与数据流

```text
页面 / 子组件
  → TanStack Query useQuery / useMutation
  → src/api/<domain>
  → src/api/client
  → /api/*
  → fake/<domain>.fake.ts
```

| 路径                        | 职责                                      |
| --------------------------- | ----------------------------------------- |
| `src/features/<domain>/`    | 页面入口、领域组件和页面交互              |
| `src/api/<domain>/index.ts` | 请求函数，只处理传输契约                  |
| `src/api/<domain>/types.ts` | 请求参数、响应数据和领域记录类型          |
| `src/api/client.ts`         | `/api` 请求与统一响应处理                 |
| `fake/<domain>.fake.ts`     | 对应领域的 Fake HTTP 接口                 |
| `src/app/`                  | 应用 Provider、路由元数据和跨页面 UI 能力 |
| `src/app/adminRoutes.ts`    | 产品 UI 的全部业务路由和菜单元数据        |
| `src/locales/*.ts`          | 简中、繁中、英文、韩文文案                |

## 页面组织规范

```text
src/features/<feature>/
├── <Feature>Page.tsx  # 页面状态、Query/Mutation 和组件编排
├── <Component>.tsx    # Drawer、Modal、Card、详情等领域组件
└── *.module.css       # 仅该领域使用的样式（需要时）
```

- 页面文件不堆放 Fake 数组；所有界面数据必须来自 TanStack Query 或 Mutation。
- 子组件通过明确 Props 回传事件，不接管页面级路由、表格刷新或无关 Mutation。
- 简单 `useQuery`、`useMutation` 和弹窗状态直接留在页面或对应组件中。
- 只有多个组件确实复用的复杂逻辑才新增领域 Hook。
- 请求和响应类型放 `src/api/<domain>/types.ts`；纯页面状态类型才放页面目录。

## UI 和样式规则

- AntD 是基础交互组件，不手写复刻 Button、Table、Form、Drawer、Modal。
- 应用级主题在 `src/app/App.tsx` 的 `ConfigProvider` 修改，组件样式优先读取 AntD Token。
- 管理壳层、登录页和通用交互优先复用 `src/app` 与现有 `src/features` 组件。
- 页面专属样式留在对应页面或组件中，优先使用现有 CSS Module 与 AntD Token。
- 所有可交互组件都要考虑 hover、focus、active、disabled、loading 和 danger 状态。
- 关键页面必须覆盖加载、正常、空数据、失败和无权限状态，并核对桌面与窄屏。
- 无权限操作直接隐藏；不要把 `disabled` 当权限控制。

## API 和 Fake 规则

- API 按领域组织为 `index.ts + types.ts`，请求函数沿用 `get/list/create/update/deleteXxx` 命名。
- 统一响应为 `{ code, msg, data }`；分页数据为 `{ items, total, page, page_size }`。
- Fake 文件必须以 `.fake.ts` 结尾，URL 不包含 Vite 配置中的 `/api` basename。
- `enableProd: true` 时 Fake 文件不能使用 Node 专属模块。
- Fake CRUD 应保留当前预览会话内的内存变化，不能所有写操作都只返回成功但页面不变化。
- 页面不得知道数据来自 Fake；将来正式项目复制页面后，由正式项目自己的 `src/api` 接真实数据。
- 跨页面状态优先使用现有 React Context 和 TanStack Query；普通列表、表单和抽屉不新增全局 Store。

## 路由、菜单和权限

- 业务路由与菜单元数据只放 `src/app/adminRoutes.ts`，不使用后端动态路由。
- 新增菜单同时修改路由元数据、Ant Design 图标和四种语言文案。
- 受控路由配置 `requiredPermission`；页面操作使用 `usePermission`。
- 权限码沿用 `platform.users.read`、`platform.users.manage` 等当前格式。
- 删除领域时同步删除 Page、API、Fake、Route、Locale、Store 和专用类型，不保留不可达残件。

## 标准领域开发示例：公告管理

目标：新增公告列表、查询、新增、编辑、删除和状态展示。

### 文件落位

```text
src/api/announcements/index.ts
src/api/announcements/types.ts
src/features/announcements/AnnouncementsPage.tsx
src/features/announcements/AnnouncementFormDrawer.tsx
src/app/adminRoutes.ts
src/locales/{zh-CN,zh-TW,en,ko-KR}.ts
fake/announcements.fake.ts
```

当前交互简单时不创建 Hook。只有多个公告组件确实复用复杂逻辑时，才增加 `src/features/announcements/useAnnouncementSelection.ts`。

### 数据契约

`src/api/announcements/types.ts`：

```ts
export interface AnnouncementItemType {
	id: number;
	title: string;
	content: string;
	status: 1 | 2;
	created_at: string;
}

export interface AnnouncementListReq {
	page: number;
	page_size: number;
	title?: string;
	status?: 1 | 2;
}
```

### 请求入口

`src/api/announcements/index.ts`：

```ts
import type { AnnouncementItemType, AnnouncementListReq } from "./types";
import { request } from "../client";

export * from "./types";

export function listAnnouncements(data: AnnouncementListReq) {
	return request<{
		items: AnnouncementItemType[];
		total: number;
		page: number;
		page_size: number;
	}>("/announcements/list", { method: "POST", body: data });
}
```

### Fake 接口

`fake/announcements.fake.ts`：

```ts
import { defineFakeRoute } from "vite-plugin-fake-server/client";
import { resultSuccess } from "./utils";

let records = [
	{
		id: 1,
		title: "系统维护通知",
		content: "本周日凌晨维护",
		status: 1,
		created_at: "2026-08-24 10:00:00",
	},
];

export default defineFakeRoute([
	{
		url: "/announcements/list",
		method: "post",
		response: ({ body }) => {
			const items = records.filter(
				(item) => !body.title || item.title.includes(body.title),
			);
			return resultSuccess({
				items,
				total: items.length,
				page: 1,
				page_size: 10,
			});
		},
	},
]);
```

页面只能调用 `listAnnouncements`，不能导入 `records` 或 Fake 文件。`AnnouncementsPage.tsx` 负责 Query/Mutation、Drawer 开关和表格刷新；复杂表单拆到 `AnnouncementFormDrawer.tsx`。

### 路由和权限

```ts
{
	key: "/announcements",
	titleKey: "adminShell.navigation.announcements",
	requiredPermission: "announcements:view",
}
```

新增领域权限时同步扩展 `src/api/types.ts` 的权限联合类型。按钮权限使用 `announcements:add`、`announcements:edit`、`announcements:delete`，无权限时隐藏对应操作。

## 固定开发流程

1. 确定唯一领域名。
2. 在 `src/api/<domain>/types.ts` 定义契约。
3. 在 `src/api/<domain>/index.ts` 写请求函数。
4. 在 `fake/<domain>.fake.ts` 实现 Fake HTTP 行为。
5. 在 `src/features/<domain>` 完成页面和领域组件。
6. 在 `src/app/adminRoutes.ts` 注册路由、菜单顺序、图标、文案和模拟权限。
7. 补齐加载、空数据、失败、无权限和响应式状态。
8. 先写失败测试，再实现行为；最后执行完整验证。

## 完成门槛

修改后至少执行：

```bash
pnpm run typecheck
pnpm test -- --run
pnpm run test:e2e
pnpm run lint
pnpm run check:circular-deps
pnpm run check:unused
pnpm run build:prod
```

涉及布局、主题、表格、Drawer、Modal 或响应式时，还要启动页面人工核对。没有新鲜命令输出和页面检查证据，不宣称完成。

## 版本留痕与测试地址

- 每轮代码修改完成并通过验证后，创建一个本地 Git 提交；不同功能不得挤进同一个后续提交。
- 未经用户明确要求不推送远端。
- 完成回复必须给出本次提交哈希和可访问的本地测试地址；开发服务未运行时先启动并确认 HTTP 可访问。
