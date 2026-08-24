import { defineFakeRoute } from "vite-plugin-fake-server/client";

import {
	bindRolePermissions,
	bindUserRoles,
	createRole,
	createUser,
	deleteRole,
	deleteUser,
	getRolePermissions,
	getUser,
	getUserRoles,
	listRoles,
	listUsers,
	permissions,
	updateRole,
	updateUser,
} from "./store";
import { resultError, resultSuccess } from "./utils";

function permissionGroups() {
	const groups = new Map<string, typeof permissions>();
	for (const permission of permissions) {
		const current = groups.get(permission.module) ?? [];
		current.push(permission);
		groups.set(permission.module, current);
	}
	return Array.from(groups, ([module, items]) => ({ module, permissions: items, children: null }));
}

export default defineFakeRoute([
	{
		url: "/system/users/list",
		method: "post",
		response: ({ body }) => resultSuccess(listUsers(body as any)),
	},
	{
		url: "/system/users/create",
		method: "post",
		response: ({ body }) => resultSuccess(createUser(body as any)),
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
			updateUser(body as any);
			return resultSuccess({});
		},
	},
	{
		url: "/system/users/delete",
		method: "post",
		response: ({ body }) => {
			deleteUser(Number(body.id));
			return resultSuccess({});
		},
	},
	{
		url: "/system/users/reset-password",
		method: "post",
		response: () => resultSuccess({}),
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
			bindUserRoles(Number(body.user_id), body.role_ids ?? []);
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
			const role = createRole(body as any);
			return resultSuccess({ id: role.id });
		},
	},
	{
		url: "/system/roles/update",
		method: "post",
		response: ({ body }) => {
			updateRole(body as any);
			return resultSuccess({});
		},
	},
	{
		url: "/system/roles/delete",
		method: "post",
		response: ({ body }) => {
			deleteRole(Number(body.id));
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
			bindRolePermissions(Number(body.role_id), body.permission_ids ?? []);
			return resultSuccess({});
		},
	},
	{
		url: "/system/permissions/list",
		method: "post",
		response: ({ body }) => {
			const items = permissions.filter(item =>
				(!body.module || item.module === body.module)
				&& (!body.status || item.status === body.status),
			);
			return resultSuccess({ items, tree: permissionGroups() });
		},
	},
]);
