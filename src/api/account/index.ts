import type {
	AccountAvatarUpdateReq,
	AccountPasswordChangeReq,
	AccountProfileType,
	AccountProfileUpdateReq,
	AccountSessionRevokeReq,
	AccountSessionRevokeResp,
	AccountSessionType,
} from "./types";

import { request } from "#src/utils/request";

export * from "./types";

function fileToDataUrl(file: File) {
	return new Promise<string>((resolve, reject) => {
		const reader = new FileReader();
		reader.addEventListener("load", () => resolve(String(reader.result)));
		reader.addEventListener("error", () => reject(reader.error));
		reader.readAsDataURL(file);
	});
}

export function fetchAccountProfile() {
	return request
		.post("/api/account/profile", { json: {} })
		.json<ApiResponse<AccountProfileType>>();
}

export function fetchUpdateAccountProfile(data: AccountProfileUpdateReq) {
	return request
		.post("/api/account/profile/update", { json: data })
		.json<ApiResponse<AccountProfileType>>();
}

export async function fetchUploadAccountAvatar(file: File) {
	const data: AccountAvatarUpdateReq = {
		avatar_data: await fileToDataUrl(file),
		mime_type: file.type,
		size: file.size,
	};
	return request
		.post("/api/account/avatar/update", { json: data })
		.json<ApiResponse<{ avatar: string }>>();
}

export function fetchDeleteAccountAvatar() {
	return request
		.post("/api/account/avatar/delete", { json: {} })
		.json<ApiResponse<void>>();
}

export function fetchChangeAccountPassword(data: AccountPasswordChangeReq) {
	return request
		.post("/api/account/password/change", { json: data })
		.json<ApiResponse<void>>();
}

export function fetchAccountSessions() {
	return request
		.post("/api/account/sessions/list", { json: {} })
		.json<ApiResponse<AccountSessionType[]>>();
}

export function fetchRevokeAccountSession(data: AccountSessionRevokeReq) {
	return request
		.post("/api/account/sessions/revoke", { json: data })
		.json<ApiResponse<AccountSessionRevokeResp>>();
}

export function fetchRevokeOtherAccountSessions() {
	return request
		.post("/api/account/sessions/revoke-others", { json: {} })
		.json<ApiResponse<AccountSessionRevokeResp>>();
}
