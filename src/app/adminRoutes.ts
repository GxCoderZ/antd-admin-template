import type { ComponentType } from "react";

import { platformPermissions, type PlatformPermission } from "./permissions";

export const dashboardPath = "/dashboard";

export type AdminRouteGroupKey =
	"dashboard" | "operations" | "examples" | "system" | "account";

export type AdminRouteIconKey =
	| "dashboard"
	| "users"
	| "roles"
	| "announcements"
	| "auditLogs"
	| "loginLogs"
	| "basicForm"
	| "stepForm"
	| "settings"
	| "about";

export type AdminGroupIconKey = "examples" | "operations" | "system";

interface LazyAdminRouteModule {
	Component: ComponentType;
}

interface AdminRouteAlias {
	lazy: () => Promise<LazyAdminRouteModule>;
	path: string;
}

export interface AdminRouteMetadata {
	aliases?: readonly AdminRouteAlias[];
	groupKey: AdminRouteGroupKey;
	iconKey?: AdminRouteIconKey;
	key: string;
	lazy: () => Promise<LazyAdminRouteModule>;
	navigationParentKeys?: readonly string[];
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

const loadBasicFormPage = async (): Promise<LazyAdminRouteModule> => {
	const { BasicFormPage } =
		await import("../features/form-examples/BasicFormPage");
	return { Component: BasicFormPage };
};

const loadStepFormPage = async (): Promise<LazyAdminRouteModule> => {
	const { StepFormPage } =
		await import("../features/form-examples/StepFormPage");
	return { Component: StepFormPage };
};

const loadBasicListPage = async (): Promise<LazyAdminRouteModule> => {
	const { BasicListPage } =
		await import("../features/page-examples/ListExamplePages");
	return { Component: BasicListPage };
};

const loadSearchListPage = async (): Promise<LazyAdminRouteModule> => {
	const { SearchListPage } =
		await import("../features/page-examples/ListExamplePages");
	return { Component: SearchListPage };
};

const loadCardListPage = async (): Promise<LazyAdminRouteModule> => {
	const { CardListPage } =
		await import("../features/page-examples/ListExamplePages");
	return { Component: CardListPage };
};

const loadGenericDetailPage = async (): Promise<LazyAdminRouteModule> => {
	const { GenericDetailPage } =
		await import("../features/page-examples/GenericDetailPage");
	return { Component: GenericDetailPage };
};

const loadSuccessResultPage = async (): Promise<LazyAdminRouteModule> => {
	const { SuccessResultPage } =
		await import("../features/page-examples/ResultPages");
	return { Component: SuccessResultPage };
};

const loadFailureResultPage = async (): Promise<LazyAdminRouteModule> => {
	const { FailureResultPage } =
		await import("../features/page-examples/ResultPages");
	return { Component: FailureResultPage };
};

const loadFileManagementPage = async (): Promise<LazyAdminRouteModule> => {
	const { FileManagementPage } =
		await import("../features/files/FileManagementPage");
	return { Component: FileManagementPage };
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

const loadPlatformSettingsAppearancePage =
	async (): Promise<LazyAdminRouteModule> => {
		const { PlatformSettingsAppearancePage } =
			await import("../features/system/PlatformSettingsAppearancePage");
		return { Component: PlatformSettingsAppearancePage };
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
		groupKey: "system",
		iconKey: "announcements",
		key: "/system/announcements",
		lazy: loadAnnouncementsPage,
		requiredPermission: platformPermissions.announcementsRead,
		sectionKey: "adminShell.navigation.system",
		titleKey: "adminShell.navigation.announcements",
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
		groupKey: "examples",
		iconKey: "auditLogs",
		key: "/examples/lists/basic",
		lazy: loadBasicListPage,
		navigationParentKeys: ["example-lists"],
		sectionKey: "adminShell.navigation.examples",
		titleKey: "adminShell.navigation.basicList",
	},
	{
		groupKey: "examples",
		iconKey: "loginLogs",
		key: "/examples/lists/search",
		lazy: loadSearchListPage,
		navigationParentKeys: ["example-lists"],
		sectionKey: "adminShell.navigation.examples",
		titleKey: "adminShell.navigation.searchList",
	},
	{
		groupKey: "examples",
		iconKey: "about",
		key: "/examples/lists/cards",
		lazy: loadCardListPage,
		navigationParentKeys: ["example-lists"],
		sectionKey: "adminShell.navigation.examples",
		titleKey: "adminShell.navigation.cardList",
	},
	{
		groupKey: "examples",
		iconKey: "users",
		key: "/examples/detail",
		lazy: loadGenericDetailPage,
		sectionKey: "adminShell.navigation.examples",
		titleKey: "adminShell.navigation.genericDetail",
	},
	{
		groupKey: "examples",
		iconKey: "announcements",
		key: "/examples/results/success",
		lazy: loadSuccessResultPage,
		navigationParentKeys: ["example-results"],
		sectionKey: "adminShell.navigation.examples",
		titleKey: "adminShell.navigation.successResult",
	},
	{
		groupKey: "examples",
		iconKey: "announcements",
		key: "/examples/results/failure",
		lazy: loadFailureResultPage,
		navigationParentKeys: ["example-results"],
		sectionKey: "adminShell.navigation.examples",
		titleKey: "adminShell.navigation.failureResult",
	},
	{
		groupKey: "examples",
		iconKey: "settings",
		key: "/examples/files",
		lazy: loadFileManagementPage,
		sectionKey: "adminShell.navigation.examples",
		titleKey: "adminShell.navigation.fileManagement",
	},
	{
		groupKey: "examples",
		iconKey: "basicForm",
		key: "/examples/forms/basic",
		lazy: loadBasicFormPage,
		navigationParentKeys: ["example-forms"],
		sectionKey: "adminShell.navigation.examples",
		titleKey: "adminShell.navigation.basicForm",
	},
	{
		groupKey: "examples",
		iconKey: "stepForm",
		key: "/examples/forms/step",
		lazy: loadStepFormPage,
		navigationParentKeys: ["example-forms"],
		sectionKey: "adminShell.navigation.examples",
		titleKey: "adminShell.navigation.stepForm",
	},
	{
		aliases: [
			{
				lazy: loadPlatformSettingsAppearancePage,
				path: "/system/settings/appearance",
			},
		],
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
		defaultRouteKey: "/examples/lists/basic",
		iconKey: "examples",
		key: "examples",
		nodes: [
			{
				key: "example-lists",
				titleKey: "adminShell.navigation.listExamples",
				children: [
					{ routeKey: "/examples/lists/basic" },
					{ routeKey: "/examples/lists/search" },
					{ routeKey: "/examples/lists/cards" },
				],
			},
			{ routeKey: "/examples/detail" },
			{
				key: "example-results",
				titleKey: "adminShell.navigation.resultExamples",
				children: [
					{ routeKey: "/examples/results/success" },
					{ routeKey: "/examples/results/failure" },
				],
			},
			{ routeKey: "/examples/files" },
			{
				key: "example-forms",
				titleKey: "adminShell.navigation.formExamples",
				children: [
					{ routeKey: "/examples/forms/basic" },
					{ routeKey: "/examples/forms/step" },
				],
			},
		],
		titleKey: "adminShell.navigation.examples",
	},
	{
		defaultRouteKey: "/organization/users",
		iconKey: "system",
		key: "system",
		nodes: [
			{ routeKey: "/organization/users" },
			{ routeKey: "/access/roles" },
			{ routeKey: "/system/announcements" },
			{ routeKey: "/system/settings" },
			{ routeKey: "/system/about" },
		],
		titleKey: "adminShell.navigation.system",
	},
];

export const adminRouteDefinitions = allAdminRoutes;

export const adminNavigationGroups = allNavigationGroups;

export const adminRouteByPath = new Map<string, AdminRouteMetadata>(
	adminRouteDefinitions.flatMap(
		(route) =>
			[
				[route.key, route],
				...(route.aliases ?? []).map(
					(alias) => [alias.path, route] as [string, AdminRouteMetadata],
				),
			] as [string, AdminRouteMetadata][],
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

	return [route.groupKey, ...(route.navigationParentKeys ?? [])];
}
