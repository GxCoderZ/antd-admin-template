import type { MenuItemType } from "#src/layout/layout-menu/types";
import type { AppRouteRecordRaw } from "#src/router/types";

import { rootRoute, router } from "#src/router";
import { baseRoutes } from "#src/router/routes";
import { ascending } from "#src/router/utils/ascending";
import { flattenRoutes } from "#src/router/utils/flatten-routes";
import { generateMenuItemsFromRoutes } from "#src/router/utils/generate-menu-items-from-routes";
import { generateRoutesByFrontend } from "#src/router/utils/generate-routes-from-frontend";
import { getAppNamespace } from "#src/utils/get-app-namespace";

import { create } from "zustand";
import { persist } from "zustand/middleware";

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

const initialState: AccessState = {
	wholeMenus: generateMenuItemsFromRoutes(baseRoutes),
	routeList: baseRoutes,
	flatRouteList: flattenRoutes(baseRoutes),
	permissions: new Set<string>(),
	isAccessChecked: false,
};

interface AccessAction {
	setAccessStore: (routes: AppRouteRecordRaw[], permissions?: string[]) => AccessState
	reset: () => void
};

export const useAccessStore = create<AccessState & AccessAction>()(
	persist((set, _get) => ({
		...initialState,

		setAccessStore: (_routes, userPermissions) => {
			// 所有路由已在 baseRoutes 中，不需要合并
			const flatRouteList = flattenRoutes(baseRoutes);
			const permittedRoutes = generateRoutesByFrontend(baseRoutes, userPermissions ?? []);
			const wholeMenus = generateMenuItemsFromRoutes(ascending(permittedRoutes));

			// 直接使用后端返回的权限数组
			const permissions = userPermissions ? new Set<string>(userPermissions) : new Set<string>();

			const newState = {
				wholeMenus,
				routeList: baseRoutes,
				flatRouteList,
				permissions,
				isAccessChecked: true,
			};
			set(() => newState);
			return newState;
		},

		reset: () => {
			/* 移除动态路由 */
			router._internalSetRoutes(rootRoute);
			set(initialState);
		},
	}), {
		name: getAppNamespace("access"),
		// 只持久化菜单和路由数据，不持久化 isAccessChecked
		// 这样每次刷新页面都会重新获取最新的菜单数据
		partialize: state => ({
			wholeMenus: state.wholeMenus,
			routeList: state.routeList,
			flatRouteList: state.flatRouteList,
			permissions: Array.from(state.permissions), // Set 转数组存储
		}),
		// 反序列化时将数组转回 Set
		merge: (persistedState: any, currentState) => ({
			...currentState,
			...persistedState,
			permissions: new Set(persistedState.permissions || []),
		}),
	}),
);
