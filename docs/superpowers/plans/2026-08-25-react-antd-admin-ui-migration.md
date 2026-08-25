# React Antd Admin UI Interaction Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the source project's generic admin UI, interactions, and functions inside the Fake-only mother template without importing its architecture or backend.

**Architecture:** Keep the existing React 18/Ant Design 5 shell, `Basic*` components, static routes, TanStack Query, `src/api` contracts, Ky request layer, and `vite-plugin-fake-server`. Reimplement source-visible behavior as focused mother-template domains; use `fake/store.ts` as the single in-memory owner for relational preview state and expose it only through domain Fake HTTP routes.

**Tech Stack:** React 18, TypeScript 5.8, Vite 7, React Router 7, Ant Design 5, Ant Design Pro Components, TanStack Query 5, Zustand 5, Ky, vite-plugin-fake-server, Vitest, Testing Library, pnpm 10.

**Spec:** `docs/superpowers/specs/2026-08-25-react-antd-admin-ui-migration-design.md`

## Global Constraints

- The repository remains Fake-only: no real backend URL, Vite proxy, MSW, OpenAPI generated client, Go code, PostgreSQL, or Fake/Real switch.
- Every page request flows through `src/api/<domain>` and `src/utils/request` to `/api/*`; pages never import `fake/`.
- Keep the existing shell, tabs, search, notifications, themes, preferences, routes, and `Basic*` component ownership.
- `BasicButton` remains a thin wrapper around Ant Design `Button`; do not add a parallel button component.
- Page code follows `index.tsx + constants.tsx + components/`; request/response types stay in `src/api/<domain>/types.ts`.
- Responses remain `{ code, msg, data }`; paginated data remains `{ items, total, page, page_size }`.
- All writes must change the current preview session's in-memory state.
- Permissions only control frontend visibility; unauthorized actions are hidden instead of disabled.
- User explicitly waived TDD. Implement each task first, then add and run its behavior tests before committing.
- Keep Chinese and English locale key structures identical.
- Use pnpm only.

---

### Task 1: Interaction primitives and shared table behavior

**Files:**
- Modify: `src/components/basic-button/index.tsx`
- Modify: `src/components/basic-table/index.tsx`
- Modify: `src/styles/theme/antd/antd-theme.ts`
- Create: `src/components/danger-confirmation/index.tsx`
- Create: `src/components/danger-confirmation/index.test.tsx`

**Interfaces:**
- Consumes: Ant Design `ButtonProps`, `Modal`, `Form`, `Input`, and existing `BasicTableProps`.
- Produces: `BasicButtonProps` with `usage?: "default" | "table-action" | "toolbar"`; `DangerConfirmation` with `{ open, title, impact, targetName, loading, onCancel, onConfirm }`.

- [ ] **Step 1: Extend the mother-template Button wrapper**

Keep AntD as the implementation and strip `usage` before forwarding:

```tsx
export interface BasicButtonProps extends ButtonProps {
  children?: ReactNode
  usage?: "default" | "table-action" | "toolbar"
}

export function BasicButton({ children, className, usage = "default", ...buttonProps }: BasicButtonProps) {
  return (
    <Button
      type="primary"
      {...buttonProps}
      className={cn(className, {
        "h-auto px-0": usage === "table-action",
        "inline-flex items-center justify-center": usage === "toolbar",
      })}
    >
      {children}
    </Button>
  )
}
```

The caller still sets AntD `type`, `danger`, `disabled`, and `loading`; the wrapper does not duplicate those states.

- [ ] **Step 2: Add typed danger confirmation**

Create a reusable controlled modal that requires exact target text:

```ts
export interface DangerConfirmationProps {
  impact: string
  loading?: boolean
  onCancel: () => void
  onConfirm: () => Promise<void> | void
  open: boolean
  targetName: string
  title: string
}
```

The component resets its local input whenever `open` or `targetName` changes, shows `impact` in an error Alert, and enables the danger submit button only when `input === targetName` and `loading !== true`.

- [ ] **Step 3: Normalize BasicTable defaults**

Preserve all existing `ProTableProps`, adaptive height, and pagination. Merge these defaults without overriding caller options:

```tsx
options={{
  density: true,
  fullScreen: true,
  reload: true,
  setting: true,
  ...props.options,
}}
```

Use AntD `Empty.PRESENTED_IMAGE_SIMPLE` for the default empty state and keep `scroll.x = "max-content"` for narrow screens.

- [ ] **Step 4: Add component tokens**

Add light/dark `components.Button`, `components.Card`, `components.Table`, `components.Form`, and `components.Modal` tokens only where AntD 5 exposes a supported token. Keep theme color and radius controlled by `src/app.tsx`; do not add global `.ant-*` CSS.

- [ ] **Step 5: Test the danger confirmation behavior**

Render the component, type a non-matching value, assert Confirm is disabled, then type the exact target and assert one `onConfirm` call. Also render with `loading` and assert Cancel and Confirm cannot submit twice.

Run: `pnpm test -- --run src/components/danger-confirmation/index.test.tsx`

Expected: the component test passes with no unhandled warnings.

- [ ] **Step 6: Commit**

```bash
git add src/components/basic-button src/components/basic-table src/components/danger-confirmation src/styles/theme/antd/antd-theme.ts
git commit -m "feat(components): 完善后台交互基础组件"
```

---

### Task 2: Fake domain model and HTTP contracts

**Files:**
- Modify: `src/api/auth/types.ts`
- Modify: `src/api/dashboard/types.ts`
- Modify: `src/api/system/user/index.ts`
- Modify: `src/api/system/user/types.ts`
- Modify: `src/api/system/role/index.ts`
- Modify: `src/api/system/role/types.ts`
- Modify: `src/api/audit/index.ts`
- Modify: `src/api/audit/types.ts`
- Create: `src/api/login-log/index.ts`
- Create: `src/api/login-log/types.ts`
- Create: `src/api/account/index.ts`
- Create: `src/api/account/types.ts`
- Create: `src/api/system/settings/index.ts`
- Create: `src/api/system/settings/types.ts`
- Create: `src/api/system/info/index.ts`
- Create: `src/api/system/info/types.ts`
- Modify: `fake/store.ts`
- Modify: `fake/auth.fake.ts`
- Modify: `fake/system.fake.ts`
- Modify: `fake/dashboard.fake.ts`
- Modify: `fake/audit.fake.ts`
- Create: `fake/login-log.fake.ts`
- Create: `fake/account.fake.ts`
- Create: `fake/settings.fake.ts`
- Create: `tests/admin-experience-fake.test.ts`

**Interfaces:**
- Produces: the typed API and Fake state used by Tasks 3-8.
- User status: `1 | 2 | 3` for active, locked, disabled.
- Sort contract: `sort?: string`, `order?: "ascend" | "descend"` on list requests.
- Account endpoints: profile get/update, avatar update/delete, password change, sessions list/revoke/revoke-others.
- Settings endpoints: get/update site title; info endpoint: generic Fake runtime metadata.

- [ ] **Step 1: Expand user and role contracts**

Define stable transport types:

```ts
export type UserStatus = 1 | 2 | 3
export interface UserItemType {
  id: number
  uuid: string
  username: string
  display_name: string
  email: string
  status: UserStatus
  created_at: string
}
export interface UserListReq {
  page: number
  page_size: number
  keyword?: string
  status?: UserStatus
  sort?: "username" | "display_name" | "email" | "status" | "created_at"
  order?: "ascend" | "descend"
}
export interface UserResetPasswordResp { temporary_password: string }
export interface UserForceLogoutResp { revoked_sessions: number }
```

Add `key`, `permission_codes`, and `user_count` to role responses. Preserve numeric IDs and existing permission tree types so current page code can migrate incrementally.

- [ ] **Step 2: Add log, account, settings, and system-info contracts**

Use these domain shapes:

```ts
export interface LoginLogItemType {
  id: number
  identifier: string
  result: "success" | "failed"
  device: string
  ip: string
  language: string
  time_zone: string
  created_at: string
}

export interface AccountProfileType {
  id: number
  username: string
  display_name: string
  email: string
  avatar: string
  roles: Array<{ id: number; name: string }>
  created_at: string
}

export interface AccountSessionType {
  id: string
  current: boolean
  device: string
  ip: string
  language: string
  time_zone: string
  created_at: string
  expires_at: string
}

export interface PlatformSettingsType { site_title: string; updated_at: string }
export interface SystemInfoType { service: string; version: string; started_at: string }
```

- [ ] **Step 3: Implement request functions**

Every function calls `request.post("/api/...", { json })` and returns `ApiResponse` or `ApiListResponse`. Required names include:

```ts
fetchLoginLogList
fetchAccountProfile
fetchUpdateAccountProfile
fetchUploadAccountAvatar
fetchDeleteAccountAvatar
fetchChangeAccountPassword
fetchAccountSessions
fetchRevokeAccountSession
fetchRevokeOtherAccountSessions
fetchPlatformSettings
fetchUpdatePlatformSettings
fetchSystemInfo
fetchForceLogoutUser
```

`fetchUploadAccountAvatar(file)` validates nothing; it converts the File to a data URL inside the API module and posts `{ avatar_data, mime_type, size }`. UI validation remains in the account component.

- [ ] **Step 4: Expand `fake/store.ts` as the single relational owner**

Extend `FakeState` with `account`, `accountSessions`, `settings`, `auditLogs`, and `loginLogs`. Export deterministic functions used by Fake routes:

```ts
listUsers, createUser, updateUser, forceLogoutUser
listRoles, createRole, updateRole, deleteRole
getAccountProfile, updateAccountProfile, updateAccountAvatar, deleteAccountAvatar
changeAccountPassword, listAccountSessions, revokeAccountSession, revokeOtherAccountSessions
getPlatformSettings, updatePlatformSettings
listAuditLogs, listLoginLogs
```

Use whitelist sort helpers instead of arbitrary property access. Mutations prepend an audit record. Successful and failed Fake logins prepend a login-log record.

- [ ] **Step 5: Implement Fake HTTP routes**

Each `.fake.ts` file uses `defineFakeRoute` and URLs without the Vite `/api` basename. Validate duplicate usernames/emails, protected current-user actions, built-in role deletion, avatar MIME/size, current password, session ownership, and site-title length. Return `resultError(msg, code)` for invalid actions and `resultSuccess(data)` otherwise.

- [ ] **Step 6: Add post-implementation Fake behavior tests**

Test through store functions and Fake route handlers:

- creating/editing/filtering/sorting a user;
- assigning roles and seeing updated member counts;
- reset-password and force-logout results;
- avatar update/delete and session revoke;
- site-title update;
- audit/login-log filters and pagination;
- administrator versus viewer permission sets.

Run: `pnpm test -- --run tests/admin-experience-fake.test.ts tests/fake-rbac.test.ts tests/common-domains.test.ts`

Expected: all state resets in `beforeEach`, and all assertions pass deterministically.

- [ ] **Step 7: Commit**

```bash
git add src/api fake tests/admin-experience-fake.test.ts tests/fake-rbac.test.ts tests/common-domains.test.ts
git commit -m "feat(fake): 扩展后台交互领域契约"
```

---

### Task 3: Focused authentication and dashboard

**Files:**
- Modify: `src/pages/login/index.tsx`
- Modify: `src/pages/login/components/password-login.tsx`
- Create: `src/pages/login/components/auth-page-shell.tsx`
- Create: `src/pages/forgot-password/index.tsx`
- Modify: `src/pages/dashboard/index.tsx`
- Modify: `src/pages/dashboard/components/overview-card.tsx`
- Create: `src/pages/dashboard/constants.tsx`
- Modify: `src/router/routes/core/auth.ts`
- Modify: `src/locales/zh-CN/authority.json`
- Modify: `src/locales/en-US/authority.json`
- Modify: `src/locales/zh-CN/dashboard.json`
- Modify: `src/locales/en-US/dashboard.json`
- Create: `tests/auth-dashboard-ui-contract.test.ts`

**Interfaces:**
- Consumes: existing auth store, `fetchDashboardSummary`, Task 1 buttons, Task 2 dashboard response.
- Produces: `/login`, `/forgot-password`, and source-style `/dashboard` experience.

- [ ] **Step 1: Build the focused auth shell**

Create a responsive centered card with brand icon/title, subtitle, top-right language/theme controls, security hint, and copyright. Use AntD `Card`, `Flex`, `Typography`, and tokens; keep page width within `min(100% - 32px, 440px)`.

- [ ] **Step 2: Rework password login**

Keep the current `fetchLogin`/auth-store flow, validation, error Alert, and loading state. Replace the split-template content with source order: identity, password, forgot-password text action, error, primary submit, authorized-only hint. Add a compact “体验身份” dropdown whose admin/viewer choices fill `admin/admin123` and `viewer/viewer123`.

- [ ] **Step 3: Add the forgot-password route**

Render the same auth shell with a contact-administrator Result and a `BasicButton` that navigates to `/login`. Add `/forgot-password` to core auth routes and the route whitelist.

- [ ] **Step 4: Rebuild dashboard metrics**

Move metric metadata/icon/color mapping to `constants.tsx`. Render greeting plus responsive statistic cards. Filter log-dependent metrics when `usePermission("audit:view")` is false. Use Card skeletons on initial load, Empty when no metrics are visible, and Result + retry button on failure.

- [ ] **Step 5: Add locales and contract test**

Keep Chinese/English key parity. The contract test asserts the focused auth shell exists, both fake account strings remain discoverable, forgot-password is a whitelisted route, dashboard has no page-local Fake metrics, and the old split marketing panel text is absent.

Run: `pnpm test -- --run tests/auth-dashboard-ui-contract.test.ts tests/generic-template.test.ts`

Expected: all assertions pass.

- [ ] **Step 6: Commit**

```bash
git add src/pages/login src/pages/forgot-password src/pages/dashboard src/router/routes/core/auth.ts src/locales tests/auth-dashboard-ui-contract.test.ts tests/generic-template.test.ts
git commit -m "feat(auth): 重做认证与工作台体验"
```

---

### Task 4: Full user-management interaction

**Files:**
- Modify: `src/pages/system/user/index.tsx`
- Modify: `src/pages/system/user/constants.tsx`
- Modify: `src/pages/system/user/components/role-assign.tsx`
- Modify: `src/pages/system/user/components/detail.tsx`
- Create: `src/pages/system/user/components/create-user-drawer.tsx`
- Create: `src/pages/system/user/components/edit-user-modal.tsx`
- Create: `src/pages/system/user/components/reset-password-modal.tsx`
- Create: `src/pages/system/user/components/reset-password-result.tsx`
- Create: `src/pages/system/user/components/force-logout-modal.tsx`
- Modify: `src/locales/zh-CN/system.json`
- Modify: `src/locales/en-US/system.json`
- Create: `tests/user-management-ui-contract.test.ts`

**Interfaces:**
- Consumes: Task 1 `BasicButton`/`DangerConfirmation`, Task 2 user/role request functions.
- Produces: a small page orchestrator and controlled domain components.

- [ ] **Step 1: Replace the page orchestrator**

Keep query state as `{ page, page_size, keyword, status, sort, order }`. `useQuery` loads users; mutations invalidate `['system-users']` and any affected role/account query. The page owns which Drawer/Modal is open and passes explicit callbacks to children.

- [ ] **Step 2: Build the column factory**

Export `createUserColumns({ permissions, onEdit, onAssignRoles, onResetPassword, onForceLogout })`. Columns are username, display name, email, status Badge, created time, and compact BasicButton actions. Sortable columns translate AntD sort order to the Task 2 whitelist.

- [ ] **Step 3: Build controlled creation/editing flows**

`CreateUserDrawer` collects username, display name, email, and password. `EditUserModal` edits display name and status; selecting disabled shows an inline warning. Both submit via parent callbacks and keep loading on the confirm button.

- [ ] **Step 4: Build role, password, and force-logout flows**

`RoleAssign` shows assigned role tags and available role switches. `ResetPasswordModal` validates a password, and `ResetPasswordResult` shows the returned temporary password once with clipboard copy. `ForceLogoutModal` wraps `DangerConfirmation` with the username target and displays revoked session count after success.

- [ ] **Step 5: Configure BasicTable**

Use ProTable's query form, reset/query buttons, reload, density, setting, and fullscreen. Persist `columnsState` and density under application-prefixed localStorage keys. Narrow screens keep horizontal table scroll and stack filter actions.

- [ ] **Step 6: Add locale parity and contract tests**

The test asserts the page imports no Fake modules or literal user array, the large flows live under `components/`, every write action calls a `fetch*` API function, and permission gates include add/edit/assign/reset/force-logout.

Run: `pnpm test -- --run tests/user-management-ui-contract.test.ts tests/admin-experience-fake.test.ts`

Expected: contracts and Fake behavior pass.

- [ ] **Step 7: Commit**

```bash
git add src/pages/system/user src/locales/zh-CN/system.json src/locales/en-US/system.json tests/user-management-ui-contract.test.ts
git commit -m "feat(users): 迁移完整用户管理交互"
```

---

### Task 5: Role management and permission-page alignment

**Files:**
- Modify: `src/pages/system/role/index.tsx`
- Modify: `src/pages/system/role/constants.tsx`
- Modify: `src/pages/system/role/components/detail.tsx`
- Create: `src/pages/system/role/components/create-role-modal.tsx`
- Create: `src/pages/system/role/components/rename-role-modal.tsx`
- Create: `src/pages/system/role/components/permission-drawer.tsx`
- Create: `src/pages/system/role/components/delete-role-modal.tsx`
- Modify: `src/pages/system/menu/index.tsx`
- Modify: `src/pages/system/menu/constants.tsx`
- Modify: `src/pages/system/menu/tree-menu.tsx`
- Modify: `src/locales/zh-CN/system.json`
- Modify: `src/locales/en-US/system.json`
- Create: `tests/role-management-ui-contract.test.ts`

**Interfaces:**
- Consumes: Task 1 primitives; Task 2 role/user/permission APIs.
- Produces: full role CRUD, grouped permission assignment, and aligned permission viewer.

- [ ] **Step 1: Replace role columns and toolbar**

Use columns for display name, role key, member count, compact permission summary, and actions. Hide create/rename/configure/delete operations without their existing permission codes. Render a tooltip instead of a delete button for built-in roles.

- [ ] **Step 2: Build role Modal components**

Creation collects name and immutable key. Rename edits display name only. Delete uses `DangerConfirmation`, includes current member count, and rejects built-in roles before the mutation.

- [ ] **Step 3: Build grouped permission Drawer**

Convert `PermissionTreeNode[]` to AntD Tree data. Keep controlled `checkedKeys` and `expandedKeys`; provide Expand all, Collapse all, Select all, Clear, Cancel, and Save. Saving calls `fetchBindRoleMenus` and refreshes role summaries.

- [ ] **Step 4: Add member-maintenance navigation**

Render the source-style member guide and navigate to `/system/user?role_id=<id>`. User management reads the optional query parameter into its filter/role-assignment context without introducing a new store.

- [ ] **Step 5: Align the permission page**

Keep its current read-only domain behavior. Reuse new Card, BasicTable/Tree, status Badge, loading, empty, failure, and narrow-screen styles so it no longer looks like the old page set.

- [ ] **Step 6: Add tests and commit**

The contract test asserts built-in delete protection, grouped permission component ownership, member navigation, permission gates, and absence of direct Fake imports.

Run: `pnpm test -- --run tests/role-management-ui-contract.test.ts tests/admin-experience-fake.test.ts`

```bash
git add src/pages/system/role src/pages/system/menu src/locales/zh-CN/system.json src/locales/en-US/system.json tests/role-management-ui-contract.test.ts
git commit -m "feat(roles): 迁移角色与权限配置交互"
```

---

### Task 6: Audit and login-log workspaces

**Files:**
- Create: `src/components/log-table-panel/index.tsx`
- Modify: `src/pages/audit/index.tsx`
- Modify: `src/pages/audit/constants.tsx`
- Create: `src/pages/audit/components/audit-detail-drawer.tsx`
- Create: `src/pages/login-log/index.tsx`
- Create: `src/pages/login-log/constants.tsx`
- Create: `src/pages/login-log/components/login-detail-drawer.tsx`
- Create: `src/locales/zh-CN/login-log.json`
- Create: `src/locales/en-US/login-log.json`
- Modify: `src/locales/zh-CN/audit.json`
- Modify: `src/locales/en-US/audit.json`
- Create: `tests/log-workspaces-ui-contract.test.ts`

**Interfaces:**
- Consumes: Task 2 audit/login-log list APIs and BasicTable.
- Produces: `LogTablePanel<RecordType>` with `{ title, columns, request, searchFields, onOpenDetail }` and two route pages.

- [ ] **Step 1: Create the shared semantic log panel**

Wrap `BasicContent` + `BasicTable` without owning domain columns. It accepts domain search fields and keeps query filters plus the table inside the same fullscreen root. It standardizes skeleton, empty, Result/retry, reload, density, settings, pagination, and narrow-screen layout.

- [ ] **Step 2: Rebuild audit logs**

Use action, result, and DatePicker range filters. Columns are operator, action, target, result Badge, IP, created time, and View. Translate sorter changes to the API whitelist. The detail Drawer uses Descriptions and displays every row field.

- [ ] **Step 3: Add login logs**

Use result and date-range filters. Columns are identifier, result Badge, device, IP, language, time zone, created time, and View. The detail Drawer matches the same workspace language but owns login-specific fields.

- [ ] **Step 4: Add tests and commit**

The contract test asserts both pages use `LogTablePanel`, keep domain-specific columns, call only their own API modules, include fullscreen/density/settings, and have matching bilingual namespaces.

Run: `pnpm test -- --run tests/log-workspaces-ui-contract.test.ts tests/admin-experience-fake.test.ts`

```bash
git add src/components/log-table-panel src/pages/audit src/pages/login-log src/locales/zh-CN/audit.json src/locales/en-US/audit.json src/locales/zh-CN/login-log.json src/locales/en-US/login-log.json tests/log-workspaces-ui-contract.test.ts
git commit -m "feat(logs): 迁移审计与登录日志交互"
```

---

### Task 7: Account profile and security settings

**Files:**
- Create: `src/pages/account/profile/index.tsx`
- Create: `src/pages/account/profile/components/profile-summary.tsx`
- Create: `src/pages/account/settings/index.tsx`
- Create: `src/pages/account/settings/components/basic-settings.tsx`
- Create: `src/pages/account/settings/components/avatar-settings.tsx`
- Create: `src/pages/account/settings/components/password-settings.tsx`
- Create: `src/pages/account/settings/components/session-list.tsx`
- Create: `src/locales/zh-CN/account.json`
- Create: `src/locales/en-US/account.json`
- Modify: `src/store/user.ts`
- Create: `tests/account-ui-contract.test.ts`

**Interfaces:**
- Consumes: Task 2 account API; Task 1 `BasicButton`.
- Produces: profile and settings route components; updates current-user display name/avatar after successful mutations.

- [ ] **Step 1: Build profile page**

Load `fetchAccountProfile`. Render source-style PageHeader/BasicContent, avatar summary Card, role Tags, Descriptions, and primary Edit button. Use Card skeleton, Result/retry, and Empty only when the account response is absent.

- [ ] **Step 2: Build basic and avatar settings**

`BasicSettings` edits display name; username/email remain read-only. `AvatarSettings` accepts PNG/JPEG/WebP up to 2MB, previews before submission, uploads through `fetchUploadAccountAvatar`, and deletes through `fetchDeleteAccountAvatar`. Successful changes update Query cache and `useUserStore`.

- [ ] **Step 3: Build password and session settings**

Validate current password, new password length, and confirmation. After password change, show the returned invalidated-session count. `SessionList` protects the current item, supports revoke-one with Popconfirm and revoke-others with Popconfirm, and refreshes the session Query after mutation.

- [ ] **Step 4: Compose settings tabs**

Use AntD Tabs for Basic and Security sections. Each section owns its mutation errors and success Alerts. On narrow screens, session metadata wraps vertically and actions remain reachable.

- [ ] **Step 5: Add tests and commit**

The contract test asserts type/size validation, current-session protection, query invalidation, user-store updates, no direct Fake import, and Chinese/English key parity.

Run: `pnpm test -- --run tests/account-ui-contract.test.ts tests/admin-experience-fake.test.ts`

```bash
git add src/pages/account src/locales/zh-CN/account.json src/locales/en-US/account.json src/store/user.ts tests/account-ui-contract.test.ts
git commit -m "feat(account): 新增账户资料与安全设置"
```

---

### Task 8: Platform settings, system information, routes, and shell integration

**Files:**
- Create: `src/pages/system/settings/index.tsx`
- Create: `src/pages/system/about/index.tsx`
- Create: `src/pages/system/about/constants.tsx`
- Modify: `src/router/routes/static/system.ts`
- Modify: `src/router/routes/static/audit.ts`
- Create: `src/router/routes/static/account.ts`
- Modify: `src/router/routes/index.ts`
- Modify: `src/router/extra-info/order.ts`
- Modify: `src/layout/layout-header/components/user-menu.tsx`
- Modify: `src/layout/widgets/logo/index.tsx`
- Modify: `src/pages/login/components/auth-page-shell.tsx`
- Modify: `src/app.tsx`
- Create: `src/hooks/use-site-title/index.ts`
- Create: `src/locales/zh-CN/settings.json`
- Create: `src/locales/en-US/settings.json`
- Modify: `src/locales/zh-CN/common.json`
- Modify: `src/locales/en-US/common.json`
- Modify: `fake/store.ts`
- Modify: `tests/generic-template.test.ts`
- Modify: `tests/template-contract.test.ts`
- Create: `tests/system-integration-ui-contract.test.ts`

**Interfaces:**
- Consumes: Task 2 settings/info API and every completed page component.
- Produces: registered static routes, menus, user-menu links, dynamic site title, full locale registration.

- [ ] **Step 1: Build platform settings**

Load settings with Card skeleton and retry Result. Show site-title Form with length 2-40. Users with `system:settings:edit` see Save; read-only users see the value plus an informational Alert. Successful save updates `['platform-settings']` cache immediately.

- [ ] **Step 2: Build about-system page**

Load Fake runtime info. Render runtime Descriptions, frontend stack cards from `package.json`-backed build constants, and an actual-production-dependencies table. Explicitly label Go/PostgreSQL as absent so the page cannot imply they ship in the mother template.

- [ ] **Step 3: Integrate site title**

`useSiteTitle` reads `['platform-settings']` with a fallback of `Product UI Template`. Use it in logo, auth shell, copyright, and `document.title`. Settings mutation updates every consumer through the shared Query cache; do not add a duplicate Zustand setting.

- [ ] **Step 4: Register routes and user menu**

Add system settings/about children, audit/login child, hidden account profile/settings routes, and public forgot-password. User menu items become Profile, Account settings, divider, Logout. Each protected route has `handle.permission`; account routes set `hideInMenu: true`.

- [ ] **Step 5: Register permissions and locale namespaces**

Add new permission records to `fake/store.ts` and both fake identities according to the design. Ensure all JSON namespaces are auto-loaded by locale helpers and Chinese/English leaf keys match.

- [ ] **Step 6: Update architecture contract tests**

Change the old assertion that account routes are absent. Assert instead that account routes exist, every new Fake domain exists, no `/api/platform`, proxy, MSW, OpenAPI, Go, or real URL is present, and page source does not import `fake/`.

Run: `pnpm test -- --run tests/system-integration-ui-contract.test.ts tests/template-contract.test.ts tests/generic-template.test.ts`

Expected: all integration contracts pass.

- [ ] **Step 7: Commit**

```bash
git add src/pages/system/settings src/pages/system/about src/router src/layout src/pages/login/components/auth-page-shell.tsx src/app.tsx src/hooks/use-site-title src/locales fake/store.ts tests
git commit -m "feat(system): 集成平台设置与后台路由"
```

---

### Task 9: Post-implementation verification and browser acceptance

**Files:**
- Modify only files required to fix evidence-backed defects found by this task.
- Record no generated build output, preview logs, screenshots, or `circular-deps.json` in Git.

**Interfaces:**
- Consumes: Tasks 1-8 complete application.
- Produces: fresh static, build, behavior, desktop, narrow-screen, theme, and permission evidence.

- [ ] **Step 1: Run focused tests**

Run:

```bash
pnpm test -- --run src/components/danger-confirmation/index.test.tsx tests/admin-experience-fake.test.ts tests/auth-dashboard-ui-contract.test.ts tests/user-management-ui-contract.test.ts tests/role-management-ui-contract.test.ts tests/log-workspaces-ui-contract.test.ts tests/account-ui-contract.test.ts tests/system-integration-ui-contract.test.ts
```

Expected: every focused test file passes with zero failures.

- [ ] **Step 2: Run the repository completion gate**

Run each command separately and retain its exit code/output:

```bash
pnpm run typecheck
pnpm test -- --run
pnpm run lint
pnpm run check:circular-deps
pnpm run build:prod
```

Expected: all commands exit 0; circular-dependency output reports no cycle.

- [ ] **Step 3: Start production-like preview**

Run `pnpm preview -- --host 127.0.0.1` after `build:prod`. Confirm every `/api` request remains served by `vite-plugin-fake-server` with `enableProd: true`; confirm there are no network requests to another origin.

- [ ] **Step 4: Verify administrator desktop flow**

At 1440×900, log in with `admin/admin123` and verify:

- dashboard load/retry/metrics;
- user query, create, edit, role assignment, password result/copy, and force logout;
- role create/rename/permissions/delete protection;
- permission viewer;
- audit and login-log filters, sorting, details, density, settings, fullscreen;
- account profile, avatar validation/upload/delete, display name, password, revoke one/revoke others;
- platform title immediately updates logo/login/document title;
- about-system data is mother-template accurate.

- [ ] **Step 5: Verify read-only and responsive/theme flow**

Log out and use `viewer/viewer123`. Verify protected actions and routes are hidden/forbidden. At 390×844 verify auth card, menu Drawer, filters, horizontal tables, Modal/Drawer widths, account sessions, and all primary actions. Repeat representative login, user, logs, and account pages in dark mode.

- [ ] **Step 6: Fix only observed defects and rerun affected gates**

For each defect, capture the failing visible state or command, make the minimum change in its owning component/domain, rerun the focused test, then rerun the full completion gate if source changed.

- [ ] **Step 7: Final commit**

```bash
git status --short
git add -- src fake tests
git commit -m "fix(ui): 修正后台迁移验收问题"
```

Skip this commit when Task 9 finds no defects and the worktree is already clean.
