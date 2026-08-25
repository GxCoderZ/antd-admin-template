import type { ComponentType } from "react";

import { platformPermissions, type PlatformPermission } from "./permissions";

export const dashboardPath = "/dashboard";

export type AdminRouteGroupKey =
	"dashboard" | "operations" | "system" | "account";

export type AdminRouteIconKey =
	| "dashboard"
	| "users"
	| "roles"
	| "auditLogs"
	| "loginLogs"
	| "settings"
	| "about";

export type AdminGroupIconKey = "operations" | "system";

interface LazyAdminRouteModule {
	Component: ComponentType;
}

export interface AdminRouteMetadata {
	aliases?: readonly string[];
	groupKey: AdminRouteGroupKey;
	iconKey?: AdminRouteIconKey;
	key: string;
	lazy: () => Promise<LazyAdminRouteModule>;
	requiredPermission?: PlatformPermission;
	sectionKey: string;
	titleKey: string;
}

export interface AdminNavigationNode {
	children?: readonly AdminNavigationNode[];
	key?: string;
	routeKey?: string;
	titleKey?: string;
}

export interface AdminNavigationGroup {
	defaultRouteKey: string;
	iconKey: AdminGroupIconKey;
	key: Exclude<AdminRouteGroupKey, "dashboard" | "account">;
	nodes: readonly AdminNavigationNode[];
	titleKey: string;
}

const loadDashboardPage = async (): Promise<LazyAdminRouteModule> => {
	const { DashboardPage } = await import("../features/dashboard/DashboardPage");
	return { Component: DashboardPage };
};

const loadUsersPage = async (): Promise<LazyAdminRouteModule> => {
	const { UsersPage } = await import("../features/organization/UsersPage");
	return { Component: UsersPage };
};

const loadRolesPage = async (): Promise<LazyAdminRouteModule> => {
	const { RolesPage } = await import("../features/access/RolesPage");
	return { Component: RolesPage };
};

const loadAuditLogPage = async (): Promise<LazyAdminRouteModule> => {
	const { AuditLogPage } = await import("../features/operations/AuditLogPage");
	return { Component: AuditLogPage };
};

const loadLoginLogPage = async (): Promise<LazyAdminRouteModule> => {
	const { LoginLogPage } = await import("../features/operations/LoginLogPage");
	return { Component: LoginLogPage };
};

const loadPlatformSettingsPage = async (): Promise<LazyAdminRouteModule> => {
	const { PlatformSettingsPage } =
		await import("../features/system/PlatformSettingsPage");
	return { Component: PlatformSettingsPage };
};

const loadAboutSystemPage = async (): Promise<LazyAdminRouteModule> => {
	const { AboutSystemPage } =
		await import("../features/system/AboutSystemPage");
	return { Component: AboutSystemPage };
};

const loadForbiddenPage = async (): Promise<LazyAdminRouteModule> => {
	const { ForbiddenPage } =
		await import("../features/exceptions/ExceptionPages");
	return { Component: ForbiddenPage };
};

const loadNotFoundPage = async (): Promise<LazyAdminRouteModule> => {
	const { NotFoundPage } =
		await import("../features/exceptions/ExceptionPages");
	return { Component: NotFoundPage };
};

const loadServerErrorPage = async (): Promise<LazyAdminRouteModule> => {
	const { ServerErrorPage } =
		await import("../features/exceptions/ExceptionPages");
	return { Component: ServerErrorPage };
};

const loadAccountProfilePage = async (): Promise<LazyAdminRouteModule> => {
	const { AccountProfileRoutePage } =
		await import("../features/account/AccountProfileRoutePage");
	return { Component: AccountProfileRoutePage };
};

const loadAccountSettingsPage = async (): Promise<LazyAdminRouteModule> => {
	const { AccountSettingsPage } =
		await import("../features/account/AccountSettingsPage");
	return { Component: AccountSettingsPage };
};

const allAdminRoutes: readonly AdminRouteMetadata[] = [
	{
		groupKey: "dashboard",
		iconKey: "dashboard",
		key: dashboardPath,
		lazy: loadDashboardPage,
		sectionKey: "adminShell.navigation.dashboard",
		titleKey: "adminShell.navigation.dashboard",
	},
	{
		groupKey: "system",
		iconKey: "users",
		key: "/organization/users",
		lazy: loadUsersPage,
		requiredPermission: platformPermissions.usersRead,
		sectionKey: "adminShell.navigation.system",
		titleKey: "adminShell.navigation.users",
	},
	{
		groupKey: "system",
		iconKey: "roles",
		key: "/access/roles",
		lazy: loadRolesPage,
		requiredPermission: platformPermissions.rolesManage,
		sectionKey: "adminShell.navigation.system",
		titleKey: "adminShell.navigation.roles",
	},
	{
		groupKey: "operations",
		iconKey: "auditLogs",
		key: "/operations/audit-logs",
		lazy: loadAuditLogPage,
		requiredPermission: platformPermissions.logsRead,
		sectionKey: "adminShell.navigation.operations",
		titleKey: "adminShell.navigation.auditLogs",
	},
	{
		groupKey: "operations",
		iconKey: "loginLogs",
		key: "/operations/login-logs",
		lazy: loadLoginLogPage,
		requiredPermission: platformPermissions.logsRead,
		sectionKey: "adminShell.navigation.operations",
		titleKey: "adminShell.navigation.loginLogs",
	},
	{
		aliases: ["/system/settings/appearance"],
		groupKey: "system",
		iconKey: "settings",
		key: "/system/settings",
		lazy: loadPlatformSettingsPage,
		sectionKey: "adminShell.navigation.system",
		titleKey: "adminShell.navigation.settings",
	},
	{
		groupKey: "system",
		iconKey: "about",
		key: "/system/about",
		lazy: loadAboutSystemPage,
		sectionKey: "adminShell.navigation.system",
		titleKey: "adminShell.navigation.about",
	},
	{
		groupKey: "system",
		key: "/exception/403",
		lazy: loadForbiddenPage,
		sectionKey: "adminShell.exceptions.section",
		titleKey: "adminShell.exceptions.forbiddenTitle",
	},
	{
		groupKey: "system",
		key: "/exception/404",
		lazy: loadNotFoundPage,
		sectionKey: "adminShell.exceptions.section",
		titleKey: "adminShell.exceptions.notFoundTitle",
	},
	{
		groupKey: "system",
		key: "/exception/500",
		lazy: loadServerErrorPage,
		sectionKey: "adminShell.exceptions.section",
		titleKey: "adminShell.exceptions.serverErrorTitle",
	},
	{
		groupKey: "account",
		iconKey: "users",
		key: "/account/profile",
		lazy: loadAccountProfilePage,
		sectionKey: "adminShell.account.section",
		titleKey: "adminShell.userMenu.profile",
	},
	{
		groupKey: "account",
		iconKey: "settings",
		key: "/account/settings",
		lazy: loadAccountSettingsPage,
		sectionKey: "adminShell.account.section",
		titleKey: "adminShell.userMenu.settings",
	},
];

const allNavigationGroups: readonly AdminNavigationGroup[] = [
	{
		defaultRouteKey: "/operations/audit-logs",
		iconKey: "operations",
		key: "operations",
		nodes: [
			{ routeKey: "/operations/audit-logs" },
			{ routeKey: "/operations/login-logs" },
		],
		titleKey: "adminShell.navigation.operations",
	},
	{
		defaultRouteKey: "/organization/users",
		iconKey: "system",
		key: "system",
		nodes: [
			{ routeKey: "/organization/users" },
			{ routeKey: "/access/roles" },
			{ routeKey: "/system/settings" },
			{ routeKey: "/system/about" },
		],
		titleKey: "adminShell.navigation.system",
	},
];

export const adminRouteDefinitions = allAdminRoutes;

export const adminNavigationGroups = allNavigationGroups;

export const adminRouteByPath = new Map<string, AdminRouteMetadata>(
	adminRouteDefinitions.flatMap((route) =>
		[route.key, ...(route.aliases ?? [])].map((path) => [path, route]),
	),
);

export const adminNavigationGroupByKey = new Map<
	AdminRouteGroupKey,
	AdminNavigationGroup
>(adminNavigationGroups.map((group) => [group.key, group]));

export const adminSidebarGroupKeys = adminNavigationGroups.map(
	(group) => group.key,
);

export function getAdminRouteMetadata(pathname: string) {
	return (
		adminRouteByPath.get(pathname) ?? adminRouteByPath.get("/exception/404")!
	);
}

export function getAdminRouteOpenKeys(route: AdminRouteMetadata) {
	if (route.groupKey === "dashboard" || route.groupKey === "account") {
		return [];
	}

	return [route.groupKey];
}
