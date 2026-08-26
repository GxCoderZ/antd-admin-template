import type { ListPlatformUsersInput, PlatformUser } from "#src/api/users";
import type { ResponsiveTableColumnConfig } from "../../app/tableColumnVisibility";

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
	| "id"
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
	id: 5,
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

export const userColumnVisibility: readonly ResponsiveTableColumnConfig<UserColumnKey>[] =
	[
		{ key: "id", priority: "optional" },
		{ key: "username", priority: "compact", required: true },
		{ key: "displayName", priority: "compact" },
		{ key: "department", priority: "compact" },
		{ key: "jobTitle", priority: "optional" },
		{ key: "roles", priority: "regular" },
		{ key: "phone", priority: "spacious" },
		{ key: "email", priority: "spacious" },
		{ key: "status", priority: "compact", required: true },
		{ key: "authSource", priority: "optional" },
		{ key: "mfaEnabled", priority: "optional" },
		{ key: "mustChangePassword", priority: "optional" },
		{ key: "lastLoginAt", priority: "regular" },
		{ key: "lastLoginIp", priority: "optional" },
		{ key: "createdAt", priority: "spacious" },
		{ key: "updatedAt", priority: "optional" },
		{ key: "actions", priority: "compact", required: true },
	];

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
