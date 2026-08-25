import type { AccountProfileType, AccountSessionType } from "#src/api/account";
import type { AuditItemType, AuditListReq } from "#src/api/audit";
import type { UserInfoType } from "#src/api/auth";
import type { LoginLogItemType, LoginLogListReq } from "#src/api/login-log";
import type { PermissionItem, RoleCreateReq, RoleItemType, RoleListReq, RoleUpdateReq } from "#src/api/system/role/types";
import type { PlatformSettingsType } from "#src/api/system/settings";
import type { UserCreateReq, UserItemType, UserListReq, UserUpdateReq } from "#src/api/system/user/types";

interface DemoAccount {
	password: string
	permissions: string[]
	refreshToken: string
	token: string
	user: UserInfoType
}

interface FakeState {
	accounts: Record<string, DemoAccount>
	accountSessions: Record<number, AccountSessionType[]>
	auditLogs: AuditItemType[]
	loginLogs: LoginLogItemType[]
	rolePermissions: Record<number, number[]>
	roles: RoleItemType[]
	settings: PlatformSettingsType
	userRoles: Record<number, number[]>
	users: UserItemType[]
}

const initialTime = "2026-08-24 09:00:00";

export const permissions: PermissionItem[] = [
	{ id: 1, code: "dashboard:view", name: "查看工作台", type: 1, module: "dashboard", status: 1, remark: "", created_at: initialTime },
	{ id: 2, code: "audit:view", name: "查看审计日志", type: 1, module: "audit", status: 1, remark: "", created_at: initialTime },
	{ id: 3, code: "login-log:view", name: "查看登录日志", type: 1, module: "login-log", status: 1, remark: "", created_at: initialTime },
	{ id: 10, code: "system:user:view", name: "查看用户", type: 1, module: "system:user", status: 1, remark: "", created_at: initialTime },
	{ id: 11, code: "system:user:add", name: "新增用户", type: 2, module: "system:user", status: 1, remark: "", created_at: initialTime },
	{ id: 12, code: "system:user:edit", name: "编辑用户", type: 2, module: "system:user", status: 1, remark: "", created_at: initialTime },
	{ id: 13, code: "system:user:delete", name: "删除用户", type: 2, module: "system:user", status: 1, remark: "", created_at: initialTime },
	{ id: 14, code: "system:user:assign-role", name: "分配角色", type: 2, module: "system:user", status: 1, remark: "", created_at: initialTime },
	{ id: 15, code: "system:user:reset-password", name: "重置密码", type: 2, module: "system:user", status: 1, remark: "", created_at: initialTime },
	{ id: 16, code: "system:user:force-logout", name: "强制下线", type: 2, module: "system:user", status: 1, remark: "", created_at: initialTime },
	{ id: 20, code: "system:role:view", name: "查看角色", type: 1, module: "system:role", status: 1, remark: "", created_at: initialTime },
	{ id: 21, code: "system:role:add", name: "新增角色", type: 2, module: "system:role", status: 1, remark: "", created_at: initialTime },
	{ id: 22, code: "system:role:edit", name: "编辑角色", type: 2, module: "system:role", status: 1, remark: "", created_at: initialTime },
	{ id: 23, code: "system:role:delete", name: "删除角色", type: 2, module: "system:role", status: 1, remark: "", created_at: initialTime },
	{ id: 24, code: "system:role:assign-permission", name: "分配权限", type: 2, module: "system:role", status: 1, remark: "", created_at: initialTime },
	{ id: 30, code: "system:permission:view", name: "查看权限", type: 1, module: "system:permission", status: 1, remark: "", created_at: initialTime },
	{ id: 40, code: "system:settings:view", name: "查看平台设置", type: 1, module: "system:settings", status: 1, remark: "", created_at: initialTime },
	{ id: 41, code: "system:settings:edit", name: "编辑平台设置", type: 2, module: "system:settings", status: 1, remark: "", created_at: initialTime },
	{ id: 50, code: "system:info:view", name: "查看系统信息", type: 1, module: "system:info", status: 1, remark: "", created_at: initialTime },
];

const adminPermissions = permissions.map(item => item.code);
const viewerPermissions = ["dashboard:view", "audit:view", "login-log:view", "system:user:view", "system:role:view", "system:permission:view", "system:settings:view", "system:info:view"];

function createInitialAccounts(): Record<string, DemoAccount> {
	return {
		admin: {
			password: "admin123",
			permissions: adminPermissions,
			refreshToken: "fake-admin-refresh-token",
			token: "fake-admin-token",
			user: { id: 1, uuid: "fake-user-admin", avatar: "", username: "admin", nickname: "产品管理员", email: "admin@example.local", roles: ["administrator"] },
		},
		viewer: {
			password: "viewer123",
			permissions: viewerPermissions,
			refreshToken: "fake-viewer-refresh-token",
			token: "fake-viewer-token",
			user: { id: 2, uuid: "fake-user-viewer", avatar: "", username: "viewer", nickname: "只读体验者", email: "viewer@example.local", roles: ["viewer"] },
		},
	};
}

function createInitialState(): FakeState {
	return {
		accounts: createInitialAccounts(),
		users: [
			{ id: 1, uuid: "fake-user-admin", username: "admin", display_name: "产品管理员", email: "admin@example.local", status: 1, created_at: "2026-05-08 09:30:00" },
			{ id: 2, uuid: "fake-user-viewer", username: "viewer", display_name: "只读体验者", email: "viewer@example.local", status: 1, created_at: "2026-06-17 14:20:00" },
			{ id: 3, uuid: "fake-user-product", username: "product", display_name: "产品运营", email: "product@example.local", status: 1, created_at: "2026-07-03 10:10:00" },
			{ id: 4, uuid: "fake-user-auditor", username: "auditor", display_name: "安全审计员", email: "auditor@example.local", status: 2, created_at: "2026-07-18 16:45:00" },
			{ id: 5, uuid: "fake-user-content", username: "content-editor", display_name: "内容编辑", email: "content@example.local", status: 1, created_at: "2026-08-01 11:25:00" },
			{ id: 6, uuid: "fake-user-former", username: "former-member", display_name: "离职成员", email: "former@example.local", status: 3, created_at: "2026-08-12 08:40:00" },
		],
		roles: [
			{ id: 1, key: "administrator", name: "产品管理员", is_system: true, status: 1, user_count: 1, permission_codes: adminPermissions, remark: "拥有全部 UI 权限", created_at: "2026-05-08 09:00:00" },
			{ id: 2, key: "viewer", name: "只读用户", is_system: true, status: 1, user_count: 1, permission_codes: viewerPermissions, remark: "仅查看页面", created_at: "2026-05-08 09:00:00" },
			{ id: 3, key: "product-operator", name: "产品运营", is_system: false, status: 1, user_count: 2, permission_codes: ["dashboard:view", "system:user:view"], remark: "管理产品日常运营", created_at: "2026-06-03 10:30:00" },
			{ id: 4, key: "security-auditor", name: "安全审计", is_system: false, status: 1, user_count: 1, permission_codes: ["dashboard:view", "audit:view", "login-log:view"], remark: "查看系统操作与登录记录", created_at: "2026-06-15 13:20:00" },
		],
		userRoles: { 1: [1], 2: [2], 3: [3], 4: [4], 5: [3], 6: [] },
		rolePermissions: {
			1: permissions.map(item => item.id),
			2: permissions.filter(item => viewerPermissions.includes(item.code)).map(item => item.id),
			3: permissions.filter(item => ["dashboard:view", "system:user:view"].includes(item.code)).map(item => item.id),
			4: permissions.filter(item => ["dashboard:view", "audit:view", "login-log:view"].includes(item.code)).map(item => item.id),
		},
		accountSessions: {
			1: [
				{ id: "session-admin-current", current: true, device: "Chrome · Windows", ip: "10.0.0.21", language: "zh-CN", time_zone: "Asia/Shanghai", created_at: "2026-08-25 08:20:00", expires_at: "2026-08-25 18:20:00" },
				{ id: "session-admin-mac", current: false, device: "Safari · macOS", ip: "10.0.0.18", language: "zh-CN", time_zone: "Asia/Shanghai", created_at: "2026-08-24 15:12:00", expires_at: "2026-08-31 15:12:00" },
				{ id: "session-admin-mobile", current: false, device: "Mobile Safari · iOS", ip: "10.0.0.44", language: "en-US", time_zone: "Asia/Shanghai", created_at: "2026-08-23 09:05:00", expires_at: "2026-08-30 09:05:00" },
			],
			2: [
				{ id: "session-viewer-current", current: true, device: "Edge · Windows", ip: "10.0.0.32", language: "zh-CN", time_zone: "Asia/Shanghai", created_at: "2026-08-25 08:10:00", expires_at: "2026-08-25 18:10:00" },
				{ id: "session-viewer-other", current: false, device: "Chrome · Android", ip: "10.0.0.35", language: "zh-CN", time_zone: "Asia/Shanghai", created_at: "2026-08-24 12:10:00", expires_at: "2026-08-31 12:10:00" },
			],
		},
		settings: { site_title: "Admin Temp", updated_at: "2026-08-24 09:00:00" },
		auditLogs: [
			{ id: 1, operator: "产品管理员", module: "用户管理", action: "新增用户", target: "design-reviewer", result: "success", ip: "10.0.0.21", created_at: "2026-08-24 14:38:00" },
			{ id: 2, operator: "产品管理员", module: "用户管理", action: "分配角色", target: "design-reviewer", result: "success", ip: "10.0.0.21", created_at: "2026-08-24 14:36:00" },
			{ id: 3, operator: "产品管理员", module: "用户管理", action: "重置密码", target: "viewer", result: "failed", ip: "10.0.0.21", created_at: "2026-08-24 13:20:00" },
			{ id: 4, operator: "产品管理员", module: "角色管理", action: "更新角色", target: "内容运营", result: "success", ip: "10.0.0.21", created_at: "2026-08-24 11:15:00" },
			{ id: 5, operator: "只读体验者", module: "权限管理", action: "查看权限", target: "系统权限", result: "success", ip: "10.0.0.32", created_at: "2026-08-24 10:08:00" },
		],
		loginLogs: [
			{ id: 1, identifier: "admin", result: "success", device: "Chrome · Windows", ip: "10.0.0.21", language: "zh-CN", time_zone: "Asia/Shanghai", created_at: "2026-08-25 08:20:00" },
			{ id: 2, identifier: "viewer", result: "success", device: "Edge · Windows", ip: "10.0.0.32", language: "zh-CN", time_zone: "Asia/Shanghai", created_at: "2026-08-25 08:10:00" },
			{ id: 3, identifier: "unknown@example.local", result: "failed", device: "Chrome · Windows", ip: "10.0.0.88", language: "en-US", time_zone: "Asia/Shanghai", created_at: "2026-08-24 22:41:00" },
			{ id: 4, identifier: "admin", result: "success", device: "Safari · macOS", ip: "10.0.0.18", language: "zh-CN", time_zone: "Asia/Shanghai", created_at: "2026-08-24 15:12:00" },
		],
	};
}

let state = createInitialState();

function timestamp() {
	return new Date().toISOString().replace("T", " ").slice(0, 19);
}

function nextId(items: Array<{ id: number }>) {
	return Math.max(0, ...items.map(item => item.id)) + 1;
}

function paginate<T>(items: T[], pageValue: number, pageSizeValue: number) {
	const page = Number(pageValue) || 1;
	const pageSize = Number(pageSizeValue) || 10;
	return { items: items.slice((page - 1) * pageSize, page * pageSize), total: items.length, page, page_size: pageSize };
}

function compareValues(left: string | number, right: string | number, order = "ascend") {
	const result = typeof left === "number" && typeof right === "number" ? left - right : String(left).localeCompare(String(right), "zh-CN");
	return order === "descend" ? -result : result;
}

function addAuditLog(module: string, action: string, target: string, result: AuditItemType["result"] = "success") {
	state.auditLogs.unshift({ id: nextId(state.auditLogs), operator: "产品管理员", module, action, target, result, ip: "10.0.0.21", created_at: timestamp() });
}

function findAccountEntryByUserId(userId: number) {
	return Object.entries(state.accounts).find(([, account]) => account.user.id === userId);
}

function syncAccountFromUser(user: UserItemType) {
	const entry = findAccountEntryByUserId(user.id);
	if (!entry)
		return;
	const [accountKey, account] = entry;
	account.user = { ...account.user, uuid: user.uuid, username: user.username, nickname: user.display_name, email: user.email };
	if (accountKey !== user.username) {
		delete state.accounts[accountKey];
		state.accounts[user.username] = account;
	}
}

export function resetFakeStore() {
	state = createInitialState();
}

export function authenticate(username: string, password: string) {
	const account = state.accounts[username];
	const result = account && account.password === password ? "success" : "failed";
	state.loginLogs.unshift({ id: nextId(state.loginLogs), identifier: username, result, device: "Chrome · Windows", ip: result === "success" ? "10.0.0.21" : "10.0.0.88", language: "zh-CN", time_zone: "Asia/Shanghai", created_at: timestamp() });
	return result === "success" ? account : null;
}

export function getAccountByToken(token?: string) {
	return Object.values(state.accounts).find(account => account.token === token) ?? state.accounts.admin ?? Object.values(state.accounts)[0];
}

export function refreshSession(refreshToken: string) {
	return Object.values(state.accounts).find(account => account.refreshToken === refreshToken) ?? null;
}

export function isUserIdentityTaken(username: string, email: string, excludeId?: number) {
	return state.users.some(item => item.id !== excludeId && (item.username === username || item.email === email));
}

export function listUsers(params: UserListReq) {
	const keyword = params.keyword?.trim().toLocaleLowerCase();
	const filtered = state.users.filter(item => (!keyword || `${item.username}${item.display_name}${item.email}`.toLocaleLowerCase().includes(keyword)) && (!params.status || item.status === params.status));
	const sort = params.sort ?? "created_at";
	const sorted = [...filtered].sort((left, right) => {
		switch (sort) {
			case "username": return compareValues(left.username, right.username, params.order);
			case "display_name": return compareValues(left.display_name, right.display_name, params.order);
			case "email": return compareValues(left.email, right.email, params.order);
			case "status": return compareValues(left.status, right.status, params.order);
			case "created_at": return compareValues(left.created_at, right.created_at, params.order ?? "descend");
			default: return 0;
		}
	});
	return paginate(sorted, params.page, params.page_size);
}

export function createUser(data: UserCreateReq) {
	const id = nextId(state.users);
	const user: UserItemType = { id, uuid: `fake-user-${id}`, username: data.username, display_name: data.display_name?.trim() || data.username, email: data.email?.trim() || `${data.username}@example.local`, status: 1, created_at: timestamp() };
	state.users.unshift(user);
	state.userRoles[id] = [...(data.role_ids ?? [])];
	state.accountSessions[id] = [];
	addAuditLog("用户管理", "新增用户", user.username);
	return user;
}

export function getUser(id: number) {
	return state.users.find(item => item.id === id);
}

export function updateUser(data: UserUpdateReq) {
	const current = getUser(data.id);
	if (!current)
		return undefined;
	const user = { ...current, ...data } as UserItemType;
	state.users = state.users.map(item => item.id === data.id ? user : item);
	syncAccountFromUser(user);
	addAuditLog("用户管理", "更新用户", user.username);
	return user;
}

export function deleteUser(id: number) {
	const user = getUser(id);
	if (!user)
		return false;
	state.users = state.users.filter(item => item.id !== id);
	delete state.userRoles[id];
	delete state.accountSessions[id];
	const accountEntry = findAccountEntryByUserId(id);
	if (accountEntry)
		delete state.accounts[accountEntry[0]];
	addAuditLog("用户管理", "删除用户", user.username);
	return true;
}

export function resetUserPassword(id: number, newPassword?: string) {
	const user = getUser(id);
	if (!user)
		return undefined;
	const temporaryPassword = newPassword || "Temp@123456";
	const accountEntry = findAccountEntryByUserId(id);
	if (accountEntry)
		accountEntry[1].password = temporaryPassword;
	addAuditLog("用户管理", "重置密码", user.username);
	return { temporary_password: temporaryPassword };
}

export function forceLogoutUser(id: number) {
	const sessions = state.accountSessions[id] ?? [];
	state.accountSessions[id] = [];
	addAuditLog("用户管理", "强制下线", getUser(id)?.username ?? String(id));
	return { revoked_sessions: sessions.length };
}

export function getUserRoles(userId: number) {
	return state.userRoles[userId] ?? [];
}

export function bindUserRoles(userId: number, roleIds: number[]) {
	state.userRoles[userId] = [...roleIds];
	addAuditLog("用户管理", "分配角色", getUser(userId)?.username ?? String(userId));
}

function enrichRole(role: RoleItemType) {
	const permissionIds = state.rolePermissions[role.id] ?? [];
	return { ...role, user_count: Object.values(state.userRoles).filter(roleIds => roleIds.includes(role.id)).length, permission_codes: permissions.filter(item => permissionIds.includes(item.id)).map(item => item.code) };
}

export function listRoles(params: RoleListReq) {
	const filtered = state.roles.filter(item => (!params.name || item.name.includes(params.name)) && (!params.status || item.status === params.status)).map(enrichRole);
	const sort = params.sort ?? "created_at";
	const sorted = [...filtered].sort((left, right) => {
		switch (sort) {
			case "name": return compareValues(left.name, right.name, params.order);
			case "status": return compareValues(left.status, right.status, params.order);
			case "user_count": return compareValues(left.user_count, right.user_count, params.order);
			case "created_at": return compareValues(left.created_at, right.created_at, params.order ?? "descend");
			default: return 0;
		}
	});
	return paginate(sorted, params.page, params.page_size);
}

export function getRole(id: number) {
	const role = state.roles.find(item => item.id === id);
	return role ? enrichRole(role) : undefined;
}

export function createRole(data: RoleCreateReq) {
	const id = nextId(state.roles);
	const role: RoleItemType = { id, key: data.key?.trim() || `role-${id}`, name: data.name, is_system: false, status: 1, user_count: 0, permission_codes: [], remark: data.remark ?? "", created_at: timestamp() };
	state.roles.unshift(role);
	state.rolePermissions[id] = [];
	addAuditLog("角色管理", "新增角色", role.name);
	return role;
}

export function updateRole(data: RoleUpdateReq) {
	const current = state.roles.find(item => item.id === data.id);
	if (!current)
		return undefined;
	const role = { ...current, ...data };
	state.roles = state.roles.map(item => item.id === data.id ? role : item);
	addAuditLog("角色管理", "更新角色", role.name);
	return enrichRole(role);
}

export function deleteRole(id: number) {
	const role = state.roles.find(item => item.id === id);
	if (!role || role.is_system)
		return false;
	state.roles = state.roles.filter(item => item.id !== id);
	delete state.rolePermissions[id];
	for (const userId of Object.keys(state.userRoles))
		state.userRoles[Number(userId)] = state.userRoles[Number(userId)].filter(roleId => roleId !== id);
	addAuditLog("角色管理", "删除角色", role.name);
	return true;
}

export function isRoleIdentityTaken(name: string, key: string, excludeId?: number) {
	return state.roles.some(item => item.id !== excludeId && (item.name === name || item.key === key));
}

export function getRolePermissions(roleId: number) {
	return state.rolePermissions[roleId] ?? [];
}

export function bindRolePermissions(roleId: number, permissionIds: number[]) {
	state.rolePermissions[roleId] = [...permissionIds];
	addAuditLog("角色管理", "分配权限", getRole(roleId)?.name ?? String(roleId));
}

export function getAccountProfile(userId = 1): AccountProfileType | undefined {
	const user = getUser(userId);
	if (!user)
		return undefined;
	const accountEntry = findAccountEntryByUserId(userId);
	return { id: user.id, username: user.username, display_name: user.display_name, email: user.email, avatar: accountEntry?.[1].user.avatar ?? "", roles: getUserRoles(userId).map(getRole).filter((role): role is RoleItemType => Boolean(role)).map(role => ({ id: role.id, name: role.name })), created_at: user.created_at };
}

export function updateAccountProfile(userId: number, displayName: string, email: string) {
	const user = updateUser({ id: userId, display_name: displayName, email });
	if (!user)
		return undefined;
	addAuditLog("个人账号", "更新资料", user.username);
	return getAccountProfile(userId);
}

export function updateAccountAvatar(userId: number, avatar: string) {
	const accountEntry = findAccountEntryByUserId(userId);
	if (!accountEntry)
		return undefined;
	accountEntry[1].user.avatar = avatar;
	addAuditLog("个人账号", "更新头像", accountEntry[1].user.username);
	return avatar;
}

export function deleteAccountAvatar(userId: number) {
	const accountEntry = findAccountEntryByUserId(userId);
	if (!accountEntry)
		return false;
	accountEntry[1].user.avatar = "";
	addAuditLog("个人账号", "删除头像", accountEntry[1].user.username);
	return true;
}

export function changeAccountPassword(userId: number, currentPassword: string, newPassword: string) {
	const accountEntry = findAccountEntryByUserId(userId);
	if (!accountEntry || accountEntry[1].password !== currentPassword)
		return false;
	accountEntry[1].password = newPassword;
	addAuditLog("个人账号", "修改密码", accountEntry[1].user.username);
	return true;
}

export function listAccountSessions(userId: number) {
	return [...(state.accountSessions[userId] ?? [])];
}

export function revokeAccountSession(userId: number, sessionId: string) {
	const sessions = state.accountSessions[userId] ?? [];
	const session = sessions.find(item => item.id === sessionId);
	if (!session || session.current)
		return undefined;
	state.accountSessions[userId] = sessions.filter(item => item.id !== sessionId);
	addAuditLog("个人账号", "撤销会话", session.device);
	return { revoked_sessions: 1 };
}

export function revokeOtherAccountSessions(userId: number) {
	const sessions = state.accountSessions[userId] ?? [];
	const revokedSessions = sessions.filter(item => !item.current).length;
	state.accountSessions[userId] = sessions.filter(item => item.current);
	addAuditLog("个人账号", "撤销其他会话", String(revokedSessions));
	return { revoked_sessions: revokedSessions };
}

export function getPlatformSettings() {
	return { ...state.settings };
}

export function updatePlatformSettings(siteTitle: string) {
	state.settings = { site_title: siteTitle, updated_at: timestamp() };
	addAuditLog("平台设置", "更新站点标题", siteTitle);
	return getPlatformSettings();
}

export function listAuditLogs(params: AuditListReq) {
	const filtered = state.auditLogs.filter(item => (!params.module || item.module === params.module) && (!params.result || item.result === params.result) && (!params.keyword || `${item.operator}${item.action}${item.target}`.toLocaleLowerCase().includes(params.keyword.toLocaleLowerCase())));
	const sort = params.sort ?? "created_at";
	const sorted = [...filtered].sort((left, right) => {
		switch (sort) {
			case "operator": return compareValues(left.operator, right.operator, params.order);
			case "module": return compareValues(left.module, right.module, params.order);
			case "action": return compareValues(left.action, right.action, params.order);
			case "result": return compareValues(left.result, right.result, params.order);
			case "created_at": return compareValues(left.created_at, right.created_at, params.order ?? "descend");
			default: return 0;
		}
	});
	return paginate(sorted, params.page, params.page_size);
}

export function listLoginLogs(params: LoginLogListReq) {
	const filtered = state.loginLogs.filter(item => (!params.result || item.result === params.result) && (!params.keyword || `${item.identifier}${item.device}${item.ip}`.toLocaleLowerCase().includes(params.keyword.toLocaleLowerCase())));
	const sort = params.sort ?? "created_at";
	const sorted = [...filtered].sort((left, right) => {
		switch (sort) {
			case "identifier": return compareValues(left.identifier, right.identifier, params.order);
			case "result": return compareValues(left.result, right.result, params.order);
			case "ip": return compareValues(left.ip, right.ip, params.order);
			case "created_at": return compareValues(left.created_at, right.created_at, params.order ?? "descend");
			default: return 0;
		}
	});
	return paginate(sorted, params.page, params.page_size);
}

export function getDashboardSummary() {
	return {
		metrics: [
			{ key: "users", title: "用户数", value: state.users.length, trend: 12.5, trendLabel: "较上周" },
			{ key: "roles", title: "角色数", value: state.roles.length, trend: 0, trendLabel: "保持稳定" },
			{ key: "permissions", title: "权限项", value: permissions.length, trend: 8.3, trendLabel: "较上周" },
			{ key: "operations", title: "今日操作", value: state.auditLogs.length, trend: -3.2, trendLabel: "较昨日" },
		],
		activities: state.auditLogs.slice(0, 5).map(item => ({ id: item.id, actor: item.operator, action: item.action, target: item.target, created_at: item.created_at })),
		updated_at: timestamp(),
	};
}
