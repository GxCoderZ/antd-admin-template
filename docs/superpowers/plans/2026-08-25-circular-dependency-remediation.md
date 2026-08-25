# Circular Dependency Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate all 116 circular dependency paths while preserving login, token refresh, permission initialization, logout, Fake-only contracts, and existing UI behavior.

**Architecture:** Convert auth, user, and access Zustand stores into state-only owners. Move cross-store cleanup into an application session orchestrator, build access snapshots in a pure Router utility, and route refresh-token traffic through a leaf Ky client so Request never imports an API module that imports Request back.

**Tech Stack:** React 18, TypeScript, React Router 7, Zustand 5, Ky, Vitest, Vite Fake Server, pnpm.

**Spec:** `docs/superpowers/specs/2026-08-25-circular-dependency-remediation-design.md`

## Global Constraints

- Work only in `.worktrees/migrate-react-antd-admin-ui` on branch `codex/migrate-react-antd-admin-ui`.
- Preserve Fake-only `/api` behavior; do not add a backend URL, proxy, or Fake/Real switch.
- Do not add circular-dependency ignore rules or exclude affected files from scanning.
- Store modules must not send HTTP requests, modify Router, or reset sibling stores.
- Keep the current login UI, permission codes, static routes, redirects, messages, and loading states.
- The user explicitly requested no TDD: implement first, then add regression tests.
- Use pnpm for every package script.

---

### Task 1: Split the Refresh-Token Transport From the Authenticated Request

**Files:**
- Create: `src/utils/request/client.ts`
- Create: `src/api/auth/refresh.ts`
- Modify: `src/utils/request/index.ts`
- Modify: `src/utils/request/refresh.ts`
- Modify: `src/api/auth/index.ts`

**Interfaces:**
- Produces: `rawRequest: KyInstance` from `src/utils/request/client.ts`.
- Produces: `fetchRefreshToken(data: { readonly refreshToken: string }): Promise<ApiResponse<RefreshTokenResult>>` from `src/api/auth/refresh.ts`.
- Preserves: `request: KyInstance` and `refreshTokenAndRetry(request, options, refreshToken)`.

- [ ] **Step 1: Create the leaf Ky client**

Create `src/utils/request/client.ts` with transport-only configuration:

```ts
import type { Options } from "ky";

import ky from "ky";

const API_TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT) || 10000;

const rawRequestConfig: Options = {
	prefixUrl: "",
	timeout: API_TIMEOUT,
	retry: { limit: 3 },
};

export const rawRequest = ky.create(rawRequestConfig);
```

This file must not import API, Router, Store, application, React, or Ant Design modules.

- [ ] **Step 2: Make the authenticated request extend the leaf client**

In `src/utils/request/index.ts`:

- Remove the direct `ky` import and local timeout/retry/prefix configuration.
- Import `rawRequest` from `./client`.
- Keep the existing request whitelist and hooks unchanged.
- Replace `ky.create(defaultConfig)` with `rawRequest.extend(defaultConfig)`.
- Keep `defaultConfig` limited to `hooks` so raw and authenticated clients share transport defaults.

The bottom of the file must be:

```ts
export const request = rawRequest.extend(defaultConfig);
```

- [ ] **Step 3: Move the refresh endpoint into a leaf API module**

Create `src/api/auth/refresh.ts`:

```ts
import type { LoginResult } from "./types";

import { rawRequest } from "#src/utils/request/client";

export interface RefreshTokenResult {
	token: string
	refreshToken: string
}

export async function fetchRefreshToken(data: { readonly refreshToken: string }) {
	const response = await rawRequest
		.post("/api/auth/refresh-token", { json: { refresh_token: data.refreshToken } })
		.json<ApiResponse<LoginResult>>();

	if (response.code !== 0 || !response.data) {
		throw new Error(response.msg || "登录状态已失效");
	}

	return {
		...response,
		data: {
			token: response.data.access_token,
			refreshToken: response.data.refresh_token,
		},
	} as ApiResponse<RefreshTokenResult>;
}
```

In `src/api/auth/index.ts`, remove the local `fetchRefreshToken` implementation and re-export it:

```ts
export { fetchRefreshToken } from "./refresh";
export type { RefreshTokenResult } from "./refresh";
```

- [ ] **Step 4: Point the refresh coordinator at the leaf API module**

In `src/utils/request/refresh.ts`, change only the endpoint import:

```ts
import { fetchRefreshToken } from "#src/api/auth/refresh";
```

Do not import from the auth barrel because that barrel also owns endpoints using authenticated `request`.

- [ ] **Step 5: Verify Task 1**

Run:

```bash
pnpm run typecheck
pnpm test -- --run
pnpm run check:circular-deps
```

Expected:

- TypeScript and existing tests pass.
- The direct `utils/request/refresh → api/auth/index → utils/request/index` cycle is gone.
- Other auth/access cycles may remain until Tasks 2 and 3.

- [ ] **Step 6: Commit Task 1**

```bash
git add src/utils/request/client.ts src/utils/request/index.ts src/utils/request/refresh.ts src/api/auth/index.ts src/api/auth/refresh.ts circular-deps.json
git commit -m "refactor: isolate token refresh transport"
```

---

### Task 2: Make Auth and User Stores Pure and Centralize Session Cleanup

**Files:**
- Create: `src/application/session.ts`
- Modify: `src/store/auth.ts`
- Modify: `src/store/user.ts`
- Modify: `src/pages/login/components/password-login.tsx`
- Modify: `src/router/guard/auth-guard.tsx`
- Modify: `src/layout/layout-header/components/user-menu.tsx`
- Modify: `src/utils/request/go-login.ts`

**Interfaces:**
- Produces: `AuthTokens { token: string; refreshToken: string }` and `setTokens(tokens: AuthTokens): void`.
- Produces: `setUserInfo(userInfo: UserInfoType): void`.
- Produces: `clearSession(): void`.
- Consumes: existing `fetchLogin`, `fetchCurrentUser`, and store `reset()` actions.

- [ ] **Step 1: Reduce Auth Store to token state**

Replace API and sibling-Store imports in `src/store/auth.ts` with only Zustand persistence utilities. Use this public shape:

```ts
export interface AuthTokens {
	token: string
	refreshToken: string
}

const initialState: AuthTokens = {
	token: "",
	refreshToken: "",
};

interface AuthAction {
	setTokens: (tokens: AuthTokens) => void
	reset: () => void
}
```

The actions must be state-only:

```ts
setTokens: tokens => set(tokens),
reset: () => set(initialState),
```

Keep the existing `getAppNamespace("access-token")` persistence name. Remove `login`, `logout`, `fetchLogin`, and all imports of user/access/tabs stores.

- [ ] **Step 2: Reduce User Store to user state**

In `src/store/user.ts`, remove `fetchCurrentUser` and expose:

```ts
interface UserAction {
	setUserInfo: (userInfo: UserInfoType) => void
	reset: () => void
}
```

Implement:

```ts
setUserInfo: userInfo => set(userInfo),
reset: () => set(initialState),
```

The only non-library import may be the `UserInfoType` type.

- [ ] **Step 3: Add the session orchestrator**

Create `src/application/session.ts`:

```ts
import { useAccessStore } from "#src/store/access";
import { useAuthStore } from "#src/store/auth";
import { useTabsStore } from "#src/store/tabs";
import { useUserStore } from "#src/store/user";

export function clearSession() {
	useAuthStore.getState().reset();
	useUserStore.getState().reset();
	useAccessStore.getState().reset();
	useTabsStore.getState().resetTabs();
}
```

This is the only module allowed to know all four session stores.

- [ ] **Step 4: Move login orchestration to the login page**

In `src/pages/login/components/password-login.tsx`:

- Import `fetchLogin` from `#src/api/auth`.
- Select `setTokens` instead of `login` from Auth Store.
- Preserve the existing loading, message, error Alert, redirect, form values, and demo-account behavior.

The `try` body of `handleFinish` must follow this shape:

```ts
const response = await fetchLogin(values);
if (response.code !== 0 || !response.data) {
	throw new Error(response.msg || t("authority.loginFailed"));
}
setTokens({
	token: response.data.access_token,
	refreshToken: response.data.refresh_token || "",
});
```

- [ ] **Step 5: Move user loading to AuthGuard**

In `src/router/guard/auth-guard.tsx`:

- Import `fetchCurrentUser` from `#src/api/auth`.
- Select `setUserInfo` instead of `getUserInfo` from User Store.
- Replace `await getUserInfo()` with explicit response validation and state write:

```ts
const userResponse = await fetchCurrentUser();
if (userResponse.code !== 0 || !userResponse.data) {
	throw new Error(userResponse.msg || "获取用户信息失败");
}
setUserInfo(userResponse.data);
```

Keep permission loading and access initialization unchanged until Task 3.

- [ ] **Step 6: Route active and forced logout through `clearSession`**

In `src/layout/layout-header/components/user-menu.tsx`:

- Remove `useAuthStore` and the `logout` selector.
- Import `clearSession`.
- In the logout branch, call `clearSession()` and then `navigate(loginPath)`.

In `src/utils/request/go-login.ts`:

- Replace the Auth Store import with `clearSession`.
- Call `clearSession()` before preserving the existing hash/browser redirect logic.

- [ ] **Step 7: Verify Task 2**

Run:

```bash
pnpm run typecheck
pnpm test -- --run
pnpm run check:circular-deps
```

Expected:

- Existing behavior tests pass.
- No cycle includes `store/auth.ts`, `store/user.ts`, `api/auth`, or Request.
- Access/Router/Layout cycles remain until Task 3.

- [ ] **Step 8: Commit Task 2**

```bash
git add src/application/session.ts src/store/auth.ts src/store/user.ts src/pages/login/components/password-login.tsx src/router/guard/auth-guard.tsx src/layout/layout-header/components/user-menu.tsx src/utils/request/go-login.ts circular-deps.json
git commit -m "refactor: move session flows above stores"
```

---

### Task 3: Make Access Store a Pure Snapshot Owner

**Files:**
- Create: `src/router/utils/create-access-snapshot.ts`
- Modify: `src/store/access.ts`
- Modify: `src/router/guard/auth-guard.tsx`

**Interfaces:**
- Produces: `AccessSnapshot` with menus, route list, flat route map, and permission Set.
- Produces: `setAccessSnapshot(snapshot: AccessSnapshot): AccessState`.
- Produces: `createAccessSnapshot(userPermissions: string[]): AccessSnapshot`.

- [ ] **Step 1: Define a state-only Access Store**

In `src/store/access.ts`, retain only type imports for `MenuItemType` and `AppRouteRecordRaw`, plus Zustand. Export:

```ts
export interface AccessSnapshot {
	wholeMenus: MenuItemType[]
	routeList: AppRouteRecordRaw[]
	flatRouteList: Record<string, AppRouteRecordRaw>
	permissions: Set<string>
}
```

Use an empty initial state:

```ts
const initialState: AccessState = {
	wholeMenus: [],
	routeList: [],
	flatRouteList: {},
	permissions: new Set<string>(),
	isAccessChecked: false,
};
```

Implement actions without persistence or Router access:

```ts
setAccessSnapshot: (snapshot) => {
	const newState = { ...snapshot, isAccessChecked: true };
	set(newState);
	return newState;
},
reset: () => set({
	wholeMenus: [],
	routeList: [],
	flatRouteList: {},
	permissions: new Set<string>(),
	isAccessChecked: false,
}),
```

Remove imports of Router, static routes, route utilities, `getAppNamespace`, and Zustand `persist`.

- [ ] **Step 2: Add the pure access snapshot builder**

Create `src/router/utils/create-access-snapshot.ts`:

```ts
import type { AccessSnapshot } from "#src/store/access";

import { accessRoutes, baseRoutes } from "#src/router/routes";
import { ascending } from "#src/router/utils/ascending";
import { flattenRoutes } from "#src/router/utils/flatten-routes";
import { generateMenuItemsFromRoutes } from "#src/router/utils/generate-menu-items-from-routes";
import { generateRoutesByFrontend } from "#src/router/utils/generate-routes-from-frontend";

export function createAccessSnapshot(userPermissions: string[]): AccessSnapshot {
	const permittedRoutes = generateRoutesByFrontend(accessRoutes, userPermissions);

	return {
		wholeMenus: generateMenuItemsFromRoutes(ascending(permittedRoutes)),
		routeList: baseRoutes,
		flatRouteList: flattenRoutes(baseRoutes),
		permissions: new Set(userPermissions),
	};
}
```

This function is pure with respect to Store and Router state: it returns data and performs no writes.

- [ ] **Step 3: Make AuthGuard build and write the snapshot**

In `src/router/guard/auth-guard.tsx`:

- Remove `accessRoutes`, `removeDuplicateRoutes`, and temporary `routes` construction.
- Import `createAccessSnapshot`.
- Select `setAccessSnapshot` from Access Store.
- After permission loading, call:

```ts
setAccessSnapshot(createAccessSnapshot(userPermissions));
```

Keep route authorization based on `routeList` and `permissions`, so configured permissions still redirect to 403.

- [ ] **Step 4: Verify zero cycles**

Run:

```bash
pnpm run typecheck
pnpm test -- --run
pnpm run check:circular-deps
```

Expected scanner output:

```text
0 circles were found.
```

Inspect `circular-deps.json` and confirm its exact JSON value is:

```json
[]
```

- [ ] **Step 5: Commit Task 3**

```bash
git add src/store/access.ts src/router/utils/create-access-snapshot.ts src/router/guard/auth-guard.tsx circular-deps.json
git commit -m "refactor: isolate access state from router"
```

---

### Task 4: Add Post-Implementation Regression Coverage

**Files:**
- Create: `tests/session-lifecycle.test.ts`
- Create: `tests/access-snapshot.test.ts`
- Create: `tests/session-architecture.test.ts`

**Interfaces:**
- Consumes: `clearSession`, `createAccessSnapshot`, auth/user/access/tabs stores.
- Verifies: state clearing, permission snapshot contents, and source-level dependency boundaries.

- [ ] **Step 1: Add the session cleanup behavior test**

Create `tests/session-lifecycle.test.ts` that:

```ts
import { clearSession } from "#src/application/session";
import { useAccessStore } from "#src/store/access";
import { useAuthStore } from "#src/store/auth";
import { useTabsStore } from "#src/store/tabs";
import { useUserStore } from "#src/store/user";

describe("session lifecycle", () => {
	it("clears every session-owned store", () => {
		useAuthStore.getState().setTokens({ token: "access", refreshToken: "refresh" });
		useUserStore.getState().setUserInfo({
			id: 1,
			avatar: "avatar.png",
			username: "admin",
			email: "admin@example.com",
			phoneNumber: "13800000000",
			description: "Administrator",
			roles: ["admin"],
		});
		useAccessStore.getState().setAccessSnapshot({
			wholeMenus: [],
			routeList: [],
			flatRouteList: {},
			permissions: new Set(["system:user:view"]),
		});
		useTabsStore.setState({ activeKey: "/system/user" });

		clearSession();

		expect(useAuthStore.getState()).toMatchObject({ token: "", refreshToken: "" });
		expect(useUserStore.getState()).toMatchObject({ id: 0, username: "", roles: [] });
		expect(useAccessStore.getState().isAccessChecked).toBe(false);
		expect(useAccessStore.getState().permissions.size).toBe(0);
		expect(useTabsStore.getState().activeKey).toBe("");
	});
});
```

If `UserInfoType` requires optional aliases rather than `phoneNumber`, use the exact current API contract without widening production types.

- [ ] **Step 2: Add the access snapshot behavior test**

Create `tests/access-snapshot.test.ts`:

```ts
import { createAccessSnapshot } from "#src/router/utils/create-access-snapshot";

function collectMenuKeys(items: ReturnType<typeof createAccessSnapshot>["wholeMenus"]): string[] {
	return items.flatMap(item => [item.key, ...collectMenuKeys(item.children ?? [])]);
}

describe("createAccessSnapshot", () => {
	it("filters menus while retaining the full route matching snapshot", () => {
		const snapshot = createAccessSnapshot(["system:user:view"]);
		const menuKeys = collectMenuKeys(snapshot.wholeMenus);

		expect(snapshot.permissions).toEqual(new Set(["system:user:view"]));
		expect(snapshot.routeList.length).toBeGreaterThan(0);
		expect(Object.keys(snapshot.flatRouteList).length).toBeGreaterThan(0);
		expect(menuKeys).toContain("/system/user");
		expect(menuKeys).not.toContain("/system/role");
	});
});
```

- [ ] **Step 3: Lock the dependency boundaries**

Create `tests/session-architecture.test.ts` using the repository's existing source-contract pattern:

```ts
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const read = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), "utf8");

describe("session dependency boundaries", () => {
	it("keeps session stores free of transport and router side effects", () => {
		const authStore = read("src/store/auth.ts");
		const userStore = read("src/store/user.ts");
		const accessStore = read("src/store/access.ts");

		expect(authStore).not.toContain("#src/api");
		expect(authStore).not.toContain("useUserStore");
		expect(authStore).not.toContain("useAccessStore");
		expect(authStore).not.toContain("useTabsStore");
		expect(userStore).not.toContain("#src/api");
		expect(accessStore).not.toContain("#src/router/routes");
		expect(accessStore).not.toMatch(/from\s+"#src\/router"/);
		expect(accessStore).not.toContain("persist(");
	});

	it("routes refresh traffic through the leaf transport", () => {
		const refreshCoordinator = read("src/utils/request/refresh.ts");
		const refreshEndpoint = read("src/api/auth/refresh.ts");
		const rawClient = read("src/utils/request/client.ts");

		expect(refreshCoordinator).toContain("#src/api/auth/refresh");
		expect(refreshEndpoint).toContain("#src/utils/request/client");
		expect(refreshEndpoint).not.toMatch(/from\s+"#src\/utils\/request"/);
		expect(rawClient).not.toMatch(/#src\/(api|store|router|application)/);
	});
});
```

- [ ] **Step 4: Run the new tests and the full suite**

Run:

```bash
pnpm test -- --run tests/session-lifecycle.test.ts tests/access-snapshot.test.ts tests/session-architecture.test.ts
pnpm test -- --run
```

Expected: all new tests and the complete suite pass.

- [ ] **Step 5: Commit Task 4**

```bash
git add tests/session-lifecycle.test.ts tests/access-snapshot.test.ts tests/session-architecture.test.ts
git commit -m "test: cover session dependency boundaries"
```

---

### Task 5: Run Full Static, Build, and Browser Acceptance

**Files:**
- Inspect: `circular-deps.json`
- No planned production edits; fix only regressions found by the checks.

**Interfaces:**
- Consumes the complete implementation.
- Produces fresh completion evidence.

- [ ] **Step 1: Run every repository completion command**

Run separately and record exit status/output:

```bash
pnpm run typecheck
pnpm test -- --run
pnpm run lint
pnpm run check:circular-deps
pnpm run build:prod
```

Expected:

- TypeScript exit 0.
- All tests pass.
- Lint has 0 errors; pre-existing warnings may remain only if unchanged.
- Circular scanner says `0 circles were found`; `circular-deps.json` is `[]`.
- Production build succeeds.

- [ ] **Step 2: Verify the running development application**

Use the existing development service at `http://localhost:3001` and verify:

1. Admin login succeeds and redirects to the configured target/home.
2. Refreshing the browser restores persisted Token and reloads user/permission state.
3. User menu logout clears the session and returns to login.
4. Viewer login shows the permission-filtered menu.
5. Navigating to an unauthorized route reaches 403.
6. Browser console has no new errors from this refactor.

- [ ] **Step 3: Verify production preview Fake behavior**

Start production preview on a free port without stopping the unrelated process occupying port 3000. Confirm login, dashboard data, permission menu, and logout work against the bundled Fake Server, then stop only the preview process started for this task.

- [ ] **Step 4: Review the final dependency graph and diff**

Run:

```bash
git status --short
git diff HEAD~4 --check
git diff HEAD~4 --stat
```

Confirm:

- No uncommitted generated files remain except intentional fresh verification output already committed.
- No backend URL, proxy, ignore rule, or unrelated UI change was introduced.
- The design spec's completion criteria all map to fresh evidence.

- [ ] **Step 5: Commit verification-only corrections if needed**

If verification required a production-code correction, stage only the relevant files and use:

```bash
git commit -m "fix: complete session dependency cleanup"
```

Do not create an empty verification commit.
