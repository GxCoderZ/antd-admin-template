import type {
	PlatformSettings,
	PlatformSettingsValues,
} from "../src/api/settings";

const initialSettings: PlatformSettings = {
	general: {
		siteTitle: "React Antd Admin",
		shortTitle: "Admin",
		logoDataUrl: null,
		browserTitle: "React Antd Admin",
		copyright: "Copyright 2026 React Antd Admin",
	},
	security: {
		loginAccess: "all",
		maintenanceEnabled: false,
		maintenanceMessage: "系统维护中，请稍后再试。",
	},
	notifications: {
		announcementsEnabled: true,
		inboxEnabled: true,
	},
	version: 1,
};

let settings: PlatformSettings = structuredClone(initialSettings);

export function getSettingsState() {
	return structuredClone(settings);
}

export function updateSettingsState(values: PlatformSettingsValues) {
	settings = structuredClone({
		...values,
		version: settings.version + 1,
	});
	return getSettingsState();
}

export function resetSettingsState() {
	settings = structuredClone(initialSettings);
}
