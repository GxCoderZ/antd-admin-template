import { defineFakeRoute } from "vite-plugin-fake-server/client";

import {
	changeAccountPassword,
	deleteAccountAvatar,
	getAccountByToken,
	getAccountProfile,
	isUserIdentityTaken,
	listAccountSessions,
	revokeAccountSession,
	revokeOtherAccountSessions,
	updateAccountAvatar,
	updateAccountProfile,
} from "./store";
import { resultError, resultSuccess } from "./utils";

function getBearerToken(headers: Record<string, string | string[] | undefined>) {
	const authorization = headers.authorization;
	const value = Array.isArray(authorization) ? authorization[0] : authorization;
	return value?.replace(/^Bearer\s+/i, "");
}

function getUserId(headers: Record<string, string | string[] | undefined>) {
	return getAccountByToken(getBearerToken(headers)).user.id;
}

function isValidEmail(value: string) {
	const atIndex = value.indexOf("@");
	const dotIndex = value.lastIndexOf(".");
	return atIndex > 0 && dotIndex > atIndex + 1 && dotIndex < value.length - 1 && !value.includes(" ");
}

export default defineFakeRoute([
	{
		url: "/account/profile",
		method: "post",
		response: ({ headers }) => {
			const profile = getAccountProfile(getUserId(headers));
			return profile ? resultSuccess(profile) : resultError("账号不存在", 404);
		},
	},
	{
		url: "/account/profile/update",
		method: "post",
		response: ({ body, headers }) => {
			const userId = getUserId(headers);
			const current = getAccountProfile(userId);
			const displayName = String(body.display_name ?? "").trim();
			const email = String(body.email ?? "").trim();
			if (!current)
				return resultError("账号不存在", 404);
			if (!displayName || displayName.length > 40)
				return resultError("显示名称长度应为 1 到 40 个字符");
			if (!isValidEmail(email))
				return resultError("邮箱格式不正确");
			if (isUserIdentityTaken(current.username, email, userId))
				return resultError("邮箱已存在", 409);
			return resultSuccess(updateAccountProfile(userId, displayName, email));
		},
	},
	{
		url: "/account/avatar/update",
		method: "post",
		response: ({ body, headers }) => {
			const mimeType = String(body.mime_type ?? "");
			const size = Number(body.size);
			const avatarData = String(body.avatar_data ?? "");
			if (!["image/jpeg", "image/png", "image/webp"].includes(mimeType))
				return resultError("仅支持 JPG、PNG 或 WebP 图片");
			if (!size || size > 2 * 1024 * 1024)
				return resultError("头像大小不能超过 2 MB");
			if (!avatarData.startsWith(`data:${mimeType};base64,`))
				return resultError("头像数据格式不正确");
			const avatar = updateAccountAvatar(getUserId(headers), avatarData);
			return avatar ? resultSuccess({ avatar }) : resultError("账号不存在", 404);
		},
	},
	{
		url: "/account/avatar/delete",
		method: "post",
		response: ({ headers }) => deleteAccountAvatar(getUserId(headers)) ? resultSuccess({}) : resultError("账号不存在", 404),
	},
	{
		url: "/account/password/change",
		method: "post",
		response: ({ body, headers }) => {
			const currentPassword = String(body.current_password ?? "");
			const newPassword = String(body.new_password ?? "");
			if (newPassword.length < 12)
				return resultError("新密码至少需要 8 位");
			if (currentPassword === newPassword)
				return resultError("新密码不能与当前密码相同");
			return changeAccountPassword(getUserId(headers), currentPassword, newPassword) ? resultSuccess({}) : resultError("当前密码不正确", 403);
		},
	},
	{
		url: "/account/sessions/list",
		method: "post",
		response: ({ headers }) => resultSuccess(listAccountSessions(getUserId(headers))),
	},
	{
		url: "/account/sessions/revoke",
		method: "post",
		response: ({ body, headers }) => {
			const result = revokeAccountSession(getUserId(headers), String(body.session_id));
			return result ? resultSuccess(result) : resultError("当前会话不可撤销或会话不存在", 403);
		},
	},
	{
		url: "/account/sessions/revoke-others",
		method: "post",
		response: ({ headers }) => resultSuccess(revokeOtherAccountSessions(getUserId(headers))),
	},
]);
