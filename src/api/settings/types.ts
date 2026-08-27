export interface PlatformGeneralSettings {
	siteTitle: string;
	shortTitle: string;
	logoDataUrl: string | null;
	browserTitle: string;
	copyright: string;
}

export type PasswordRequirement =
	"lowercase" | "uppercase" | "number" | "symbol";

interface PlatformSecuritySettings {
	loginAccess: "all" | "adminOnly" | "disabled";
	maintenanceEnabled: boolean;
	maintenanceMessage: string;
	maintenanceEndsAt: string | null;
	captchaEnabled: boolean;
	passwordMinLength: number;
	passwordRequirements: PasswordRequirement[];
	loginFailureLimit: number;
	lockoutMinutes: number;
	idleTimeoutMinutes: number;
	forceInitialPasswordChange: boolean;
}

interface PlatformNotificationSettings {
	announcementsEnabled: boolean;
	inboxEnabled: boolean;
	unreadReminderEnabled: boolean;
	retentionDays: number;
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
