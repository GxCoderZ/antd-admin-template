import type { PlatformUserRole } from "../types";

type PlatformUserStatus = "active" | "disabled" | "locked";
type PlatformUserAuthSource = "ldap" | "local" | "sso";

export interface PlatformUser {
	authSource: PlatformUserAuthSource;
	departmentId: string | null;
	departmentName: string | null;
	id: string;
	username: string;
	email: string;
	displayName: string;
	jobTitle: string;
	lastLoginAt: string | null;
	lastLoginIp: string | null;
	mfaEnabled: boolean;
	phone: string;
	roles: PlatformUserRole[];
	status: PlatformUserStatus;
	createdAt: string;
	updatedAt: string;
	mustChangePassword?: boolean;
	version?: number;
}

export type PlatformUserDetail = PlatformUser;

export interface ListPlatformUsersInput {
	page: number;
	pageSize: number;
	sort?:
		| "auth_source"
		| "created_at"
		| "department"
		| "display_name"
		| "email"
		| "last_login_at"
		| "phone"
		| "status"
		| "updated_at"
		| "username";
	order?: "asc" | "desc";
	q?: string;
	status?: PlatformUserStatus;
}

export interface CreatePlatformUserInput {
	departmentId?: string | null;
	displayName: string;
	email: string;
	password: string;
	username: string;
}

export interface UpdatePlatformUserInput {
	departmentId: string | null;
	displayName: string;
	email: string;
	expectedVersion?: number;
	jobTitle: string;
	phone: string;
	status: "active" | "disabled";
}

export interface ResetPlatformUserPasswordInput {
	password: string;
}

export interface ResetPlatformUserPasswordResult {
	mustChangePassword: boolean;
}
