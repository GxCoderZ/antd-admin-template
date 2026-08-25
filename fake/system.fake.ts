import type { RoleCreateReq, RoleUpdateReq } from "#src/api/system/role";

import type { UserCreateReq, UserListReq, UserUpdateReq } from "#src/api/system/user";
import { defineFakeRoute } from "vite-plugin-fake-server/client";

import {
	bindRolePermissions,
	bindUserRoles,
	createRole,
	createUser,
	deleteRole,
	deleteUser,
	forceLogoutUser,
	getAccountByToken,
	getRole,
	getRolePermissions,
	getUser,
	getUserRoles,
	isRoleIdentityTaken,
	isUserIdentityTaken,
	listRoles,
	listUsers,
	permissions,
	resetUserPassword,
	updateRole,
	updateUser,
} from "./store";
import { resultError, resultSuccess } from "./utils";

function getBearerToken(headers: Record<string, string | string[] | undefined>) {
	const authorization = headers.authorization;
	const value = Array.isArray(authorization) ? authorization[0] : authorization;
	return value?.replace(/^Bearer\s+/i, "");
}

function permissionGroups() {
	const groups = new Map<string, typeof permissions>();
	for (const permission of permissions) {
		const current = groups.get(permission.module) ?? [];
		current.push(permission);
		groups.set(permission.module, current);
	}
	return Array.from(groups, ([module, items]) => ({ module, permissions: items, children: null }));
}

function isValidEmail(value: string) {
	const atIndex = value.indexOf("@");
	const dotIndex = value.lastIndexOf(".");
	return atIndex > 0 && dotIndex > atIndex + 1 && dotIndex < value.length - 1 && !value.includes(" ");
}

export default defineFakeRoute([
	{
		url: "/system/users/list",
		method: "post",
		response: ({ body }) => resultSuccess(listUsers(body as UserListReq)),
	},
	{
		url: "/system/users/create",
		method: "post",
		response: ({ body }) => {
			const data = body as UserCreateReq;
			const email = data.email?.trim() || `${data.username}@example.local`;
			if (!data.username?.trim() || !data.password || data.password.length < 8)
				return resultError("请填写用户名和至少 8 位密码");
			if (!isValidEmail(email))
				return resultError("邮箱格式不正确");
			if (isUserIdentityTaken(data.username.trim(), email))
				return resultError("用户名或邮箱已存在", 409);
			return resultSuccess(createUser({ ...data, username: data.username.trim(), email }));
		},
	},
	{
		url: "/system/users/detail",
		method: "post",
		response: ({ body }) => {
			const user = getUser(Number(body.id));
			return user ? resultSuccess(user) : resultError("用户不存在", 404);
		},
	},
	{
		url: "/system/users/update",
		method: "post",
		response: ({ body }) => {
			const data = body as UserUpdateReq;
			const user = getUser(Number(data.id));
			if (!user)
				return resultError("用户不存在", 404);
			const username = data.username?.trim() || user.username;
			const email = data.email?.trim() || user.email;
			if (!isValidEmail(email))
				return resultError("邮箱格式不正确");
			if (isUserIdentityTaken(username, email, user.id))
				return resultError("用户名或邮箱已存在", 409);
			return resultSuccess(updateUser({ ...data, username, email }));
		},
	},
	{
		url: "/system/users/delete",
		method: "post",
		response: ({ body, headers }) => {
			const id = Number(body.id);
			if (getAccountByToken(getBearerToken(headers)).user.id === id)
				return resultError("不能删除当前登录用户", 403);
			return deleteUser(id) ? resultSuccess({}) : resultError("用户不存在", 404);
		},
	},
	{
		url: "/system/users/reset-password",
		method: "post",
		response: ({ body }) => {
			const result = resetUserPassword(Number(body.id), body.new_password);
			return result ? resultSuccess(result) : resultError("用户不存在", 404);
		},
	},
	{
		url: "/system/users/force-logout",
		method: "post",
		response: ({ body, headers }) => {
			const id = Number(body.id);
			if (!getUser(id))
				return resultError("用户不存在", 404);
			if (getAccountByToken(getBearerToken(headers)).user.id === id)
				return resultError("不能强制下线当前登录用户", 403);
			return resultSuccess(forceLogoutUser(id));
		},
	},
	{
		url: "/system/user-roles/get",
		method: "post",
		response: ({ body }) => resultSuccess({ role_ids: getUserRoles(Number(body.user_id)) }),
	},
	{
		url: "/system/user-roles/bind",
		method: "post",
		response: ({ body }) => {
			const userId = Number(body.user_id);
			if (!getUser(userId))
				return resultError("用户不存在", 404);
			const roleIds = (body.role_ids ?? []).map(Number);
			if (roleIds.some((id: number) => !getRole(id)))
				return resultError("包含不存在的角色", 404);
			bindUserRoles(userId, roleIds);
			return resultSuccess({});
		},
	},
	{
		url: "/system/roles/list",
		method: "post",
		response: ({ body }) => resultSuccess(listRoles(body as any)),
	},
	{
		url: "/system/roles/create",
		method: "post",
		response: ({ body }) => {
			const data = body as RoleCreateReq;
			const name = data.name?.trim();
			const key = data.key?.trim() || `role-${Date.now()}`;
			if (!name)
				return resultError("请输入角色名称");
			if (isRoleIdentityTaken(name, key))
				return resultError("角色名称或标识已存在", 409);
			const role = createRole({ ...data, name, key });
			return resultSuccess({ id: role.id });
		},
	},
	{
		url: "/system/roles/update",
		method: "post",
		response: ({ body }) => {
			const data = body as RoleUpdateReq;
			const role = getRole(Number(data.id));
			if (!role)
				return resultError("角色不存在", 404);
			const name = data.name?.trim() || role.name;
			const key = data.key?.trim() || role.key;
			if (isRoleIdentityTaken(name, key, role.id))
				return resultError("角色名称或标识已存在", 409);
			return resultSuccess(updateRole({ ...data, name, key }));
		},
	},
	{
		url: "/system/roles/delete",
		method: "post",
		response: ({ body }) => {
			const role = getRole(Number(body.id));
			if (!role)
				return resultError("角色不存在", 404);
			if (role.is_system)
				return resultError("内置角色不可删除", 403);
			deleteRole(role.id);
			return resultSuccess({});
		},
	},
	{
		url: "/system/roles/permissions/get",
		method: "post",
		response: ({ body }) => resultSuccess({ permission_ids: getRolePermissions(Number(body.role_id)) }),
	},
	{
		url: "/system/roles/permissions/bind",
		method: "post",
		response: ({ body }) => {
			const roleId = Number(body.role_id);
			if (!getRole(roleId))
				return resultError("角色不存在", 404);
			const permissionIds = (body.permission_ids ?? []).map(Number);
			if (permissionIds.some((id: number) => !permissions.some(item => item.id === id)))
				return resultError("包含不存在的权限", 404);
			bindRolePermissions(roleId, permissionIds);
			return resultSuccess({});
		},
	},
	{
		url: "/system/permissions/list",
		method: "post",
		response: ({ body }) => {
			const items = permissions.filter(item => (!body.module || item.module === body.module) && (!body.status || item.status === body.status));
			return resultSuccess({ items, tree: permissionGroups() });
		},
	},
]);
