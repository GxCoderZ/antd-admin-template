import { beforeEach, describe, expect, it } from "vitest";

import accountRoutes from "./account.fake";
import { findFakeRoute } from "./route-helpers";
import userRoutes from "./users.fake";

const uploadAvatar = findFakeRoute(
	accountRoutes,
	"put",
	"/platform/account/avatar",
);
const deleteAvatar = findFakeRoute(
	accountRoutes,
	"delete",
	"/platform/account/avatar",
);
const getAvatar = findFakeRoute(
	userRoutes,
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
