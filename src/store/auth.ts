import type { LoginParams } from "#src/api/auth";

import { fetchLogin } from "#src/api/auth";
import { useAccessStore } from "#src/store/access";
import { useTabsStore } from "#src/store/tabs";
import { useUserStore } from "#src/store/user";
import { getAppNamespace } from "#src/utils/get-app-namespace";

import { create } from "zustand";
import { persist } from "zustand/middleware";

const initialState = {
	token: "",
	refreshToken: "",
};

type AuthState = typeof initialState;

interface AuthAction {
	login: (loginPayload: LoginParams) => Promise<void>
	logout: () => Promise<void>
	reset: () => void
}

export const useAuthStore = create<AuthState & AuthAction>()(

	persist((set, get) => ({
		...initialState,

		login: async (loginPayload) => {
			const response = await fetchLogin(loginPayload);
			if (response.code !== 0 || !response.data) {
				throw new Error(response.msg || "登录失败");
			}
			set({
				token: response.data.access_token,
				refreshToken: response.data.refresh_token || "",
			});
		},

		logout: async () => {
			get().reset();
		},

		reset: () => {
			set({
				...initialState,
			});
			useUserStore.getState().reset();
			useAccessStore.getState().reset();
			useTabsStore.getState().resetTabs();
		},

	}), { name: getAppNamespace("access-token") }),

);
