import type { PlatformPermission } from "../types";

export type { PlatformPermission } from "../types";

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

export interface UpdatePlatformRoleInput {
	displayName: string;
	expectedVersion?: number;
}
