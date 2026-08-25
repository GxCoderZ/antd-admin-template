# 认证、权限与请求循环依赖治理设计

## 1. 背景与证据

母版当前的循环依赖报告包含 116 条路径。它们不是 116 个互不相关的缺陷，而是少数根环经过 Router、Layout、Store 和 Request 扩展出的路径枚举：

```text
store/auth → api/auth → request → store/auth
request/refresh → api/auth → request
store/access → router/routes → layout → store/access
```

`store/auth` 同时重置 user、access 和 tabs Store，进一步扩大了强连通分量。

母版对应的开源上游是 `condorheroblog/react-antd-admin`。对 2026-08-25 的上游 `main` 执行其自身的 `ds src --output upstream-circular-deps.json` 后，222 个文件检测出 134 条循环路径，最短路径仍是认证 Store/API/Request 和刷新 API/Request 两个三节点环。上游 2025 年合并的 [PR #12](https://github.com/condorheroblog/react-antd-admin/pull/12) 通过移除聚合导出来修复页面 HMR，但没有改变认证、请求和权限路由的核心依赖方向。

因此本次不直接复制上游实现，而是保留它的用户可见行为，按母版的静态路由、Fake-only 和分层约束治理依赖。

## 2. 目标

- 将 `pnpm run check:circular-deps` 的循环路径从 116 降到 0，不增加忽略规则。
- 登录、Token 持久化、自动刷新、并发刷新等待、401 退出、用户初始化、权限菜单、主动退出和标签清理行为保持不变。
- Store 只管理状态，不发送 HTTP 请求、不修改 Router、不重置其他 Store。
- 页面、AuthGuard 和应用层编排函数负责跨模块用例。
- API 继续描述 `/api` 契约；页面和守卫不直接接触 Fake 数据。
- 保持现有 UI、路由地址、权限码、Fake Server 和产品交互不变。

## 3. 不做事项

- 不升级 React、Ant Design、React Router、Zustand 或 Ky。
- 不改成后端动态路由，不引入真实后端、代理或 Fake/Real 开关。
- 不引入事件总线、依赖注入容器或新的全局状态库。
- 不通过 scanner ignore、路径排除或只修改报告来隐藏循环。
- 不借机重做登录页、权限模型或错误页面。
- 用户已明确不采用 TDD；测试在实现完成后补充并执行。

## 4. 方案选择

### 4.1 仅切断最短环

可以只为刷新接口创建独立 Client，并从 auth store 移除 API 调用。这种改动较小，但 access store 仍拥有 Router，auth store 仍知道其他 Store，循环会以其他路径继续存在。

不采用。

### 4.2 纯 Store + 应用层编排

Store 只提供原子状态动作；页面和 AuthGuard 编排成功流程；会话模块统一清理相关状态；刷新接口使用不含鉴权 Hook 的底层 Client。

该方案依赖单向、职责明确，且与母版的静态路由模型吻合。

采用此方案。

### 4.3 事件总线或运行时依赖注入

Request 可发布 unauthorized 事件，由应用入口注册清理回调。虽然能够反转依赖，但会让基础登录功能依赖隐式注册顺序，并增加测试和排错成本。

当前规模不需要，暂不采用。

## 5. 目标依赖方向

```text
页面 / AuthGuard / 401 处理
  → API / 会话编排 / 访问快照构建
  → 纯 Store / Request
  → 底层 Ky Client
```

必须满足以下硬边界：

- Store 不导入 `src/api`、Router 实例、Layout 或其他 Store。
- API 不导入 Store。
- Access Store 不计算路由或菜单，只接收完整快照。
- 普通 API 使用统一 `request`；Token 刷新端点使用无鉴权底层 Client，避免重新进入 401 刷新 Hook。
- 只有会话编排模块可以同时清理 auth、user、access 和 tabs。

## 6. Store 设计

### 6.1 Auth Store

保留持久化 Token 的职责，公开：

```text
token
refreshToken
setTokens(tokens)
reset()
```

移除：

- `login()` 中的 `fetchLogin()`。
- `logout()` 业务编排。
- 对 user、access 和 tabs Store 的导入与重置。

Auth Store 的状态类型独立于 HTTP 响应字段，页面负责把 `access_token`、`refresh_token` 映射为 Store 的 `token`、`refreshToken`。

### 6.2 User Store

公开：

```text
setUserInfo(user)
reset()
```

移除 `getUserInfo()` 中的 HTTP 请求。AuthGuard 调用 `fetchCurrentUser()` 并在成功后写入 Store。

### 6.3 Access Store

公开：

```text
setAccessSnapshot(snapshot)
reset()
```

快照包含：

- `wholeMenus`
- `routeList`
- `flatRouteList`
- `permissions`
- `isAccessChecked`

Access Store 的初始值使用空菜单、空路由快照、空权限和 `isAccessChecked: false`。它不导入静态路由、路由工具、Router 实例或 Layout，也不调用 `patchRoutes`、`_internalSetRoutes`。

访问快照是 Token 和权限派生的数据，每次应用初始化都由 AuthGuard 重建，因此移除 access 持久化，避免持久化 React Route 对象和过期菜单。

## 7. 用例编排

### 7.1 登录

`PasswordLogin` 负责：

1. 调用 `fetchLogin(values)`。
2. 校验统一业务响应。
3. 将 Token 写入 Auth Store。
4. 保持现有成功消息、错误 Alert、redirect 和 loading 行为。

登录页面不清理其他 Store；旧会话的完整清理由退出或 401 失败路径负责。

### 7.2 用户与权限初始化

`AuthGuard` 负责：

1. 调用 `fetchCurrentUser()`。
2. 调用 `fetchUserPermissions()`。
3. 写入 User Store。
4. 使用静态路由和权限生成访问快照。
5. 写入 Access Store。

路由和菜单计算抽成纯函数，例如 `createAccessSnapshot(permissions)`，放在 Router 领域的 utils 中。纯函数可以读取静态路由并使用既有 `ascending`、`flattenRoutes`、`generateRoutesByFrontend` 和 `generateMenuItemsFromRoutes`，但不写 Store、不修改 Router。

母版已经在 Router 创建时注册全量静态路由，因此权限初始化不需要动态 patch Router。菜单按权限过滤；访问无权限路由仍由 AuthGuard 跳转 403。

### 7.3 主动退出与会话清理

新增应用层会话编排函数 `clearSession()`，唯一职责是依次重置：

- Auth Store
- User Store
- Access Store
- Tabs Store

用户菜单退出调用 `clearSession()` 后使用 React Router 跳转登录页。

该函数不发送请求、不直接操作 Router。母版当前没有真实退出接口，继续保持 Fake-only 本地退出语义。

### 7.4 401 与刷新 Token

请求层保留以下行为：

- 普通请求从 Auth Store 读取 access token。
- 非登录、非刷新请求返回 401 时，只允许一个刷新请求运行。
- 其他并发 401 请求等待刷新结果。
- 刷新成功后更新 Auth Store 并重放等待请求。
- 刷新失败后拒绝所有等待请求、调用 `clearSession()` 并跳转登录页。
- 刷新端点自身返回 401 时不递归刷新。

为切断 `request/refresh → api/auth → request`，请求基础能力拆成无业务依赖的底层 Ky Client。刷新端点放在 auth API 领域的独立模块中，仅依赖该底层 Client；普通 auth API 仍使用统一 Request。

```text
request/index
  → request/refresh
  → api/auth/refresh
  → request/client

api/auth/index
  → request/index
```

`request/client` 不导入 API、Store、Router 或应用层模块。

## 8. 预期文件变化

主要修改：

```text
src/store/auth.ts
src/store/user.ts
src/store/access.ts
src/pages/login/components/password-login.tsx
src/router/guard/auth-guard.tsx
src/layout/layout-header/components/user-menu.tsx
src/utils/request/index.ts
src/utils/request/refresh.ts
src/utils/request/go-login.ts
src/api/auth/index.ts
```

预计新增：

```text
src/application/session.ts
src/router/utils/create-access-snapshot.ts
src/utils/request/client.ts
src/api/auth/refresh.ts
```

最终文件名可以根据实现中的既有命名细节微调，但职责和依赖边界不能改变。

## 9. 失败语义

- 登录业务失败：不写 Token，继续显示当前登录表单错误。
- 当前用户请求失败：保持 AuthGuard 当前的等待/跳转语义；401 由 Request 统一清理会话。
- 权限请求失败：保持当前行为，记录错误并使用空权限集合生成快照。
- 刷新响应缺少有效 Token：按刷新失败处理，不保留半有效会话。
- 并发刷新失败：所有等待请求都收到拒绝，不遗留 subscriber。
- 主动退出：即使当前页面处于请求或表格状态，也同步清理四个 Store 后跳转。

## 10. 实施与验证

用户明确要求不采用 TDD。实现顺序为：

1. 建立底层 Request Client 和独立刷新端点。
2. 将 auth、user、access 改为纯 Store。
3. 增加会话清理和访问快照构建函数。
4. 调整登录页、AuthGuard、用户菜单、401 路径的编排调用。
5. 实现完成后补充或调整 Store、登录、会话清理、权限快照和刷新并发测试。
6. 执行静态检查、循环扫描、构建和浏览器人工验证。

必须执行：

```bash
pnpm run typecheck
pnpm test -- --run
pnpm run lint
pnpm run check:circular-deps
pnpm run build:prod
```

循环扫描的验收结果必须是 `0 circles were found`，且 `circular-deps.json` 为空数组。不得以命令退出码为 0 代替结果检查。

浏览器验证至少覆盖：

- 管理员登录与退出。
- 只读用户登录与权限菜单。
- 刷新页面后恢复 Token、重新加载用户和访问快照。
- 主动访问无权限路由跳转 403。
- 开发服务和生产预览中的 Fake 接口正常工作。
- 控制台没有本次改造新增错误。

## 11. 完成标准

- 所有 116 条循环路径被消除，未添加忽略项。
- auth、user、access Store 均不发送请求、不修改 Router、不重置其他 Store。
- 登录、用户初始化、权限菜单、主动退出、401 刷新和失败退出行为通过验证。
- Fake-only、`src/api` 契约、静态路由、权限码和现有 UI 保持不变。
- TypeScript、测试、Lint、循环扫描和生产构建均有新鲜成功输出。
