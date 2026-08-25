import { clearSession } from "#src/application/session";
import { useAccessStore } from "#src/store/access";
import { useAuthStore } from "#src/store/auth";
import { useTabsStore } from "#src/store/tabs";
import { useUserStore } from "#src/store/user";

describe("session lifecycle", () => {
	it("clears every session-owned store", () => {
		useAuthStore.getState().setTokens({ token: "access", refreshToken: "refresh" });
		useUserStore.getState().setUserInfo({
			id: 1,
			avatar: "avatar.png",
			username: "admin",
			email: "admin@example.com",
			phoneNumber: "13800000000",
			description: "Administrator",
			roles: ["admin"],
		});
		useAccessStore.getState().setAccessSnapshot({
			wholeMenus: [],
			routeList: [],
			flatRouteList: {},
			permissions: new Set(["system:user:view"]),
		});
		useTabsStore.setState({ activeKey: "/system/user" });

		clearSession();

		expect(useAuthStore.getState()).toMatchObject({ token: "", refreshToken: "" });
		expect(useUserStore.getState()).toMatchObject({ id: 0, username: "", roles: [] });
		expect(useAccessStore.getState().isAccessChecked).toBe(false);
		expect(useAccessStore.getState().permissions.size).toBe(0);
		expect(useTabsStore.getState().activeKey).toBe("");
	});
});
