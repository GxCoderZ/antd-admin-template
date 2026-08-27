import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
	PlatformSettings,
	PlatformSettingsValues,
} from "../src/api/settings";
import { findFakeRoute } from "./route-helpers";

async function settingsApi() {
	const { default: routes } = await import("./settings.fake");
	const read = findFakeRoute(routes, "get", "/platform/settings");
	const update = findFakeRoute(routes, "patch", "/platform/settings");
	const current = () =>
		(read({}) as { code: number; data: PlatformSettings }).data;
	return { current, read, update };
}

beforeEach(() => {
	vi.resetModules();
});

describe("Fake system settings", () => {
	it("returns all required configuration groups and persists changes", async () => {
		const { current, read, update } = await settingsApi();
		const initial = current();
		expect(initial).toMatchObject({
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
				passwordMinLength: 8,
			},
			notifications: {
				announcementsEnabled: true,
				inboxEnabled: true,
				unreadReminderEnabled: true,
				retentionDays: 90,
			},
			version: 1,
		});
		const input = {
			...initial,
			general: { ...initial.general, siteTitle: "  New Console  " },
			security: { ...initial.security, loginAccess: "adminOnly" },
			notifications: { ...initial.notifications, retentionDays: 30 },
			expectedVersion: initial.version,
		};
		expect(update({ body: input })).toMatchObject({
			code: 0,
			data: { version: 2 },
		});
		expect(read({})).toMatchObject({
			code: 0,
			data: {
				general: { siteTitle: "New Console" },
				security: { loginAccess: "adminOnly" },
				notifications: { retentionDays: 30 },
				version: 2,
			},
		});
	});

	it("rejects stale writes without overwriting the latest settings", async () => {
		const { current, update } = await settingsApi();
		const initial = current();
		const input = { ...initial, expectedVersion: initial.version };
		expect(update({ body: input })).toMatchObject({ code: 0 });
		expect(update({ body: input })).toMatchObject({ code: 409 });
		expect(current().version).toBe(2);
	});

	it.each([undefined, null, {}, { expectedVersion: 1 }])(
		"rejects malformed body %j",
		async (body) => {
			const { current, update } = await settingsApi();
			const before = structuredClone(current());
			expect(update({ body })).toMatchObject({ code: 422 });
			expect(current()).toEqual(before);
		},
	);

	it.each<[keyof PlatformSettingsValues, string, unknown]>([
		["general", "siteTitle", "  "],
		["general", "shortTitle", "A".repeat(17)],
		["general", "logoDataUrl", "https://example.com/logo.png"],
		["general", "logoDataUrl", "data:image/svg+xml;base64,PHN2Zz4="],
		["security", "loginAccess", "unknown"],
		["security", "captchaEnabled", "true"],
		["security", "passwordMinLength", 3],
		["security", "passwordRequirements", ["unknown"]],
		["security", "loginFailureLimit", 0],
		["security", "lockoutMinutes", -1],
		["security", "idleTimeoutMinutes", 0],
		["security", "maintenanceEndsAt", "invalid-date"],
		["notifications", "retentionDays", 0],
		["notifications", "retentionDays", 2.5],
	])("rejects invalid %s.%s", async (section, field, value) => {
		const { current, update } = await settingsApi();
		const initial = current();
		const input = { ...initial, expectedVersion: initial.version };
		const group = input[section];
		expect(
			update({
				body: {
					...input,
					[String(section)]: { ...group, [String(field)]: value },
				},
			}),
		).toMatchObject({ code: 422 });
		expect(current()).toEqual(initial);
	});

	it("requires a message for enabled maintenance and accepts a recovery timestamp", async () => {
		const { current, update } = await settingsApi();
		const initial = current();
		const security = {
			...initial.security,
			maintenanceEnabled: true,
			maintenanceMessage: "",
			maintenanceEndsAt: "2026-09-01T08:00:00.000Z",
		};
		expect(
			update({
				body: { ...initial, security, expectedVersion: initial.version },
			}),
		).toMatchObject({ code: 422 });
		security.maintenanceMessage = "Scheduled maintenance";
		expect(
			update({
				body: { ...initial, security, expectedVersion: initial.version },
			}),
		).toMatchObject({ code: 0, data: { security } });
	});
});
