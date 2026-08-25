import { request, type ApiPage } from "../client";
import type { PlatformAvatarData } from "../types";
import type {
	CreatePlatformUserInput,
	ListPlatformUsersInput,
	PlatformUserDetail,
	ResetPlatformUserPasswordInput,
	ResetPlatformUserPasswordResult,
	UpdatePlatformUserInput,
} from "./types";

export * from "./types";

export const platformUsersQueryKey = ["platform-users"] as const;
export const platformUserDetailQueryKey = (userId: string) =>
	[...platformUsersQueryKey, "detail", userId] as const;
export const platformUserAvatarQueryKey = (
	userId: string,
	revision: number | string,
) => [...platformUsersQueryKey, "avatar", userId, revision] as const;

export function listPlatformUsers(
	input: ListPlatformUsersInput,
	signal?: AbortSignal,
) {
	const { pageSize, ...query } = input;
	return request<ApiPage<PlatformUserDetail>>("/platform/users", {
		query: { ...query, page_size: pageSize },
		signal,
	}).then(({ items, page, page_size, total }) => ({
		items,
		page,
		pageSize: page_size,
		total,
	}));
}

export function getPlatformUser(userId: string, signal?: AbortSignal) {
	return request<PlatformUserDetail>(`/platform/users/${userId}`, { signal });
}

export function getPlatformUserAvatar(userId: string, signal?: AbortSignal) {
	return request<PlatformAvatarData>(`/platform/users/${userId}/avatar`, {
		signal,
	});
}

export function createPlatformUser(input: CreatePlatformUserInput) {
	return request<PlatformUserDetail>("/platform/users", {
		method: "POST",
		body: input,
	});
}

export function updatePlatformUser({
	input,
	userId,
}: {
	input: UpdatePlatformUserInput;
	userId: string;
}) {
	return request<PlatformUserDetail>(`/platform/users/${userId}`, {
		method: "PATCH",
		body: input,
	});
}

export function deletePlatformUser(userId: string) {
	return request<void>(`/platform/users/${userId}`, { method: "DELETE" });
}

export function resetPlatformUserPassword({
	input,
	userId,
}: {
	input: ResetPlatformUserPasswordInput;
	userId: string;
}) {
	return request<ResetPlatformUserPasswordResult>(
		`/platform/users/${userId}/password`,
		{ method: "POST", body: input },
	);
}

export function forceLogoutPlatformUser(userId: string) {
	return request<void>(`/platform/users/${userId}/logout`, { method: "POST" });
}
