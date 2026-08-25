import type { PlatformUserRole } from "../types";

type PlatformUserStatus = "active" | "disabled" | "locked";

export interface PlatformUser {
	id: string;
	username: string;
	email: string;
	displayName: string;
	status: PlatformUserStatus;
	createdAt: string;
	updatedAt: string;
	mustChangePassword?: boolean;
	version?: number;
}

export interface PlatformUserDetail extends PlatformUser {
	roles: PlatformUserRole[];
}

export interface ListPlatformUsersInput {
	page: number;
	pageSize: number;
	sort?: "username" | "email" | "status" | "created_at";
	order?: "asc" | "desc";
	q?: string;
	status?: PlatformUserStatus;
}

export interface CreatePlatformUserInput {
	displayName: string;
	email: string;
	password: string;
	username: string;
}

export interface UpdatePlatformUserInput {
	displayName: string;
	expectedVersion?: number;
	status: "active" | "disabled";
}

export interface ResetPlatformUserPasswordInput {
	password: string;
}

export interface ResetPlatformUserPasswordResult {
	mustChangePassword: boolean;
}
