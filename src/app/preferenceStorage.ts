const APP_PREFERENCE_PREFIX = "react-antd-admin.preference.";

export const preferenceStorageKeys = {
	colorBlindMode: `${APP_PREFERENCE_PREFIX}color-blind-mode`,
	currency: `${APP_PREFERENCE_PREFIX}currency`,
	footerVisible: `${APP_PREFERENCE_PREFIX}footer-visible`,
	language: `${APP_PREFERENCE_PREFIX}language`,
	menuType: `${APP_PREFERENCE_PREFIX}menu-type`,
	navigationMode: `${APP_PREFERENCE_PREFIX}navigation-mode`,
	themeColor: `${APP_PREFERENCE_PREFIX}theme-color`,
	themeMode: `${APP_PREFERENCE_PREFIX}theme-mode`,
	timeZone: `${APP_PREFERENCE_PREFIX}time-zone`,
	userTableDensity: `${APP_PREFERENCE_PREFIX}user-table-density`,
} as const;

const supportedLanguageCodes = ["zh-CN", "zh-TW", "en", "ko-KR"] as const;
const themeModes = ["light", "dark", "system"] as const;
const themeColors = [
	"#1677ff",
	"#f5222d",
	"#fa8c16",
	"#52c41a",
	"#13c2c2",
	"#722ed1",
] as const;
const navigationModes = ["side", "top", "mixed"] as const;
const menuTypes = [
	"single",
	"serviceGrid",
	"twoColumn",
	"splitServiceGrid",
] as const;
const userTableDensities = ["large", "middle", "small"] as const;
const supportedCurrencies = [
	"CNY",
	"USD",
	"EUR",
	"JPY",
	"KRW",
	"TWD",
	"HKD",
] as const;
export const supportedTimeZones = (() => {
	try {
		return [...new Set(["UTC", ...Intl.supportedValuesOf("timeZone")])];
	} catch {
		return ["UTC"];
	}
})();

export type SupportedLanguageCode = (typeof supportedLanguageCodes)[number];
export type ThemeMode = (typeof themeModes)[number];
export type ThemeColor = (typeof themeColors)[number];
export type NavigationMode = (typeof navigationModes)[number];
export type MenuType = (typeof menuTypes)[number];
export type CurrencyCode = (typeof supportedCurrencies)[number];
export type TimeZone = string;
export type UserTableDensity = (typeof userTableDensities)[number];

const preferenceChangeListeners = new Set<() => void>();

function resolveSystemTimeZone() {
	try {
		const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
		return timeZone && supportedTimeZones.includes(timeZone) ? timeZone : "UTC";
	} catch {
		return "UTC";
	}
}

export const defaultPreferences = {
	colorBlindMode: false,
	currency: "CNY",
	footerVisible: true,
	menuType: "single",
	navigationMode: "side",
	themeColor: "#1677ff",
	themeMode: "light",
	timeZone: resolveSystemTimeZone(),
	userTableDensity: "middle",
} as const satisfies {
	colorBlindMode: boolean;
	currency: CurrencyCode;
	footerVisible: boolean;
	menuType: MenuType;
	navigationMode: NavigationMode;
	themeColor: ThemeColor;
	themeMode: ThemeMode;
	timeZone: TimeZone;
	userTableDensity: UserTableDensity;
};

function isAllowedValue<T extends string>(
	value: string | null,
	allowedValues: readonly T[],
): value is T {
	return (
		value !== null &&
		allowedValues.some((allowedValue) => allowedValue === value)
	);
}

function readValue<T extends string>(
	key: string,
	allowedValues: readonly T[],
	fallback: T,
): T {
	try {
		const value = globalThis.localStorage.getItem(key);
		return isAllowedValue(value, allowedValues) ? value : fallback;
	} catch {
		return fallback;
	}
}

function readOptionalValue<T extends string>(
	key: string,
	allowedValues: readonly T[],
): T | undefined {
	try {
		const value = globalThis.localStorage.getItem(key);
		return isAllowedValue(value, allowedValues) ? value : undefined;
	} catch {
		return undefined;
	}
}

function writeValue(key: string, value: string) {
	try {
		globalThis.localStorage.setItem(key, value);
		preferenceChangeListeners.forEach((listener) => listener());
	} catch {
		// Preferences are optional; storage failures must not block the application.
	}
}

export function clearStoredPreferences() {
	try {
		const keysToRemove: string[] = [];

		for (let index = 0; index < globalThis.localStorage.length; index += 1) {
			const key = globalThis.localStorage.key(index);

			if (key?.startsWith(APP_PREFERENCE_PREFIX)) {
				keysToRemove.push(key);
			}
		}

		keysToRemove.forEach((key) => globalThis.localStorage.removeItem(key));
		preferenceChangeListeners.forEach((listener) => listener());
	} catch {
		// Preferences are optional; storage failures must not block the application.
	}
}

export function subscribeToPreferenceChanges(listener: () => void) {
	preferenceChangeListeners.add(listener);
	return () => {
		preferenceChangeListeners.delete(listener);
	};
}

function readBooleanValue(key: string, fallback: boolean) {
	return (
		readValue(key, ["false", "true"], fallback ? "true" : "false") === "true"
	);
}

function writeBooleanValue(key: string, value: boolean) {
	writeValue(key, value ? "true" : "false");
}

export function isSupportedLanguageCode(
	value: string,
): value is SupportedLanguageCode {
	return isAllowedValue(value, supportedLanguageCodes);
}

export function readLanguagePreference() {
	return readOptionalValue(
		preferenceStorageKeys.language,
		supportedLanguageCodes,
	);
}

export function writeLanguagePreference(value: SupportedLanguageCode) {
	writeValue(preferenceStorageKeys.language, value);
}

export function readColorBlindModePreference() {
	return readBooleanValue(
		preferenceStorageKeys.colorBlindMode,
		defaultPreferences.colorBlindMode,
	);
}

export function writeColorBlindModePreference(value: boolean) {
	writeBooleanValue(preferenceStorageKeys.colorBlindMode, value);
}

export function readCurrencyPreference() {
	return readValue(
		preferenceStorageKeys.currency,
		supportedCurrencies,
		defaultPreferences.currency,
	);
}

export function writeCurrencyPreference(value: CurrencyCode) {
	writeValue(preferenceStorageKeys.currency, value);
}

export function readFooterVisiblePreference() {
	return readBooleanValue(
		preferenceStorageKeys.footerVisible,
		defaultPreferences.footerVisible,
	);
}

export function writeFooterVisiblePreference(value: boolean) {
	writeBooleanValue(preferenceStorageKeys.footerVisible, value);
}

export function readThemeModePreference() {
	return readValue(
		preferenceStorageKeys.themeMode,
		themeModes,
		defaultPreferences.themeMode,
	);
}

export function writeThemeModePreference(value: ThemeMode) {
	writeValue(preferenceStorageKeys.themeMode, value);
}

export function readThemeColorPreference() {
	return readValue(
		preferenceStorageKeys.themeColor,
		themeColors,
		defaultPreferences.themeColor,
	);
}

export function writeThemeColorPreference(value: ThemeColor) {
	writeValue(preferenceStorageKeys.themeColor, value);
}

export function readTimeZonePreference() {
	return readValue(
		preferenceStorageKeys.timeZone,
		supportedTimeZones,
		defaultPreferences.timeZone,
	);
}

export function writeTimeZonePreference(value: TimeZone) {
	if (supportedTimeZones.includes(value)) {
		writeValue(preferenceStorageKeys.timeZone, value);
	}
}

export function readNavigationModePreference() {
	return readValue(
		preferenceStorageKeys.navigationMode,
		navigationModes,
		defaultPreferences.navigationMode,
	);
}

export function writeNavigationModePreference(value: NavigationMode) {
	writeValue(preferenceStorageKeys.navigationMode, value);
}

export function readMenuTypePreference() {
	return readValue(
		preferenceStorageKeys.menuType,
		menuTypes,
		defaultPreferences.menuType,
	);
}

export function writeMenuTypePreference(value: MenuType) {
	writeValue(preferenceStorageKeys.menuType, value);
}

export function readUserTableDensityPreference() {
	return readValue(
		preferenceStorageKeys.userTableDensity,
		userTableDensities,
		defaultPreferences.userTableDensity,
	);
}

export function writeUserTableDensityPreference(value: UserTableDensity) {
	writeValue(preferenceStorageKeys.userTableDensity, value);
}
