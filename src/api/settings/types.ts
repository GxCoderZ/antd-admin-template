export interface PlatformSettings {
	siteTitle: string;
	version?: number;
}

export interface UpdatePlatformSettingsInput {
	siteTitle: string;
	expectedVersion?: number;
}
