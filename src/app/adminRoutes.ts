import type { ComponentType } from "react";

import { platformPermissions, type PlatformPermission } from "./permissions";

export const dashboardPath = "/dashboard";

export type AdminRouteGroupKey =
	| "dashboard"
	| "operations"
	| "examples"
	| "listExamples"
	| "formExamples"
	| "results"
	| "exceptions"
	| "system"
	| "account";

export type AdminRouteIconKey =
	| "dashboard"
	| "users"
	| "roles"
	| "departments"
	| "positions"
	| "dictionaries"
	| "announcements"
	| "importExport"
	| "auditLogs"
	| "loginLogs"
	| "basicForm"
	| "batchTable"
	| "stepForm"
	| "advancedForm"
	| "searchArticles"
	| "searchProjects"
	| "searchApplications"
	| "editableTable"
	| "treeCategory"
	| "previewPanel"
	| "resultSuccess"
	| "resultFailure"
	| "exceptionForbidden"
	| "exceptionNotFound"
	| "exceptionServerError"
	| "settings"
	| "about";

export type AdminGroupIconKey =
	| "examples"
	| "formExamples"
	| "listExamples"
	| "operations"
	| "results"
	| "exceptions"
	| "system";

interface LazyAdminRouteModule {
	Component: ComponentType;
}

interface AdminRouteAlias {
	lazy: () => Promise<LazyAdminRouteModule>;
	path: string;
}

export interface AdminRouteMetadata {
	aliases?: readonly AdminRouteAlias[];
	contentLayout?: "pageContainer";
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

const loadAdvancedFormPage = async (): Promise<LazyAdminRouteModule> => {
	const { AdvancedFormPage } =
		await import("../features/form-examples/AdvancedFormPage");
	return { Component: AdvancedFormPage };
};

const loadBasicListPage = async (): Promise<LazyAdminRouteModule> => {
	const { BasicListPage } =
		await import("../features/page-examples/ListExamplePages");
	return { Component: BasicListPage };
};

const loadBatchOperationsTablePage =
	async (): Promise<LazyAdminRouteModule> => {
		const { BatchOperationsTablePage } =
			await import("../features/batch-table/BatchOperationsTablePage");
		return { Component: BatchOperationsTablePage };
	};

const loadSearchArticlesPage = async (): Promise<LazyAdminRouteModule> => {
	const { SearchArticlesPage } =
		await import("../features/page-examples/SearchListPages");
	return { Component: SearchArticlesPage };
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

const loadSearchProjectsPage = async (): Promise<LazyAdminRouteModule> => {
	const { SearchProjectsPage } =
		await import("../features/page-examples/SearchListPages");
	return { Component: SearchProjectsPage };
};

const loadSearchApplicationsPage = async (): Promise<LazyAdminRouteModule> => {
	const { SearchApplicationsPage } =
		await import("../features/page-examples/SearchListPages");
	return { Component: SearchApplicationsPage };
};

const loadEditableTablePage = async (): Promise<LazyAdminRouteModule> => {
	const { EditableTablePage } =
		await import("../features/editable-table-examples/EditableTablePage");
	return { Component: EditableTablePage };
};

const loadCardListPage = async (): Promise<LazyAdminRouteModule> => {
	const { CardListPage } =
		await import("../features/page-examples/ListExamplePages");
	return { Component: CardListPage };
};

const loadContentCategoryManagementPage =
	async (): Promise<LazyAdminRouteModule> => {
		const { ContentCategoryManagementPage } =
			await import("../features/content-categories/ContentCategoryManagementPage");
		return { Component: ContentCategoryManagementPage };
	};

const loadPreviewWorkbenchPage = async (): Promise<LazyAdminRouteModule> => {
	const { PreviewWorkbenchPage } =
		await import("../features/preview-example/PreviewWorkbenchPage");
	return { Component: PreviewWorkbenchPage };
};

const loadGenericDetailPage = async (): Promise<LazyAdminRouteModule> => {
	const { GenericDetailPage } =
		await import("../features/page-examples/GenericDetailPage");
	return { Component: GenericDetailPage };
};

const loadSuccessResultPage = async (): Promise<LazyAdminRouteModule> => {
	const { SuccessResultPage } =
		await import("../features/results/SuccessResultPage");
	return { Component: SuccessResultPage };
};

const loadFailureResultPage = async (): Promise<LazyAdminRouteModule> => {
	const { FailureResultPage } =
		await import("../features/results/FailureResultPage");
	return { Component: FailureResultPage };
};

const loadFileManagementPage = async (): Promise<LazyAdminRouteModule> => {
	const { FileManagementPage } =
		await import("../features/files/FileManagementPage");
	return { Component: FileManagementPage };
};

const loadImportExportPage = async (): Promise<LazyAdminRouteModule> => {
	const { ImportExportPage } =
		await import("../features/import-export/ImportExportPage");
	return { Component: ImportExportPage };
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
		iconKey: "departments",
		key: "/organization/departments",
		lazy: loadDepartmentsPage,
		requiredPermission: platformPermissions.departmentsManage,
		sectionKey: "adminShell.navigation.system",
		titleKey: "adminShell.navigation.departments",
	},
	{
		groupKey: "system",
		iconKey: "positions",
		key: "/organization/positions",
		lazy: loadPositionsPage,
		requiredPermission: platformPermissions.positionsManage,
		sectionKey: "adminShell.navigation.system",
		titleKey: "adminShell.navigation.positions",
	},
	{
		groupKey: "system",
		iconKey: "dictionaries",
		key: "/system/dictionaries",
		lazy: loadDictionariesPage,
		requiredPermission: platformPermissions.dictionariesManage,
		sectionKey: "adminShell.navigation.system",
		titleKey: "adminShell.navigation.dictionaries",
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
		groupKey: "listExamples",
		iconKey: "auditLogs",
		key: "/examples/lists/basic",
		lazy: loadBasicListPage,
		sectionKey: "adminShell.navigation.listExamples",
		titleKey: "adminShell.navigation.basicList",
	},
	{
		contentLayout: "pageContainer",
		groupKey: "listExamples",
		iconKey: "batchTable",
		key: "/examples/lists/batch-operations",
		lazy: loadBatchOperationsTablePage,
		sectionKey: "adminShell.navigation.listExamples",
		titleKey: "adminShell.navigation.batchOperationsTable",
	},
	{
		aliases: [{ lazy: loadSearchArticlesPage, path: "/examples/lists/search" }],
		groupKey: "listExamples",
		iconKey: "searchArticles",
		key: "/examples/lists/search/articles",
		lazy: loadSearchArticlesPage,
		navigationParentKeys: ["example-search-lists"],
		sectionKey: "adminShell.navigation.listExamples",
		titleKey: "adminShell.navigation.searchArticles",
	},
	{
		groupKey: "listExamples",
		iconKey: "searchProjects",
		key: "/examples/lists/search/projects",
		lazy: loadSearchProjectsPage,
		navigationParentKeys: ["example-search-lists"],
		sectionKey: "adminShell.navigation.listExamples",
		titleKey: "adminShell.navigation.searchProjects",
	},
	{
		groupKey: "listExamples",
		iconKey: "searchApplications",
		key: "/examples/lists/search/applications",
		lazy: loadSearchApplicationsPage,
		navigationParentKeys: ["example-search-lists"],
		sectionKey: "adminShell.navigation.listExamples",
		titleKey: "adminShell.navigation.searchApplications",
	},
	{
		groupKey: "listExamples",
		iconKey: "editableTable",
		key: "/examples/lists/editable-table",
		lazy: loadEditableTablePage,
		sectionKey: "adminShell.navigation.listExamples",
		titleKey: "adminShell.navigation.editableTable",
	},
	{
		groupKey: "listExamples",
		iconKey: "about",
		key: "/examples/lists/cards",
		lazy: loadCardListPage,
		sectionKey: "adminShell.navigation.listExamples",
		titleKey: "adminShell.navigation.cardList",
	},
	{
		groupKey: "examples",
		iconKey: "treeCategory",
		key: "/examples/tree-category",
		lazy: loadContentCategoryManagementPage,
		sectionKey: "adminShell.navigation.examples",
		titleKey: "adminShell.navigation.treeCategory",
	},
	{
		groupKey: "examples",
		iconKey: "previewPanel",
		key: "/examples/preview-panel",
		lazy: loadPreviewWorkbenchPage,
		sectionKey: "adminShell.navigation.examples",
		titleKey: "adminShell.navigation.previewPanel",
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
		aliases: [
			{ lazy: loadSuccessResultPage, path: "/examples/results/success" },
		],
		groupKey: "results",
		iconKey: "resultSuccess",
		key: "/result/success",
		lazy: loadSuccessResultPage,
		sectionKey: "adminShell.navigation.resultExamples",
		titleKey: "adminShell.navigation.successResult",
	},
	{
		aliases: [
			{ lazy: loadFailureResultPage, path: "/examples/results/failure" },
		],
		groupKey: "results",
		iconKey: "resultFailure",
		key: "/result/fail",
		lazy: loadFailureResultPage,
		sectionKey: "adminShell.navigation.resultExamples",
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
		iconKey: "importExport",
		key: "/examples/import-export",
		lazy: loadImportExportPage,
		requiredPermission: platformPermissions.importExportManage,
		sectionKey: "adminShell.navigation.examples",
		titleKey: "adminShell.navigation.importExport",
	},
	{
		groupKey: "formExamples",
		iconKey: "basicForm",
		key: "/examples/forms/basic",
		lazy: loadBasicFormPage,
		sectionKey: "adminShell.navigation.formExamples",
		titleKey: "adminShell.navigation.basicForm",
	},
	{
		groupKey: "formExamples",
		iconKey: "stepForm",
		key: "/examples/forms/step",
		lazy: loadStepFormPage,
		sectionKey: "adminShell.navigation.formExamples",
		titleKey: "adminShell.navigation.stepForm",
	},
	{
		groupKey: "formExamples",
		iconKey: "advancedForm",
		key: "/examples/forms/advanced",
		lazy: loadAdvancedFormPage,
		sectionKey: "adminShell.navigation.formExamples",
		titleKey: "adminShell.navigation.advancedForm",
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
		iconKey: "listExamples",
		key: "listExamples",
		nodes: [
			{ routeKey: "/examples/lists/basic" },
			{ routeKey: "/examples/lists/batch-operations" },
			{
				key: "example-search-lists",
				titleKey: "adminShell.navigation.searchList",
				children: [
					{ routeKey: "/examples/lists/search/articles" },
					{ routeKey: "/examples/lists/search/projects" },
					{ routeKey: "/examples/lists/search/applications" },
				],
			},
			{ routeKey: "/examples/lists/cards" },
			{ routeKey: "/examples/lists/editable-table" },
		],
		titleKey: "adminShell.navigation.listExamples",
	},
	{
		defaultRouteKey: "/examples/tree-category",
		iconKey: "examples",
		key: "examples",
		nodes: [
			{ routeKey: "/examples/tree-category" },
			{ routeKey: "/examples/preview-panel" },
			{ routeKey: "/examples/detail" },
			{ routeKey: "/examples/files" },
			{ routeKey: "/examples/import-export" },
		],
		titleKey: "adminShell.navigation.examples",
	},
	{
		defaultRouteKey: "/examples/forms/basic",
		iconKey: "formExamples",
		key: "formExamples",
		nodes: [
			{ routeKey: "/examples/forms/basic" },
			{ routeKey: "/examples/forms/step" },
			{ routeKey: "/examples/forms/advanced" },
		],
		titleKey: "adminShell.navigation.formExamples",
	},
	{
		defaultRouteKey: "/result/success",
		iconKey: "results",
		key: "results",
		nodes: [{ routeKey: "/result/success" }, { routeKey: "/result/fail" }],
		titleKey: "adminShell.navigation.resultExamples",
	},
	{
		defaultRouteKey: "/exception/403",
		iconKey: "exceptions",
		key: "exceptions",
		nodes: [
			{ routeKey: "/exception/403" },
			{ routeKey: "/exception/404" },
			{ routeKey: "/exception/500" },
		],
		titleKey: "adminShell.exceptions.section",
	},
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

export const adminCollapsibleSidebarGroupKeys = adminNavigationGroups.map(
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

	return adminCollapsibleSidebarGroupKeys.includes(route.groupKey)
		? [route.groupKey, ...(route.navigationParentKeys ?? [])]
		: [...(route.navigationParentKeys ?? [])];
}
