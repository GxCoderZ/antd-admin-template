import type { PlatformPermission } from "../types";

export interface PlatformRole {
	id: string;
	roleKey: string;
	displayName: string;
	memberCount?: number;
	permissions: PlatformPermission[];
	version?: number;
}

export interface CreatePlatformRoleInput {
	displayName: string;
	roleKey: string;
}

export interface ListPlatformRolesInput {
	order?: "asc" | "desc";
	page: number;
	pageSize: number;
	q?: string;
	sort?: "display_name" | "member_count" | "role_key";
}

export interface UpdatePlatformRoleInput {
	displayName: string;
	expectedVersion?: number;
}
