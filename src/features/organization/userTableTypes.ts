import type { ListPlatformUsersInput, PlatformUser } from "#src/api/users";

export interface UserFilterValues {
	q?: string;
	status: "all" | PlatformUser["status"];
}

export interface UserTableState {
	order: ListPlatformUsersInput["order"];
	page: number;
	pageSize: number;
	sort: ListPlatformUsersInput["sort"];
}

export const defaultUserFilterValues: UserFilterValues = { status: "all" };
export type UserColumnKey =
	| "actions"
	| "authSource"
	| "createdAt"
	| "department"
	| "displayName"
	| "email"
	| "jobTitle"
	| "lastLoginAt"
	| "lastLoginIp"
	| "mfaEnabled"
	| "mustChangePassword"
	| "phone"
	| "roles"
	| "status"
	| "updatedAt"
	| "username";
export const userColumnWidthMultipliers: Record<UserColumnKey, number> = {
	actions: 4,
	authSource: 3,
	createdAt: 5,
	department: 4,
	displayName: 5,
	email: 7,
	jobTitle: 4,
	lastLoginAt: 5,
	lastLoginIp: 4,
	mfaEnabled: 3,
	mustChangePassword: 3,
	phone: 4,
	roles: 6,
	status: 3,
	updatedAt: 5,
	username: 4,
};

export const userTableSortToContractSort: Record<
	string,
	NonNullable<ListPlatformUsersInput["sort"]>
> = {
	authSource: "auth_source",
	createdAt: "created_at",
	department: "department",
	displayName: "display_name",
	email: "email",
	lastLoginAt: "last_login_at",
	phone: "phone",
	status: "status",
	updatedAt: "updated_at",
	username: "username",
};
