import type { UserInfoType } from "#src/api/auth";

import { fetchCurrentUser } from "#src/api/auth";

import { create } from "zustand";

const initialState = {
	id: 0,
	avatar: "",
	username: "",
	email: "",
	phoneNumber: "",
	description: "",
	roles: [],
};

type UserState = UserInfoType;

interface UserAction {
	getUserInfo: () => Promise<UserInfoType>
	reset: () => void
};

export const useUserStore = create<UserState & UserAction>()(

	set => ({
		...initialState,

		getUserInfo: async () => {
			const response = await fetchCurrentUser();

			if (response.code !== 0 || !response.data) {
				throw new Error(response.msg || "获取用户信息失败");
			}

			const userInfo = response.data;
			set(userInfo);
			return userInfo;
		},

		reset: () => {
			return set({
				...initialState,
			});
		},

	}),

);
