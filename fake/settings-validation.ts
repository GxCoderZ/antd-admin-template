import {
	passwordRequirements,
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

function integer(value: unknown, range: { min: number; max: number }) {
	return (
		typeof value === "number" &&
		Number.isInteger(value) &&
		value >= range.min &&
		value <= range.max
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
		(security.maintenanceEndsAt === null ||
			(typeof security.maintenanceEndsAt === "string" &&
				/^\d{4}-\d{2}-\d{2}T/.test(security.maintenanceEndsAt) &&
				Number.isFinite(Date.parse(security.maintenanceEndsAt)))) &&
		typeof security.captchaEnabled === "boolean" &&
		integer(security.passwordMinLength, limits.passwordMinLength) &&
		Array.isArray(security.passwordRequirements) &&
		security.passwordRequirements.every((item: unknown) =>
			passwordRequirements.some((requirement) => requirement === item),
		) &&
		new Set(security.passwordRequirements).size ===
			security.passwordRequirements.length &&
		integer(security.loginFailureLimit, limits.loginFailureLimit) &&
		integer(security.lockoutMinutes, limits.lockoutMinutes) &&
		integer(security.idleTimeoutMinutes, limits.idleTimeoutMinutes) &&
		typeof security.forceInitialPasswordChange === "boolean" &&
		typeof notifications.announcementsEnabled === "boolean" &&
		typeof notifications.inboxEnabled === "boolean" &&
		typeof notifications.unreadReminderEnabled === "boolean" &&
		integer(notifications.retentionDays, limits.retentionDays)
	);
}
