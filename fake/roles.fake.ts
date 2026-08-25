import { defineFakeRoute } from "vite-plugin-fake-server/client";

import type {
	CreatePlatformRoleInput,
	UpdatePlatformRoleInput,
} from "../src/api/roles";
import type { PlatformPermission } from "../src/api/types";
import { allPermissions, roles } from "./store";
import { resultError, resultSuccess, routeParam } from "./utils";

function getRole(roleId: string | undefined) {
	return roles.find((role) => role.id === roleId);
}

export default defineFakeRoute([
	{
		url: "/platform/roles",
		method: "get",
		response: () => resultSuccess({ items: roles }),
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
