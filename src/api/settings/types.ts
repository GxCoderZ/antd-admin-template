export interface PlatformGeneralSettings {
	siteTitle: string;
	shortTitle: string;
	logoDataUrl: string | null;
	browserTitle: string;
	copyright: string;
}

interface PlatformSecuritySettings {
	loginAccess: "all" | "adminOnly" | "disabled";
	maintenanceEnabled: boolean;
	maintenanceMessage: string;
}

interface PlatformNotificationSettings {
	announcementsEnabled: boolean;
	inboxEnabled: boolean;
}

export interface PlatformSettingsValues {
	general: PlatformGeneralSettings;
	security: PlatformSecuritySettings;
	notifications: PlatformNotificationSettings;
}

export interface PlatformSettings extends PlatformSettingsValues {
	version: number;
}

export interface UpdatePlatformSettingsInput extends PlatformSettingsValues {
	expectedVersion: number;
}
