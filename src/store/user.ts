import type { UserInfoType } from "#src/api/auth/types";

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
	setUserInfo: (userInfo: UserInfoType) => void
	reset: () => void
};

export const useUserStore = create<UserState & UserAction>()(

	set => ({
		...initialState,

		setUserInfo: userInfo => set(userInfo),

		reset: () => set(initialState),

	}),

);
