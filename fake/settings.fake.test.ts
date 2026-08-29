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
				maintenanceMessage: "系统维护中，请稍后再试。",
			},
			notifications: {
				announcementsEnabled: true,
				inboxEnabled: true,
			},
			version: 1,
		});
		const { version, ...initialValues } = initial;
		const input = {
			...initialValues,
			general: { ...initial.general, siteTitle: "  New Console  " },
			security: { ...initial.security, loginAccess: "adminOnly" },
			notifications: { ...initial.notifications, inboxEnabled: false },
			expectedVersion: version,
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
				notifications: { inboxEnabled: false },
				version: 2,
			},
		});
	});

	it("rejects stale writes without overwriting the latest settings", async () => {
		const { current, update } = await settingsApi();
		const initial = current();
		const { version, ...initialValues } = initial;
		const input = { ...initialValues, expectedVersion: version };
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
		["security", "maintenanceEnabled", "true"],
		["notifications", "inboxEnabled", "true"],
	])("rejects invalid %s.%s", async (section, field, value) => {
		const { current, update } = await settingsApi();
		const initial = current();
		const { version, ...initialValues } = initial;
		const input = { ...initialValues, expectedVersion: version };
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

	it("requires a message for enabled maintenance", async () => {
		const { current, update } = await settingsApi();
		const initial = current();
		const { version, ...initialValues } = initial;
		const security = {
			...initial.security,
			maintenanceEnabled: true,
			maintenanceMessage: "",
		};
		expect(
			update({
				body: { ...initialValues, security, expectedVersion: version },
			}),
		).toMatchObject({ code: 422 });
		security.maintenanceMessage = "Scheduled maintenance";
		expect(
			update({
				body: { ...initialValues, security, expectedVersion: version },
			}),
		).toMatchObject({ code: 0, data: { security } });
	});

	it("rejects removed policy-only settings instead of storing unused switches", async () => {
		const { current, update } = await settingsApi();
		const initial = current();
		const { version, ...initialValues } = initial;
		expect(
			update({
				body: {
					...initialValues,
					security: {
						...initial.security,
						captchaEnabled: true,
					},
					expectedVersion: version,
				},
			}),
		).toMatchObject({ code: 422 });
		expect(
			update({
				body: {
					...initialValues,
					notifications: {
						...initial.notifications,
						retentionDays: 30,
					},
					expectedVersion: version,
				},
			}),
		).toMatchObject({ code: 422 });
		expect(current()).toEqual(initial);
	});
});
