import { request, type ApiPage } from "../client";
import type { PlatformPermission } from "../types";
import type {
	CreatePlatformRoleInput,
	ListPlatformRolesInput,
	PlatformRole,
	UpdatePlatformRoleInput,
} from "./types";

export * from "./types";

export const platformRolesQueryKey = ["platform-roles"] as const;

export async function listPlatformRoles(signal?: AbortSignal) {
	const response = await request<ApiPage<PlatformRole>>("/platform/roles", {
		query: { page: 1, page_size: 1000 },
		signal,
	});
	return response.items;
}

export function listPlatformRolePage(
	input: ListPlatformRolesInput,
	signal?: AbortSignal,
) {
	const { pageSize, ...query } = input;
	return request<ApiPage<PlatformRole>>("/platform/roles", {
		query: { ...query, page_size: pageSize },
		signal,
	}).then(({ items, page, page_size, total }) => ({
		items,
		page,
		pageSize: page_size,
		total,
	}));
}

export function createPlatformRole(input: CreatePlatformRoleInput) {
	return request<PlatformRole>("/platform/roles", {
		method: "POST",
		body: input,
	});
}

export function updatePlatformRole({
	input,
	roleId,
}: {
	input: UpdatePlatformRoleInput;
	roleId: string;
}) {
	return request<PlatformRole>(`/platform/roles/${roleId}`, {
		method: "PATCH",
		body: input,
	});
}

export function deletePlatformRole(roleId: string) {
	return request<void>(`/platform/roles/${roleId}`, { method: "DELETE" });
}

export function setPlatformRolePermission({
	granted,
	permission,
	roleId,
}: {
	granted: boolean;
	permission: PlatformPermission;
	roleId: string;
}) {
	return request<void>(`/platform/roles/${roleId}/permissions/${permission}`, {
		method: granted ? "PUT" : "DELETE",
	});
}

export function setPlatformUserRole({
	assigned,
	roleId,
	userId,
}: {
	assigned: boolean;
	roleId: string;
	userId: string;
}) {
	return request<void>(`/platform/users/${userId}/roles/${roleId}`, {
		method: assigned ? "PUT" : "DELETE",
	});
}
