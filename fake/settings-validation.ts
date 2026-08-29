import {
	platformSettingsLimits as limits,
	type UpdatePlatformSettingsInput,
} from "../src/api/settings";

function record(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown, max: number, required = true) {
	return (
		typeof value === "string" &&
		value.trim().length <= max &&
		(!required || value.trim().length > 0)
	);
}

function exactKeys(value: Record<string, unknown>, keys: readonly string[]) {
	const allowed = new Set(keys);
	const actualKeys = Object.keys(value);
	return (
		actualKeys.length === keys.length &&
		actualKeys.every((key) => allowed.has(key))
	);
}

function logo(value: unknown) {
	if (value === null) return true;
	if (typeof value !== "string") return false;
	const match =
		/^data:image\/(?:png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
	if (!match || !match[1] || match[1].length % 4 !== 0) return false;
	const payload = match[1];
	const padding = payload.endsWith("==") ? 2 : payload.endsWith("=") ? 1 : 0;
	return (payload.length * 3) / 4 - padding <= limits.logoBytes;
}

export function isSettingsUpdate(
	value: unknown,
): value is UpdatePlatformSettingsInput {
	if (
		!record(value) ||
		!Number.isInteger(value.expectedVersion) ||
		Number(value.expectedVersion) < 1
	)
		return false;
	const { general, security, notifications } = value;
	if (!record(general) || !record(security) || !record(notifications))
		return false;
	return (
		exactKeys(value, [
			"expectedVersion",
			"general",
			"security",
			"notifications",
		]) &&
		exactKeys(general, [
			"siteTitle",
			"shortTitle",
			"logoDataUrl",
			"browserTitle",
			"copyright",
		]) &&
		exactKeys(security, [
			"loginAccess",
			"maintenanceEnabled",
			"maintenanceMessage",
		]) &&
		exactKeys(notifications, ["announcementsEnabled", "inboxEnabled"]) &&
		text(general.siteTitle, limits.siteTitle) &&
		text(general.shortTitle, limits.shortTitle) &&
		logo(general.logoDataUrl) &&
		text(general.browserTitle, limits.browserTitle) &&
		text(general.copyright, limits.copyright) &&
		typeof security.loginAccess === "string" &&
		["all", "adminOnly", "disabled"].includes(security.loginAccess) &&
		typeof security.maintenanceEnabled === "boolean" &&
		text(
			security.maintenanceMessage,
			limits.maintenanceMessage,
			security.maintenanceEnabled,
		) &&
		typeof notifications.announcementsEnabled === "boolean" &&
		typeof notifications.inboxEnabled === "boolean"
	);
}
