import { describe, expect, it } from "vitest";

import accountRoutes from "./account.fake";

interface TestRequest {
	body?: unknown;
}

interface TestRoute {
	method?: string;
	response?: (request: TestRequest) => unknown;
	url: string;
}

const routes = accountRoutes as unknown as TestRoute[];

function route(method: string, url: string) {
	const response = routes.find(
		(item) => item.method === method && item.url === url,
	)?.response;

	if (!response) {
		throw new Error(`Missing ${method.toUpperCase()} ${url} Fake route`);
	}
	return response;
}

describe("Fake account settings", () => {
	it("persists profile and notification changes in the preview session", () => {
		const updateAccount = route("patch", "/platform/account");
		const getNotifications = route("get", "/platform/account/notifications");
		const updateNotifications = route(
			"patch",
			"/platform/account/notifications",
		);

		const accountResult = updateAccount({
			body: {
				address: "西湖区工专路 77 号",
				bio: "通用后台模板",
				city: "hangzhou",
				country: "china",
				displayName: "Platform Admin",
				email: "admin@example.com",
				phoneAreaCode: "+86",
				phoneNumber: "18100000000",
				province: "zhejiang",
			},
		});
		expect(accountResult).toMatchObject({
			code: 0,
			data: { bio: "通用后台模板", city: "hangzhou" },
		});

		updateNotifications({
			body: { systemMessage: false, todoTask: true, userMessage: true },
		});
		expect(getNotifications({})).toEqual({
			code: 0,
			data: { systemMessage: false, todoTask: true, userMessage: true },
			msg: "OK",
		});
	});

	it("does not expose production-style session management", () => {
		expect(routes.some(({ url }) => url.includes("/sessions"))).toBe(false);
	});

	it("stores security contacts separately from profile contact details", () => {
		const getAccount = route("get", "/platform/account");
		const getSecurity = route("get", "/platform/account/security");
		const updateSecurity = route("patch", "/platform/account/security");

		updateSecurity({
			body: {
				backupEmail: "security@example.com",
				securityPhoneAreaCode: "+86",
				securityPhoneNumber: "13900001234",
			},
		});

		expect(getSecurity({})).toEqual({
			code: 0,
			data: {
				backupEmail: "security@example.com",
				securityPhoneAreaCode: "+86",
				securityPhoneNumber: "13900001234",
			},
			msg: "OK",
		});
		expect(getAccount({})).toMatchObject({
			data: { phoneAreaCode: "+86", phoneNumber: "18100000000" },
		});
	});
});
