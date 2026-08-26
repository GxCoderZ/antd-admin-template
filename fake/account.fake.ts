import { defineFakeRoute } from "vite-plugin-fake-server/client";

import type {
	PlatformAccountNotifications,
	PlatformAccountSecurity,
	UpdatePlatformAccountInput,
} from "../src/api/account";
import { userAvatarDataUrls, users } from "./store";
import { readFakeBody } from "./route-helpers";
import { resultError, resultSuccess } from "./utils";

const accountDetails = {
	address: "西湖区工专路 77 号",
	bio: "专注于企业级产品设计与研发",
	city: "hangzhou",
	country: "china",
	phoneAreaCode: "+86",
	phoneNumber: "18100000000",
	province: "zhejiang",
};

let accountNotifications: PlatformAccountNotifications = {
	systemMessage: true,
	todoTask: true,
	userMessage: true,
};

let accountSecurity: PlatformAccountSecurity = {
	backupEmail: "backup@example.com",
	securityPhoneAreaCode: "+86",
	securityPhoneNumber: "13900001234",
};

function currentAccount() {
	const user = users[0]!;
	return {
		...accountDetails,
		createdAt: user.createdAt,
		displayName: user.displayName,
		email: user.email,
		id: user.id,
		roles: user.roles,
		username: user.username,
		version: user.version,
	};
}

export default defineFakeRoute([
	{
		url: "/platform/account",
		method: "get",
		response: () => resultSuccess(currentAccount()),
	},
	{
		url: "/platform/account",
		method: "patch",
		response: ({ body }) => {
			const input = readFakeBody<UpdatePlatformAccountInput>(body);
			const requiredValues = [
				input.address,
				input.bio,
				input.city,
				input.country,
				input.displayName,
				input.email,
				input.phoneAreaCode,
				input.phoneNumber,
				input.province,
			];
			if (
				requiredValues.some(
					(value) => typeof value !== "string" || value.trim().length === 0,
				)
			) {
				return resultError("All account profile fields are required", 422);
			}

			users[0]!.displayName = input.displayName.trim();
			users[0]!.email = input.email.trim();
			Object.assign(accountDetails, {
				address: input.address.trim(),
				bio: input.bio.trim(),
				city: input.city,
				country: input.country,
				phoneAreaCode: input.phoneAreaCode.trim(),
				phoneNumber: input.phoneNumber.trim(),
				province: input.province,
			});
			users[0]!.updatedAt = new Date().toISOString();
			users[0]!.version = (users[0]!.version ?? 0) + 1;
			return resultSuccess(currentAccount());
		},
	},
	{
		url: "/platform/account/notifications",
		method: "get",
		response: () => resultSuccess(accountNotifications),
	},
	{
		url: "/platform/account/security",
		method: "get",
		response: () => resultSuccess(accountSecurity),
	},
	{
		url: "/platform/account/security",
		method: "patch",
		response: ({ body }) => {
			const input = readFakeBody<PlatformAccountSecurity>(body);
			if (
				typeof input.backupEmail !== "string" ||
				!input.backupEmail.includes("@") ||
				typeof input.securityPhoneAreaCode !== "string" ||
				input.securityPhoneAreaCode.trim().length === 0 ||
				typeof input.securityPhoneNumber !== "string" ||
				input.securityPhoneNumber.trim().length === 0
			) {
				return resultError("Valid security contact details are required", 422);
			}
			accountSecurity = {
				backupEmail: input.backupEmail.trim(),
				securityPhoneAreaCode: input.securityPhoneAreaCode.trim(),
				securityPhoneNumber: input.securityPhoneNumber.trim(),
			};
			return resultSuccess(accountSecurity);
		},
	},
	{
		url: "/platform/account/notifications",
		method: "patch",
		response: ({ body }) => {
			const input = readFakeBody<PlatformAccountNotifications>(body);
			if (
				typeof input.systemMessage !== "boolean" ||
				typeof input.todoTask !== "boolean" ||
				typeof input.userMessage !== "boolean"
			) {
				return resultError("All notification preferences are required", 422);
			}
			accountNotifications = { ...input };
			return resultSuccess(accountNotifications);
		},
	},
	{
		url: "/platform/account/password",
		method: "post",
		response: ({ body }) =>
			body.currentPassword && body.newPassword
				? resultSuccess(null)
				: resultError("Both password fields are required", 422),
	},
	{
		url: "/platform/account/avatar",
		method: "put",
		response: ({ body }) => {
			const dataUrl = (body as { dataUrl?: unknown }).dataUrl;
			if (typeof dataUrl !== "string" || !dataUrl.startsWith("data:image/")) {
				return resultError("A valid avatar image is required", 422);
			}
			const user = users[0]!;
			userAvatarDataUrls[user.id] = dataUrl;
			user.updatedAt = new Date().toISOString();
			user.version = (user.version ?? 0) + 1;
			return resultSuccess(null);
		},
	},
	{
		url: "/platform/account/avatar",
		method: "delete",
		response: () => {
			const user = users[0]!;
			delete userAvatarDataUrls[user.id];
			user.updatedAt = new Date().toISOString();
			user.version = (user.version ?? 0) + 1;
			return resultSuccess(null);
		},
	},
]);
