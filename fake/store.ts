import type { UserInfoType } from "#src/api/auth";
import type { PermissionItem, RoleCreateReq, RoleItemType, RoleListReq, RoleUpdateReq } from "#src/api/system/role/types";
import type { UserCreateReq, UserItemType, UserListReq, UserUpdateReq } from "#src/api/system/user/types";

interface DemoAccount {
	password: string
	permissions: string[]
	refreshToken: string
	token: string
	user: UserInfoType
}

interface FakeState {
	rolePermissions: Record<number, number[]>
	roles: RoleItemType[]
	userRoles: Record<number, number[]>
	users: UserItemType[]
}

const now = "2026-08-24 09:00:00";

export const permissions: PermissionItem[] = [
	{ id: 1, code: "dashboard:view", name: "查看工作台", type: 1, module: "dashboard", status: 1, remark: "", created_at: now },
	{ id: 2, code: "audit:view", name: "查看审计日志", type: 1, module: "audit", status: 1, remark: "", created_at: now },
	{ id: 10, code: "system:user:view", name: "查看用户", type: 1, module: "system:user", status: 1, remark: "", created_at: now },
	{ id: 11, code: "system:user:add", name: "新增用户", type: 2, module: "system:user", status: 1, remark: "", created_at: now },
	{ id: 12, code: "system:user:edit", name: "编辑用户", type: 2, module: "system:user", status: 1, remark: "", created_at: now },
	{ id: 13, code: "system:user:delete", name: "删除用户", type: 2, module: "system:user", status: 1, remark: "", created_at: now },
	{ id: 14, code: "system:user:assign-role", name: "分配角色", type: 2, module: "system:user", status: 1, remark: "", created_at: now },
	{ id: 15, code: "system:user:reset-password", name: "重置密码", type: 2, module: "system:user", status: 1, remark: "", created_at: now },
	{ id: 20, code: "system:role:view", name: "查看角色", type: 1, module: "system:role", status: 1, remark: "", created_at: now },
	{ id: 21, code: "system:role:add", name: "新增角色", type: 2, module: "system:role", status: 1, remark: "", created_at: now },
	{ id: 22, code: "system:role:edit", name: "编辑角色", type: 2, module: "system:role", status: 1, remark: "", created_at: now },
	{ id: 23, code: "system:role:delete", name: "删除角色", type: 2, module: "system:role", status: 1, remark: "", created_at: now },
	{ id: 30, code: "system:permission:view", name: "查看权限", type: 1, module: "system:permission", status: 1, remark: "", created_at: now },
];

const adminPermissions = permissions.map(item => item.code);
const viewerPermissions = [
	"dashboard:view",
	"audit:view",
	"system:user:view",
	"system:role:view",
	"system:permission:view",
];

const accounts: Record<string, DemoAccount> = {
	admin: {
		password: "admin123",
		permissions: adminPermissions,
		refreshToken: "fake-admin-refresh-token",
		token: "fake-admin-token",
		user: {
			id: 1,
			uuid: "fake-user-admin",
			avatar: "",
			username: "admin",
			nickname: "产品管理员",
			email: "admin@example.local",
			roles: ["administrator"],
		},
	},
	viewer: {
		password: "viewer123",
		permissions: viewerPermissions,
		refreshToken: "fake-viewer-refresh-token",
		token: "fake-viewer-token",
		user: {
			id: 2,
			uuid: "fake-user-viewer",
			avatar: "",
			username: "viewer",
			nickname: "只读体验者",
			email: "viewer@example.local",
			roles: ["viewer"],
		},
	},
};

function createInitialState(): FakeState {
	return {
		users: [
			{ id: 1, uuid: "fake-user-admin", username: "admin", status: 1, created_at: now },
			{ id: 2, uuid: "fake-user-viewer", username: "viewer", status: 1, created_at: now },
		],
		roles: [
			{ id: 1, name: "产品管理员", is_system: true, status: 1, user_count: 1, remark: "拥有全部 UI 权限", created_at: now },
			{ id: 2, name: "只读用户", is_system: true, status: 1, user_count: 1, remark: "仅查看页面", created_at: now },
		],
		userRoles: { 1: [1], 2: [2] },
		rolePermissions: {
			1: permissions.map(item => item.id),
			2: permissions.filter(item => viewerPermissions.includes(item.code)).map(item => item.id),
		},
	};
}

let state = createInitialState();

export function resetFakeStore() {
	state = createInitialState();
}

export function authenticate(username: string, password: string) {
	const account = accounts[username];
	return account && account.password === password ? account : null;
}

export function getAccountByToken(token?: string) {
	return Object.values(accounts).find(account => account.token === token) ?? accounts.admin;
}

export function refreshSession(refreshToken: string) {
	return Object.values(accounts).find(account => account.refreshToken === refreshToken) ?? null;
}

export function listUsers(params: UserListReq) {
	const filtered = state.users.filter(item =>
		(!params.username || item.username.includes(params.username))
		&& (!params.status || item.status === params.status),
	);
	const page = params.page || 1;
	const pageSize = params.page_size || 10;
	return {
		items: filtered.slice((page - 1) * pageSize, page * pageSize),
		total: filtered.length,
		page,
		page_size: pageSize,
	};
}

export function createUser(data: UserCreateReq) {
	const id = Math.max(0, ...state.users.map(item => item.id)) + 1;
	const user: UserItemType = {
		id,
		uuid: `fake-user-${id}`,
		username: data.username,
		status: 1,
		created_at: new Date().toISOString(),
	};
	state.users.unshift(user);
	state.userRoles[id] = [];
	return user;
}

export function getUser(id: number) {
	return state.users.find(item => item.id === id);
}

export function updateUser(data: UserUpdateReq) {
	state.users = state.users.map(item => item.id === data.id ? { ...item, username: data.username, status: data.status } : item);
}

export function deleteUser(id: number) {
	state.users = state.users.filter(item => item.id !== id);
	delete state.userRoles[id];
}

export function getUserRoles(userId: number) {
	return state.userRoles[userId] ?? [];
}

export function bindUserRoles(userId: number, roleIds: number[]) {
	state.userRoles[userId] = [...roleIds];
}

export function listRoles(params: RoleListReq) {
	const filtered = state.roles.filter(item =>
		(!params.name || item.name.includes(params.name))
		&& (!params.status || item.status === params.status),
	).map(item => ({
		...item,
		user_count: Object.values(state.userRoles).filter(roleIds => roleIds.includes(item.id)).length,
	}));
	const page = params.page || 1;
	const pageSize = params.page_size || 10;
	return {
		items: filtered.slice((page - 1) * pageSize, page * pageSize),
		total: filtered.length,
	};
}

export function createRole(data: RoleCreateReq) {
	const id = Math.max(0, ...state.roles.map(item => item.id)) + 1;
	const role: RoleItemType = {
		id,
		name: data.name,
		is_system: false,
		status: 1,
		user_count: 0,
		remark: data.remark ?? "",
		created_at: new Date().toISOString(),
	};
	state.roles.unshift(role);
	state.rolePermissions[id] = [];
	return role;
}

export function updateRole(data: RoleUpdateReq) {
	state.roles = state.roles.map(item => item.id === data.id ? { ...item, ...data } : item);
}

export function deleteRole(id: number) {
	state.roles = state.roles.filter(item => item.id !== id || item.is_system);
	delete state.rolePermissions[id];
}

export function getRolePermissions(roleId: number) {
	return state.rolePermissions[roleId] ?? [];
}

export function bindRolePermissions(roleId: number, permissionIds: number[]) {
	state.rolePermissions[roleId] = [...permissionIds];
}
