import { request } from "../client";
import type { PlatformPermission } from "../types";
import type {
	CreatePlatformRoleInput,
	PlatformRole,
	UpdatePlatformRoleInput,
} from "./types";

export * from "./types";

export const platformRolesQueryKey = ["platform-roles"] as const;

export async function listPlatformRoles(signal?: AbortSignal) {
	const response = await request<{ items: PlatformRole[] }>("/platform/roles", {
		signal,
	});
	return response.items;
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
