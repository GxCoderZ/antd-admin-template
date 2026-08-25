import { beforeEach, describe, expect, it } from "vitest";

const storeModules = import.meta.glob("../fake/store.ts", { eager: true });
const fakeModules = import.meta.glob("../fake/{account,system}.fake.ts", { eager: true });
const store = storeModules["../fake/store.ts"] as any;

function getRoutes(modulePath: string) {
	return (fakeModules[modulePath] as { default?: any[] })?.default ?? [];
}

function callRoute(routes: any[], url: string, body: Record<string, unknown> = {}, token = "fake-admin-token") {
	const route = routes.find(item => item.url === url);
	expect(route).toBeDefined();
	return route.response({
		url,
		rawBody: JSON.stringify(body),
		body,
		query: {},
		params: {},
		headers: { authorization: `Bearer ${token}` },
	});
}

describe("admin experience Fake state", () => {
	beforeEach(() => {
		store.resetFakeStore();
	});

	it("creates, edits, filters, and sorts users", () => {
		const user = store.createUser({
			username: "zeta",
			password: "password123",
			display_name: "Zeta 运营",
			email: "zeta@example.local",
		});
		store.updateUser({ id: user.id, display_name: "Alpha 运营", status: 2 });

		const filtered = store.listUsers({ page: 1, page_size: 10, keyword: "alpha", status: 2 });
		expect(filtered.items).toHaveLength(1);
		expect(filtered.items[0]).toMatchObject({ id: user.id, display_name: "Alpha 运营", status: 2 });

		const sorted = store.listUsers({ page: 1, page_size: 20, sort: "username", order: "ascend" });
		expect(sorted.items.map((item: any) => item.username)).toEqual(
			[...sorted.items].map((item: any) => item.username).sort((left: string, right: string) => left.localeCompare(right, "zh-CN")),
		);
	});

	it("keeps role membership counts in sync", () => {
		const role = store.createRole({ name: "发布运营", key: "release-operator" });
		const user = store.createUser({ username: "release", password: "password123" });
		store.bindUserRoles(user.id, [role.id]);

		const storedRole = store.listRoles({ page: 1, page_size: 20 }).items.find((item: any) => item.id === role.id);
		expect(storedRole).toMatchObject({ key: "release-operator", user_count: 1 });
	});

	it("returns reset-password and force-logout results", () => {
		expect(store.resetUserPassword(2, "Viewer@2026")).toEqual({ temporary_password: "Viewer@2026" });
		expect(store.authenticate("viewer", "Viewer@2026")).toBeTruthy();
		expect(store.forceLogoutUser(2)).toEqual({ revoked_sessions: 2 });
		expect(store.listAccountSessions(2)).toEqual([]);
	});

	it("updates avatars and revokes owned sessions", () => {
		const avatar = "data:image/png;base64,ZmFrZQ==";
		expect(store.updateAccountAvatar(1, avatar)).toBe(avatar);
		expect(store.getAccountProfile(1).avatar).toBe(avatar);
		expect(store.deleteAccountAvatar(1)).toBe(true);
		expect(store.getAccountProfile(1).avatar).toBe("");

		expect(store.revokeAccountSession(1, "session-admin-mac")).toEqual({ revoked_sessions: 1 });
		expect(store.revokeAccountSession(1, "session-admin-current")).toBeUndefined();
		expect(store.revokeOtherAccountSessions(1)).toEqual({ revoked_sessions: 1 });
		expect(store.listAccountSessions(1)).toHaveLength(1);
	});

	it("updates platform settings and records audit and login activity", () => {
		store.updatePlatformSettings("运营控制台");
		store.authenticate("missing", "wrong-password");

		expect(store.getPlatformSettings()).toMatchObject({ site_title: "运营控制台" });
		expect(store.listAuditLogs({ page: 1, page_size: 1, module: "平台设置" })).toMatchObject({ total: 1 });
		expect(store.listLoginLogs({ page: 1, page_size: 1, result: "failed", keyword: "missing" })).toMatchObject({ total: 1 });
	});

	it("preserves administrator and viewer permission boundaries", () => {
		const administrator = store.authenticate("admin", "admin123");
		const viewer = store.authenticate("viewer", "viewer123");

		expect(administrator.permissions).toContain("system:user:force-logout");
		expect(administrator.permissions).toContain("system:settings:edit");
		expect(viewer.permissions).toContain("login-log:view");
		expect(viewer.permissions).not.toContain("system:settings:edit");
	});
});

describe("admin experience Fake HTTP validation", () => {
	beforeEach(() => {
		store.resetFakeStore();
	});

	it("rejects duplicate users and protected current-user actions", () => {
		const routes = getRoutes("../fake/system.fake.ts");
		const duplicate = callRoute(routes, "/system/users/create", { username: "admin", password: "password1234", email: "other@example.local" });
		const forceCurrent = callRoute(routes, "/system/users/force-logout", { id: 1 });

		expect(duplicate.code).toBe(409);
		expect(forceCurrent.code).toBe(403);
	});

	it("rejects invalid avatars and current-session revocation", () => {
		const routes = getRoutes("../fake/account.fake.ts");
		const invalidAvatar = callRoute(routes, "/account/avatar/update", { avatar_data: "data:text/plain;base64,ZmFrZQ==", mime_type: "text/plain", size: 4 });
		const currentSession = callRoute(routes, "/account/sessions/revoke", { session_id: "session-admin-current" });

		expect(invalidAvatar.code).not.toBe(0);
		expect(currentSession.code).toBe(403);
	});
});
