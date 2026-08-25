import { getAppNamespace } from "#src/utils/get-app-namespace";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AuthTokens {
	token: string
	refreshToken: string
}

const initialState: AuthTokens = {
	token: "",
	refreshToken: "",
};

type AuthState = AuthTokens;

interface AuthAction {
	setTokens: (tokens: AuthTokens) => void
	reset: () => void
}

export const useAuthStore = create<AuthState & AuthAction>()(

	persist(set => ({
		...initialState,

		setTokens: tokens => set(tokens),

		reset: () => set(initialState),

	}), { name: getAppNamespace("access-token") }),

);
