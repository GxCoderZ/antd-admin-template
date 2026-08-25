import { request } from "../client";
import type { PlatformLoginInput, PlatformSession } from "./types";

export * from "./types";

export const platformSessionQueryKey = ["platform-session"] as const;

export function getPlatformSession(signal?: AbortSignal) {
	return request<PlatformSession>("/platform/auth/session", { signal });
}

export function loginPlatform(input: PlatformLoginInput) {
	return request<PlatformSession>("/platform/auth/login", {
		method: "POST",
		body: input,
	});
}

export function logoutPlatform() {
	return request<void>("/platform/auth/logout", { method: "POST" });
}
