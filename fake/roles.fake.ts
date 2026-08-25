import { defineFakeRoute } from "vite-plugin-fake-server/client";

import type {
	CreatePlatformRoleInput,
	UpdatePlatformRoleInput,
} from "../src/api/roles";
import type { PlatformPermission } from "../src/api/types";
import { allPermissions, roles } from "./store";
import { pageValue, resultError, resultSuccess, routeParam } from "./utils";

function getRole(roleId: string | undefined) {
	return roles.find((role) => role.id === roleId);
}

export default defineFakeRoute([
	{
		url: "/platform/roles",
		method: "get",
		response: ({ query }) => {
			const page = pageValue(query.page, 1);
			const pageSize = pageValue(query.page_size, 20);
			const keyword = String(query.q ?? "")
				.trim()
				.toLowerCase();
			const sort = routeParam(query.sort) ?? "role_key";
			const order = routeParam(query.order) ?? "asc";
			const filtered = roles.filter(
				(role) =>
					!keyword ||
					role.displayName.toLowerCase().includes(keyword) ||
					role.roleKey.toLowerCase().includes(keyword),
			);
			const sorted = [...filtered].sort((left, right) => {
				const comparison =
					sort === "member_count"
						? (left.memberCount ?? 0) - (right.memberCount ?? 0)
						: sort === "display_name"
							? left.displayName.localeCompare(right.displayName)
							: left.roleKey.localeCompare(right.roleKey);

				return comparison * (order === "asc" ? 1 : -1);
			});
			const start = (page - 1) * pageSize;

			return resultSuccess({
				items: sorted.slice(start, start + pageSize),
				page,
				page_size: pageSize,
				total: sorted.length,
			});
		},
	},
	{
		url: "/platform/roles",
		method: "post",
		response: ({ body }) => {
			const input = body as unknown as CreatePlatformRoleInput;
			if (roles.some((role) => role.roleKey === input.roleKey)) {
				return resultError("Role key already exists", 409);
			}
			const timestamp = new Date().toISOString();
			const role = {
				builtIn: false,
				createdAt: timestamp,
				id: `role-${Date.now()}`,
				roleKey: input.roleKey,
				displayName: input.displayName,
				memberCount: 0,
				permissions: [] as PlatformPermission[],
				updatedAt: timestamp,
				version: 1,
			};
			roles.push(role);
			return resultSuccess(role);
		},
	},
	{
		url: "/platform/roles/:roleId",
		method: "patch",
		response: ({ body, params }) => {
			const role = getRole(routeParam(params.roleId));
			if (!role) return resultError("Role not found", 404);
			const input = body as unknown as UpdatePlatformRoleInput;
			role.displayName = input.displayName;
			role.updatedAt = new Date().toISOString();
			role.version = (role.version ?? 0) + 1;
			return resultSuccess(role);
		},
	},
	{
		url: "/platform/roles/:roleId",
		method: "delete",
		response: ({ params }) => {
			const index = roles.findIndex(
				(role) => role.id === routeParam(params.roleId),
			);
			if (index < 0) return resultError("Role not found", 404);
			if (roles[index]?.builtIn) {
				return resultError("Built-in roles cannot be deleted", 409);
			}
			if ((roles[index]?.memberCount ?? 0) > 0) {
				return resultError("Remove all members before deleting this role", 409);
			}
			roles.splice(index, 1);
			return resultSuccess(null);
		},
	},
	{
		url: "/platform/roles/:roleId/permissions/:permission",
		method: "put",
		response: ({ params }) => {
			const role = getRole(routeParam(params.roleId));
			const permission = routeParam(params.permission) as PlatformPermission;
			if (!role || !allPermissions.includes(permission)) {
				return resultError("Role or permission not found", 404);
			}
			if (!role.permissions.includes(permission)) {
				role.permissions.push(permission);
				role.updatedAt = new Date().toISOString();
				role.version = (role.version ?? 0) + 1;
			}
			return resultSuccess(null);
		},
	},
	{
		url: "/platform/roles/:roleId/permissions/:permission",
		method: "delete",
		response: ({ params }) => {
			const role = getRole(routeParam(params.roleId));
			const permission = routeParam(params.permission) as PlatformPermission;
			if (!role) return resultError("Role not found", 404);
			const nextPermissions = role.permissions.filter(
				(item) => item !== permission,
			);
			if (nextPermissions.length !== role.permissions.length) {
				role.permissions = nextPermissions;
				role.updatedAt = new Date().toISOString();
				role.version = (role.version ?? 0) + 1;
			}
			return resultSuccess(null);
		},
	},
]);
