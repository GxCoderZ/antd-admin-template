export type PlatformPermission =
	| "platform.logs.read"
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
