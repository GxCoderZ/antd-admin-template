import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PlatformSettingsValues } from "../src/api/settings";
import authRoutes from "./auth.fake";
import settingsRoutes from "./settings.fake";
import { findFakeRoute } from "./route-helpers";
import { resetSettingsState } from "./settings-state";
import { setSignedIn } from "./store";

type DeepPartial<T> = {
	[Key in keyof T]?: T[Key] extends object ? DeepPartial<T[Key]> : T[Key];
};

const login = findFakeRoute(authRoutes, "post", "/platform/auth/login");
const updateSettings = findFakeRoute(
	settingsRoutes,
	"patch",
	"/platform/settings",
);

function configureSettings(values: DeepPartial<PlatformSettingsValues>) {
	const current = findFakeRoute(
		settingsRoutes,
		"get",
		"/platform/settings",
	)({}) as { data: PlatformSettingsValues & { version: number } };
	const { version, ...currentValues } = current.data;
	updateSettings({
		body: {
			...currentValues,
			general: { ...current.data.general, ...values.general },
			security: { ...current.data.security, ...values.security },
			notifications: {
				...current.data.notifications,
				...values.notifications,
			},
			expectedVersion: version,
		},
	});
}

beforeEach(() => {
	vi.useRealTimers();
	resetSettingsState();
	setSignedIn(false);
});

describe("Fake auth settings integration", () => {
	it("limits preview login to the demo administrator when requested", () => {
		configureSettings({ security: { loginAccess: "adminOnly" } });

		expect(
			login({ body: { identifier: "operator", password: "demo" } }),
		).toMatchObject({ code: 403 });
		expect(
			login({ body: { identifier: "admin", password: "demo" } }),
		).toMatchObject({ code: 0 });
	});

	it("keeps a demo administrator recovery path while paused", () => {
		configureSettings({ security: { loginAccess: "disabled" } });

		expect(
			login({ body: { identifier: "operator", password: "demo" } }),
		).toMatchObject({ code: 403 });
		expect(
			login({ body: { identifier: "admin", password: "demo" } }),
		).toMatchObject({ code: 0 });
	});

	it("uses the configured maintenance message for blocked preview users", () => {
		configureSettings({
			security: {
				maintenanceEnabled: true,
				maintenanceMessage: "Preview maintenance",
			},
		});

		expect(
			login({ body: { identifier: "operator", password: "demo" } }),
		).toMatchObject({ code: 403, msg: "Preview maintenance" });
		expect(
			login({ body: { identifier: "admin", password: "demo" } }),
		).toMatchObject({ code: 0 });
	});
});
