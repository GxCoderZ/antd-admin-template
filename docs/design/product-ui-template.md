# 产品 UI 母版设计

## 定位

本仓库是 `product-ui/admin-temp`，即一个可独立运行的产品 UI 设计母版。它只负责页面视觉、组件交互、主题、CSS 和各种界面状态；Fake Server 负责为这些交互提供本地数据。

母版和从母版复制出来的产品 UI 仓库永远只使用 Fake，不连接真实后端，也不提供 Fake/Real 切换。Chatroom、Agg 或其他正式项目只参考或复制本仓库的页面、组件和样式，再接入各自真实 API。

## 技术边界

- React 18、TypeScript、Vite、Ant Design 5、Ant Design Pro Components。
- TanStack Query 管理页面请求状态，Zustand 只管理跨页面状态。
- Ky 发出 `/api` 请求，`vite-plugin-fake-server` 在开发和构建预览中拦截全部请求。
- 权限只用于菜单、路由和操作的前端显示或隐藏，不代表真实安全控制。
- 不包含 Go Server、Vite 后端代理、WebSocket、真实 API 地址或产品业务领域。

## 通用能力

- 模拟登录、退出、刷新和当前用户。
- 用户、角色、权限及角色绑定。
- 审计日志与通用 Dashboard。
- 403、404、500、加载、空数据和失败状态。
- 布局、标签页、主题、暗色模式和偏好设置。
- BasicContent、BasicButton、BasicTable、BasicForm 等后台基础组件。

## 目录和数据流

```text
页面 / 页面组件
  -> TanStack Query
  -> src/api/<domain>
  -> Ky /api/*
  -> fake/<domain>.fake.ts
```

业务页面按 `src/pages/<domain>` 组织；请求及契约按 `src/api/<domain>/index.ts + types.ts` 组织；Fake 接口按 `fake/<domain>.fake.ts` 组织。详细规则和完整领域示例见根 `AGENTS.md`。

## 仓库生命周期

GitLab 只使用一个 `product-ui` Group，仓库直接命名为 `admin-temp`、`ss-platform`、`ss-tenant`、`agg-platform`、`agg-tenant` 等。每个产品 UI 仓库从母版复制一次后独立演进，不跟踪母版版本，也不自动同步。母版新增通用能力时，由目标产品按需人工复制增量文件。
