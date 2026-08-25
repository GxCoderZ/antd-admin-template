import type { PlatformPermission } from "../types";

export interface PlatformRole {
	builtIn: boolean;
	createdAt: string;
	id: string;
	roleKey: string;
	displayName: string;
	memberCount?: number;
	permissions: PlatformPermission[];
	updatedAt: string;
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
