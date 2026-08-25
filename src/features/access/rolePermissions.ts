import {
	platformPermissions,
	type PlatformPermission,
} from "../../app/permissions";

type PermissionGroupKey =
	"announcements" | "roles" | "users" | "logs" | "settings";

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

export const allPermissionValues = Object.keys(
	permissionDefinitionByValue,
) as PlatformPermission[];

export const permissionValueSet = new Set<string>(allPermissionValues);

export const permissionGroupNodeKeys = permissionGroups.map(
	(group) => `group:${group.groupKey}`,
);
