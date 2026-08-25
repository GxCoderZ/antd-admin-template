import {
	platformPermissions,
	type PlatformPermission,
} from "../../app/permissions";

type PermissionGroupKey =
	"announcements" | "roles" | "users" | "logs" | "settings";
type PermissionMenuKey = "operations" | "system";
type PermissionPageKey =
	"announcements" | "logs" | "roles" | "settings" | "users";

interface PermissionDefinition {
	groupKey: PermissionGroupKey;
	i18nKey:
		| "announcementsManage"
		| "announcementsRead"
		| "rolesManage"
		| "usersManage"
		| "usersRead"
		| "logsRead"
		| "settingsManage";
	permission: PlatformPermission;
}

export interface PermissionTreeBranch {
	children: PermissionTreeNode[];
	key: string;
	titleKey: string;
	type: "menu" | "page" | "root";
}

interface PermissionTreeLeaf {
	descriptionKey: string;
	i18nKey: PermissionDefinition["i18nKey"];
	key: PlatformPermission;
	permission: PlatformPermission;
	titleKey: string;
	type: "permission";
}

export type PermissionTreeNode = PermissionTreeBranch | PermissionTreeLeaf;

const permissionDefinitionByValue = {
	[platformPermissions.announcementsRead]: {
		groupKey: "announcements",
		i18nKey: "announcementsRead",
		permission: platformPermissions.announcementsRead,
	},
	[platformPermissions.announcementsManage]: {
		groupKey: "announcements",
		i18nKey: "announcementsManage",
		permission: platformPermissions.announcementsManage,
	},
	[platformPermissions.rolesManage]: {
		groupKey: "roles",
		i18nKey: "rolesManage",
		permission: platformPermissions.rolesManage,
	},
	[platformPermissions.usersRead]: {
		groupKey: "users",
		i18nKey: "usersRead",
		permission: platformPermissions.usersRead,
	},
	[platformPermissions.usersManage]: {
		groupKey: "users",
		i18nKey: "usersManage",
		permission: platformPermissions.usersManage,
	},
	[platformPermissions.logsRead]: {
		groupKey: "logs",
		i18nKey: "logsRead",
		permission: platformPermissions.logsRead,
	},
	[platformPermissions.settingsManage]: {
		groupKey: "settings",
		i18nKey: "settingsManage",
		permission: platformPermissions.settingsManage,
	},
} satisfies Record<PlatformPermission, PermissionDefinition>;

export const permissionGroups = (
	["roles", "users", "announcements", "logs", "settings"] as const
).map((groupKey) => ({
	groupKey,
	permissions: Object.values(permissionDefinitionByValue).filter(
		(definition) => definition.groupKey === groupKey,
	),
}));

const permissionPageGroups: Record<
	PermissionPageKey,
	{ permissions: PlatformPermission[]; titleKey: string }
> = {
	announcements: {
		permissions: [
			platformPermissions.announcementsRead,
			platformPermissions.announcementsManage,
		],
		titleKey: "adminShell.roles.permissions.pages.announcements",
	},
	logs: {
		permissions: [platformPermissions.logsRead],
		titleKey: "adminShell.roles.permissions.pages.logs",
	},
	roles: {
		permissions: [platformPermissions.rolesManage],
		titleKey: "adminShell.roles.permissions.pages.roles",
	},
	settings: {
		permissions: [platformPermissions.settingsManage],
		titleKey: "adminShell.roles.permissions.pages.settings",
	},
	users: {
		permissions: [
			platformPermissions.usersRead,
			platformPermissions.usersManage,
		],
		titleKey: "adminShell.roles.permissions.pages.users",
	},
};

const permissionMenuGroups: Record<
	PermissionMenuKey,
	{ pages: PermissionPageKey[]; titleKey: string }
> = {
	operations: {
		pages: ["logs"],
		titleKey: "adminShell.roles.permissions.menus.operations",
	},
	system: {
		pages: ["users", "roles", "announcements", "settings"],
		titleKey: "adminShell.roles.permissions.menus.system",
	},
};

const toPermissionLeaf = (
	permission: PlatformPermission,
): PermissionTreeLeaf => {
	const definition = permissionDefinitionByValue[permission];

	return {
		descriptionKey: `adminShell.roles.permissions.items.${definition.i18nKey}.description`,
		i18nKey: definition.i18nKey,
		key: definition.permission,
		permission: definition.permission,
		titleKey: `adminShell.roles.permissions.items.${definition.i18nKey}.name`,
		type: "permission",
	};
};

const toPermissionPage = (pageKey: PermissionPageKey): PermissionTreeBranch => {
	const page = permissionPageGroups[pageKey];

	return {
		children: page.permissions.map(toPermissionLeaf),
		key: `page:${pageKey}`,
		titleKey: page.titleKey,
		type: "page",
	};
};

const toPermissionMenu = (menuKey: PermissionMenuKey): PermissionTreeBranch => {
	const menu = permissionMenuGroups[menuKey];

	return {
		children: menu.pages.map(toPermissionPage),
		key: `menu:${menuKey}`,
		titleKey: menu.titleKey,
		type: "menu",
	};
};

export const permissionTree: PermissionTreeBranch = {
	children: (["system", "operations"] as const).map(toPermissionMenu),
	key: "root:platform",
	titleKey: "adminShell.roles.permissions.root",
	type: "root",
};

export const allPermissionValues = Object.keys(
	permissionDefinitionByValue,
) as PlatformPermission[];

export const permissionValueSet = new Set<string>(allPermissionValues);

const collectBranchKeys = (node: PermissionTreeNode): string[] =>
	node.type === "permission"
		? []
		: [node.key, ...node.children.flatMap(collectBranchKeys)];

export const permissionBranchNodeKeys = collectBranchKeys(permissionTree);

export const defaultPermissionExpandedKeys = [
	permissionTree.key,
	...permissionTree.children.map((node) => node.key),
];
