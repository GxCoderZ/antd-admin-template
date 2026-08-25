# Admin Temp

`admin-temp` 是产品团队使用的纯前端管理端 UI 母版。它基于 React、Ant Design 和统一的产品 UI 工程规范，内置可交互的本地 Fake 数据，不需要启动任何后端。

## 仓库使用方式

GitLab 只建立一个 `product-ui` Group：

```text
product-ui/
├── admin-temp       # 母版
├── ss-platform      # SS 平台端产品 UI
├── ss-tenant        # SS 租户端产品 UI
├── agg-platform
└── agg-tenant
```

新增产品端时复制 `admin-temp` 创建一个独立仓库，例如 `ss-platform`。产品进入新仓库自由调整页面、主题、CSS、按钮和组件交互。各产品仓库都是独立快照，不自动同步母版，也不共享运行时代码。

正式业务仓库只参考或复制产品 UI 仓库的页面、组件和样式，再接入自己的真实 API。本母版和产品 UI 仓库永远不连接真实后端。

## 已包含

- 模拟登录、退出和 Token 刷新
- 管理员与只读用户两种模拟身份
- 用户、角色、权限分配及角色绑定
- 前端菜单、路由和按钮权限显示
- 工作台、审计日志和登录日志
- 个人资料、基本设置和会话安全
- 平台设置和系统信息
- 403、404、500 页面
- AntD 主题、暗色模式、布局和标签页偏好
- BasicContent、BasicButton、BasicTable、BasicForm、BasicCard、BasicDrawer、BasicModal
- 查询面板、日志表格、危险操作确认和加载骨架等通用交互
- 开发与构建预览都启用的 Fake Server
- 完整 `AGENTS.md` 工程规则和领域开发示例

## 启动

```bash
pnpm install --frozen-lockfile
pnpm dev
```

默认地址：`http://localhost:3001`

模拟账号：

| 身份 | 用户名 | 密码 | UI 权限 |
|---|---|---|---|
| 管理员 | `admin` | `admin123` | 全部 |
| 只读用户 | `viewer` | `viewer123` | 仅查看 |

## 新产品仓库初始化

从母版复制出新仓库后，只需要先修改这些项目身份信息：

1. `package.json`：包名和描述。
2. `.env.development`、`.env.production`、`.env.test`：应用标题、首页和 Storage namespace。
3. `public/manifest.json`：应用名称。
4. `src/assets/svg/logo.svg`：产品 Logo。
5. `README.md`：目标产品定位和页面清单。

不要添加后端代理或真实 API 地址。产品阶段新增领域统一走：

```text
page → src/api → /api → fake → UI 状态
```

## 页面与领域结构

```text
src/pages/<feature>/
├── index.tsx
├── constants.tsx
├── types.ts
├── components/
└── hooks/

src/api/<domain>/
├── index.ts
└── types.ts

fake/<domain>.fake.ts
src/router/routes/static/<domain>.ts
```

完整目录职责、Hook 放置规则、样式入口、公告领域示例和验证要求见 [AGENTS.md](./AGENTS.md)。

## 会话与依赖边界

- `src/store` 只保存跨页面纯状态，不发送请求、不生成路由，也不重置其他 Store。
- `src/application/session.ts` 统一编排主动退出和 401 刷新失败后的会话清理。
- `AuthGuard` 获取用户和权限后生成访问快照，再写入用户与权限 Store。
- Token 刷新使用独立的叶子级请求客户端，避免认证 API、统一请求客户端和 Store 相互引用。
- `pnpm run check:circular-deps` 是零容忍门禁，循环依赖报告必须为 `[]`。

## 样式入口

- AntD Token：`src/styles/theme/antd/antd-theme.ts`、`src/app.tsx`
- 全局 CSS：`src/styles/base.css`、`src/styles/global.css`
- 通用按钮：`src/components/basic-button`
- 通用表格：`src/components/basic-table`
- 通用容器：`src/components/basic-card`、`src/components/basic-drawer`、`src/components/basic-modal`
- 通用业务交互：`src/components/query-filter-panel`、`src/components/log-table-panel`、`src/components/danger-confirmation`
- 页面专属样式：对应的 `src/pages/<domain>`

## 验证

```bash
pnpm run typecheck
pnpm test -- --run
pnpm run lint
pnpm run check:circular-deps
pnpm run build:prod
pnpm preview
```

其中循环依赖检查必须扫描成功且保持 0 条路径；出现任何循环都会使命令失败。
