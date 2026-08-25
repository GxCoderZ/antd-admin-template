export type PlatformPermission =
	| "platform.announcements.manage"
	| "platform.announcements.read"
	| "platform.departments.manage"
	| "platform.dictionaries.manage"
	| "platform.import-export.manage"
	| "platform.logs.read"
	| "platform.positions.manage"
	| "platform.roles.manage"
	| "platform.settings.manage"
	| "platform.users.read"
	| "platform.users.manage";

export interface PlatformAvatarData {
	dataUrl: string | null;
}

export interface PlatformUserRole {
	id: string;
	roleKey: string;
	displayName: string;
}
