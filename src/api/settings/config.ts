import type { PasswordRequirement } from "./types";

export const passwordRequirements: readonly PasswordRequirement[] = [
	"lowercase",
	"uppercase",
	"number",
	"symbol",
];

export const platformSettingsLimits = {
	siteTitle: 64,
	shortTitle: 16,
	browserTitle: 64,
	copyright: 128,
	logoBytes: 1024 * 1024,
	maintenanceMessage: 200,
	passwordMinLength: { min: 8, max: 64 },
	loginFailureLimit: { min: 1, max: 20 },
	lockoutMinutes: { min: 1, max: 1440 },
	idleTimeoutMinutes: { min: 1, max: 1440 },
	retentionDays: { min: 1, max: 365 },
} as const;
