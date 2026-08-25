import { beforeEach, describe, expect, it } from "vitest";

import accountRoutes from "./account.fake";
import userRoutes from "./users.fake";

interface TestRequest {
	body?: unknown;
	params?: Record<string, string>;
}

interface TestRoute {
	method?: string;
	response?: (request: TestRequest) => unknown;
	url: string;
}

const accountFakeRoutes = accountRoutes as unknown as TestRoute[];
const userFakeRoutes = userRoutes as unknown as TestRoute[];

function route(routes: TestRoute[], method: string, url: string) {
	const match = routes.find(
		(item) => item.method === method && item.url === url,
	)?.response;

	if (!match) {
		throw new Error(`Missing ${method.toUpperCase()} ${url} Fake route`);
	}
	return match;
}

const uploadAvatar = route(
	accountFakeRoutes,
	"put",
	"/platform/account/avatar",
);
const deleteAvatar = route(
	accountFakeRoutes,
	"delete",
	"/platform/account/avatar",
);
const getAvatar = route(
	userFakeRoutes,
	"get",
	"/platform/users/:userId/avatar",
);

describe("Fake account avatar", () => {
	beforeEach(() => {
		deleteAvatar({});
	});

	it("keeps uploaded avatar data for the current preview session", () => {
		const dataUrl = "data:image/png;base64,aW1hZ2U=";

		uploadAvatar({ body: { dataUrl } });

		expect(getAvatar({ params: { userId: "user-admin" } })).toEqual({
			code: 0,
			data: { dataUrl },
			msg: "OK",
		});
	});

	it("removes uploaded avatar data", () => {
		uploadAvatar({
			body: { dataUrl: "data:image/png;base64,aW1hZ2U=" },
		});
		deleteAvatar({});

		expect(getAvatar({ params: { userId: "user-admin" } })).toEqual({
			code: 0,
			data: { dataUrl: null },
			msg: "OK",
		});
	});
});
