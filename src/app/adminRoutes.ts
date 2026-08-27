import type { ComponentType } from "react";

import { platformPermissions, type PlatformPermission } from "./permissions";

export const dashboardPath = "/dashboard";
export const aboutPath = "/system/about";

export type AdminRouteGroupKey =
	"dashboard" | "exceptions" | "system" | "account" | "about";

export type AdminRouteIconKey =
	| "dashboard"
	| "users"
	| "roles"
	| "departments"
	| "positions"
	| "dictionaries"
	| "announcements"
	| "logs"
	| "auditLogs"
	| "loginLogs"
	| "exceptionForbidden"
	| "exceptionNotFound"
	| "exceptionServerError"
	| "settings"
	| "about";

export type AdminGroupIconKey = "system";

interface LazyAdminRouteModule {
	Component: ComponentType;
}

export interface AdminRouteMetadata {
	contentLayout?: "pageContainer" | "table";
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
	iconKey?: AdminRouteIconKey;
	key?: string;
	routeKey?: string;
	titleKey?: string;
}

export interface AdminNavigationGroup {
	defaultRouteKey: string;
	iconKey: AdminGroupIconKey;
	key: Exclude<
		AdminRouteGroupKey,
		"dashboard" | "account" | "exceptions" | "about"
	>;
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

const loadAnnouncementsPage = async (): Promise<LazyAdminRouteModule> => {
	const { AnnouncementsPage } =
		await import("../features/announcements/AnnouncementsPage");
	return { Component: AnnouncementsPage };
};

const loadAuditLogPage = async (): Promise<LazyAdminRouteModule> => {
	const { AuditLogPage } = await import("../features/operations/AuditLogPage");
	return { Component: AuditLogPage };
};

const loadLoginLogPage = async (): Promise<LazyAdminRouteModule> => {
	const { LoginLogPage } = await import("../features/operations/LoginLogPage");
	return { Component: LoginLogPage };
};

const loadDepartmentsPage = async (): Promise<LazyAdminRouteModule> => {
	const { DepartmentsPage } =
		await import("../features/departments/DepartmentsPage");
	return { Component: DepartmentsPage };
};

const loadPositionsPage = async (): Promise<LazyAdminRouteModule> => {
	const { PositionsPage } = await import("../features/positions/PositionsPage");
	return { Component: PositionsPage };
};

const loadDictionariesPage = async (): Promise<LazyAdminRouteModule> => {
	const { DictionariesPage } =
		await import("../features/dictionaries/DictionariesPage");
	return { Component: DictionariesPage };
};

const loadNotificationCenterPage = async (): Promise<LazyAdminRouteModule> => {
	const { NotificationCenterPage } =
		await import("../features/notifications/NotificationCenterPage");
	return { Component: NotificationCenterPage };
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
		contentLayout: "table",
		groupKey: "system",
		iconKey: "users",
		key: "/organization/users",
		lazy: loadUsersPage,
		requiredPermission: platformPermissions.usersRead,
		sectionKey: "adminShell.navigation.system",
		titleKey: "adminShell.navigation.users",
	},
	{
		contentLayout: "table",
		groupKey: "system",
		iconKey: "roles",
		key: "/access/roles",
		lazy: loadRolesPage,
		requiredPermission: platformPermissions.rolesManage,
		sectionKey: "adminShell.navigation.system",
		titleKey: "adminShell.navigation.roles",
	},
	{
		contentLayout: "table",
		groupKey: "system",
		iconKey: "departments",
		key: "/organization/departments",
		lazy: loadDepartmentsPage,
		requiredPermission: platformPermissions.departmentsManage,
		sectionKey: "adminShell.navigation.system",
		titleKey: "adminShell.navigation.departments",
	},
	{
		contentLayout: "table",
		groupKey: "system",
		iconKey: "positions",
		key: "/organization/positions",
		lazy: loadPositionsPage,
		requiredPermission: platformPermissions.positionsManage,
		sectionKey: "adminShell.navigation.system",
		titleKey: "adminShell.navigation.positions",
	},
	{
		contentLayout: "table",
		groupKey: "system",
		iconKey: "dictionaries",
		key: "/system/dictionaries",
		lazy: loadDictionariesPage,
		requiredPermission: platformPermissions.dictionariesManage,
		sectionKey: "adminShell.navigation.system",
		titleKey: "adminShell.navigation.dictionaries",
	},
	{
		contentLayout: "table",
		groupKey: "system",
		iconKey: "announcements",
		key: "/system/announcements",
		lazy: loadAnnouncementsPage,
		requiredPermission: platformPermissions.announcementsRead,
		sectionKey: "adminShell.navigation.system",
		titleKey: "adminShell.navigation.announcements",
	},
	{
		contentLayout: "table",
		groupKey: "system",
		iconKey: "auditLogs",
		key: "/operations/audit-logs",
		lazy: loadAuditLogPage,
		requiredPermission: platformPermissions.logsRead,
		sectionKey: "adminShell.navigation.system",
		titleKey: "adminShell.navigation.auditLogs",
	},
	{
		contentLayout: "table",
		groupKey: "system",
		iconKey: "loginLogs",
		key: "/operations/login-logs",
		lazy: loadLoginLogPage,
		requiredPermission: platformPermissions.logsRead,
		sectionKey: "adminShell.navigation.system",
		titleKey: "adminShell.navigation.loginLogs",
	},
	{
		groupKey: "system",
		iconKey: "settings",
		key: "/system/settings",
		lazy: loadPlatformSettingsPage,
		sectionKey: "adminShell.navigation.system",
		titleKey: "adminShell.navigation.settings",
	},
	{
		groupKey: "about",
		iconKey: "about",
		key: aboutPath,
		lazy: loadAboutSystemPage,
		sectionKey: "adminShell.navigation.about",
		titleKey: "adminShell.navigation.about",
	},
	{
		groupKey: "exceptions",
		iconKey: "exceptionForbidden",
		key: "/exception/403",
		lazy: loadForbiddenPage,
		sectionKey: "adminShell.exceptions.section",
		titleKey: "adminShell.exceptions.forbiddenTitle",
	},
	{
		groupKey: "exceptions",
		iconKey: "exceptionNotFound",
		key: "/exception/404",
		lazy: loadNotFoundPage,
		sectionKey: "adminShell.exceptions.section",
		titleKey: "adminShell.exceptions.notFoundTitle",
	},
	{
		groupKey: "exceptions",
		iconKey: "exceptionServerError",
		key: "/exception/500",
		lazy: loadServerErrorPage,
		sectionKey: "adminShell.exceptions.section",
		titleKey: "adminShell.exceptions.serverErrorTitle",
	},
	{
		groupKey: "account",
		iconKey: "announcements",
		key: "/account/notifications",
		lazy: loadNotificationCenterPage,
		sectionKey: "adminShell.account.section",
		titleKey: "adminShell.navigation.notificationCenter",
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
		defaultRouteKey: "/organization/users",
		iconKey: "system",
		key: "system",
		nodes: [
			{ routeKey: "/organization/users" },
			{ routeKey: "/access/roles" },
			{ routeKey: "/organization/departments" },
			{ routeKey: "/organization/positions" },
			{ routeKey: "/system/dictionaries" },
			{ routeKey: "/system/announcements" },
			{ routeKey: "/system/settings" },
			{
				iconKey: "logs",
				key: "system-logs",
				titleKey: "adminShell.navigation.logs",
				children: [
					{ routeKey: "/operations/login-logs" },
					{ routeKey: "/operations/audit-logs" },
				],
			},
		],
		titleKey: "adminShell.navigation.system",
	},
];

export const adminRouteDefinitions = allAdminRoutes;

export const adminNavigationGroups = allNavigationGroups;

export const adminRouteByPath = new Map<string, AdminRouteMetadata>(
	adminRouteDefinitions.map((route) => [route.key, route]),
);

export const adminNavigationGroupByKey = new Map<
	AdminRouteGroupKey,
	AdminNavigationGroup
>(adminNavigationGroups.map((group) => [group.key, group]));

export const adminCollapsibleSidebarGroupKeys = adminNavigationGroups.map(
	(group) => group.key,
);

export function getAdminRouteMetadata(pathname: string) {
	return (
		adminRouteByPath.get(pathname) ?? adminRouteByPath.get("/exception/404")!
	);
}

export function getAdminRouteNavigationParents(route: AdminRouteMetadata) {
	const group = adminNavigationGroupByKey.get(route.groupKey);
	const findParents = (
		nodes: readonly AdminNavigationNode[],
	): AdminNavigationNode[] | undefined => {
		for (const node of nodes) {
			if (node.routeKey === route.key) {
				return [];
			}
			if (node.children) {
				const parents = findParents(node.children);
				if (parents) {
					return [node, ...parents];
				}
			}
		}
	};

	return group ? (findParents(group.nodes) ?? []) : [];
}

export function getAdminRouteOpenKeys(route: AdminRouteMetadata) {
	if (!adminNavigationGroupByKey.has(route.groupKey)) {
		return [];
	}

	return [
		route.groupKey,
		...getAdminRouteNavigationParents(route).flatMap((node) =>
			node.key ? [node.key] : [],
		),
	];
}
