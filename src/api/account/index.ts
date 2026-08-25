import { request } from "../client";
import type {
	ChangePlatformAccountPasswordInput,
	PlatformAccount,
	PlatformAccountNotifications,
	PlatformAccountSecurity,
	UpdatePlatformAccountInput,
	UpdatePlatformAccountSecurityInput,
} from "./types";

export * from "./types";

export const platformAccountQueryKey = ["platform-account"] as const;
export const platformAccountNotificationsQueryKey = [
	...platformAccountQueryKey,
	"notifications",
] as const;
export const platformAccountSecurityQueryKey = [
	...platformAccountQueryKey,
	"security",
] as const;

export function getPlatformAccount(signal?: AbortSignal) {
	return request<PlatformAccount>("/platform/account", { signal });
}

export function updatePlatformAccount(input: UpdatePlatformAccountInput) {
	return request<PlatformAccount>("/platform/account", {
		method: "PATCH",
		body: input,
	});
}

export function changePlatformAccountPassword(
	input: ChangePlatformAccountPasswordInput,
) {
	return request<void>("/platform/account/password", {
		method: "POST",
		body: input,
	});
}

function readFileAsDataUrl(file: File) {
	return new Promise<string>((resolve, reject) => {
		const reader = new FileReader();
		reader.addEventListener("load", () => {
			if (typeof reader.result === "string") {
				resolve(reader.result);
				return;
			}
			reject(new Error("Unable to read avatar file"));
		});
		reader.addEventListener("error", () =>
			reject(reader.error ?? new Error("Unable to read avatar file")),
		);
		reader.readAsDataURL(file);
	});
}

export async function uploadPlatformAccountAvatar(file: File) {
	const dataUrl = await readFileAsDataUrl(file);
	return request<void>("/platform/account/avatar", {
		method: "PUT",
		body: { dataUrl },
	});
}

export function getPlatformAccountNotifications(signal?: AbortSignal) {
	return request<PlatformAccountNotifications>(
		"/platform/account/notifications",
		{ signal },
	);
}

export function updatePlatformAccountNotifications(
	input: PlatformAccountNotifications,
) {
	return request<PlatformAccountNotifications>(
		"/platform/account/notifications",
		{
			method: "PATCH",
			body: input,
		},
	);
}

export function getPlatformAccountSecurity(signal?: AbortSignal) {
	return request<PlatformAccountSecurity>("/platform/account/security", {
		signal,
	});
}

export function updatePlatformAccountSecurity(
	input: UpdatePlatformAccountSecurityInput,
) {
	return request<PlatformAccountSecurity>("/platform/account/security", {
		method: "PATCH",
		body: input,
	});
}
