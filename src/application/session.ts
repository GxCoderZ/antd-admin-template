import { useAccessStore } from "#src/store/access";
import { useAuthStore } from "#src/store/auth";
import { useTabsStore } from "#src/store/tabs";
import { useUserStore } from "#src/store/user";

export function clearSession() {
	useAuthStore.getState().reset();
	useUserStore.getState().reset();
	useAccessStore.getState().reset();
	useTabsStore.getState().resetTabs();
}
