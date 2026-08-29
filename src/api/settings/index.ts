import { request } from "../client";
import type { PlatformSettings, UpdatePlatformSettingsInput } from "./types";

export * from "./types";
export { platformSettingsLimits } from "./config";

export const platformSettingsQueryKey = ["platform-settings"] as const;

export function getPlatformSettings(signal?: AbortSignal) {
	return request<PlatformSettings>("/platform/settings", { signal });
}

export function updatePlatformSettings(input: UpdatePlatformSettingsInput) {
	return request<PlatformSettings>("/platform/settings", {
		method: "PATCH",
		body: input,
	});
}
