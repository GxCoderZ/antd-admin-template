import type { MenuItemType } from "#src/layout/layout-menu/types";
import type { AppRouteRecordRaw } from "#src/router/types";

import { create } from "zustand";

interface AccessState {
	// 路由菜单
	wholeMenus: MenuItemType[]
	// 有权限的 React Router 路由
	routeList: AppRouteRecordRaw[]
	// 扁平化后的路由，路由 id 作为索引 key
	flatRouteList: Record<string, AppRouteRecordRaw>
	// 用户拥有的权限码集合（从菜单树提取）
	permissions: Set<string>
	// 是否获取到权限
	isAccessChecked: boolean
}

export interface AccessSnapshot {
	wholeMenus: MenuItemType[]
	routeList: AppRouteRecordRaw[]
	flatRouteList: Record<string, AppRouteRecordRaw>
	permissions: Set<string>
}

const initialState: AccessState = {
	wholeMenus: [],
	routeList: [],
	flatRouteList: {},
	permissions: new Set<string>(),
	isAccessChecked: false,
};

interface AccessAction {
	setAccessSnapshot: (snapshot: AccessSnapshot) => AccessState
	reset: () => void
};

export const useAccessStore = create<AccessState & AccessAction>()(set => ({
	...initialState,

	setAccessSnapshot: (snapshot) => {
		const newState = {
			...snapshot,
			isAccessChecked: true,
		};
		set(newState);
		return newState;
	},

	reset: () => set({
		wholeMenus: [],
		routeList: [],
		flatRouteList: {},
		permissions: new Set<string>(),
		isAccessChecked: false,
	}),
}));
