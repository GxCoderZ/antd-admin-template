import { fetchCurrentUser } from "#src/api/auth";
import { fetchUserPermissions } from "#src/api/rbac";
import { useCurrentRoute } from "#src/hooks/use-current-route";
import { hideLoading } from "#src/plugins/hide-loading";
import { setupLoading } from "#src/plugins/loading";
import { defaultLoginPath, exception403Path, exception404Path, loginPath } from "#src/router/extra-info";
import { whiteRouteNames } from "#src/router/routes";
import { createAccessSnapshot } from "#src/router/utils/create-access-snapshot";
import { useAccessStore } from "#src/store/access";
import { useAuthStore } from "#src/store/auth";
import { useUserStore } from "#src/store/user";

import { useEffect } from "react";
import { matchRoutes, Navigate, useLocation } from "react-router";

/**
 * @zh 路由白名单 1. 不进行权限校验， 2. 不会触发请求，例如用户信息接口
 * @en Routes whitelist 1. No permission verification, 2. Will not trigger requests, such as user information interface
 * @example "privacy-policy", "terms-of-service" and so on.
 */
const noLoginWhiteList = Array.from(whiteRouteNames).filter(item => item !== loginPath);

interface AuthGuardProps {
	children?: React.ReactNode
}

/**
 * @zh AuthGuard 组件，用于权限验证，代码的顺序很重要，不要随意调整
 * @en AuthGuard component, used for permission verification. The order of the code is important and should not be arbitrarily adjusted
 */
export function AuthGuard({ children }: AuthGuardProps) {
	const currentRoute = useCurrentRoute();
	const { pathname } = useLocation();
	const isLogin = useAuthStore(state => Boolean(state.token));
	const isAuthorized = useUserStore(state => Boolean(state.id));
	const setUserInfo = useUserStore(state => state.setUserInfo);
	const { setAccessSnapshot, isAccessChecked, routeList, permissions } = useAccessStore();

	const isPathInNoLoginWhiteList = noLoginWhiteList.includes(pathname);

	/**
	 * @zh 异步获取用户信息和路由配置
	 * @en Fetch user information and route configuration asynchronously
	 */
	useEffect(() => {
		async function fetchUserInfoAndRoutes() {
			/**
			 * @zh 登录跳转，防止闪烁
			 * @en Login redirect, prevent flicker
			 */
			setupLoading();

			/**
			 * @zh 1. 先获取用户信息
			 * @en 1. Fetch user information first
			 */
			const userResponse = await fetchCurrentUser();
			if (userResponse.code !== 0 || !userResponse.data) {
				throw new Error(userResponse.msg || "获取用户信息失败");
			}
			setUserInfo(userResponse.data);

			let userPermissions: string[] = [];

			// 获取用户权限码列表
			try {
				const permResp = await fetchUserPermissions();
				if (permResp.code === 0 && permResp.data) {
					userPermissions = permResp.data.permissions;
				}
			}
			catch (e) {
				console.error("获取权限失败", e);
			}

			setAccessSnapshot(createAccessSnapshot(userPermissions));
		}
		/**
		 * @zh 只有在以下条件下才执行获取用户信息和路由的逻辑
		 * 1. 非路由白名单
		 * 2. 已登录
		 * 3. 未获取到用户信息或路由信息
		 *
		 * @en The logic of obtaining user information and routes is only executed under the following conditions
		 * 1. Not in the route whitelist
		 * 2. Logged in
		 * 3. Unable to obtain user information or route information
		 *
		 */
		if (!whiteRouteNames.includes(pathname) && isLogin && !isAuthorized && !isAccessChecked) {
			fetchUserInfoAndRoutes();
		}
	}, [pathname, isLogin, isAuthorized, isAccessChecked, setAccessSnapshot, setUserInfo]);

	/**
	 * @zh 路由白名单
	 * @en Route whitelist
	 * @see {noLoginWhiteList}
	 */
	if (isPathInNoLoginWhiteList) {
		hideLoading();
		return children;
	}

	/**
	 * @zh 未登录条件下的处理逻辑
	 * @en Processing logic under unlogged conditions
	 */
	/* --------------- Start ------------------ */
	if (!isLogin) {
		hideLoading();
		// 未登录且目标页不是登录页，直接跳转到登录页
		if (pathname !== loginPath) {
			return (
				<Navigate
					to={defaultLoginPath}
					replace
				/>
			);
		}
		// 未登录且目标页是登录页，保留登录页
		else {
			return children;
		}
	}
	/* --------------- End ------------------ */

	/**
	 * @zh 登录条件下的处理逻辑
	 * @en Processing logic under logged conditions
	 */
	/* --------------- Start ------------------ */

	/**
	 * @zh 已登录条件下，匹配 login 路由，跳转到首页
	 * 放到用户信息前，因为 login 路由不会请求用户信息，所以放在前面判断
	 *
	 * @en Under logged conditions, match the login route and jump to the home page
	 * Put it before user information, because the login route will not request user information, so put it in front to judge
	 */
	if (pathname === loginPath) {
		return (
			<Navigate
				to={import.meta.env.VITE_BASE_HOME_PATH}
				replace
			/>
		);
	}

	/**
	 * @zh 等待获取用户信息
	 * @en  Waiting for user information to be obtained
	 */
	if (!isAuthorized) {
		return null;
	}
	/**
	 * @zh 等待获取路由信息
	 * @en Waiting for route information to be obtained
	 */
	if (!isAccessChecked) {
		return null;
	}

	/**
	 * @zh 隐藏加载动画
	 * @en Hide loading animation
	 */
	hideLoading();

	/**
	 * @zh 如果是根路由则跳转到首页（获取完用户信息之后跳转到默认首页，防止请求两次用户信息接口）
	 * @en If it is the root route, jump to the home page (jump to the default home page after obtaining user information to prevent requesting twice for user information interface)
	 * @zh pathname 返回的是相对 import.meta.env.BASE_URL 的路径，所以这里是相对于 BASE_URL 的根路由 "/"
	 * @en pathname returns the path relative to import.meta.env.BASE_URL, so here is the root route "/" relative to BASE_URL
	 */
	if (pathname === "/") {
		return (
			<Navigate
				to={import.meta.env.VITE_BASE_HOME_PATH}
				replace
			/>
		);
	}

	/* --------------- End ------------------ */

	/**
	 * @zh 路由权限校验逻辑
	 * @en Route permission verification logic
	 */
	const routePermission = currentRoute?.handle?.permission;
	const ignoreAccess = currentRoute?.handle?.ignoreAccess;

	/**
	 * @zh 忽略权限校验
	 * @en Ignore permission verification
	 */
	if (ignoreAccess === true) {
		return children;
	}

	const matches = matchRoutes(
		routeList,
		pathname,
		/**
		 * @zh pathname 返回的是相对 import.meta.env.BASE_URL 的路径，所以不需要指定第三个参数 basename 了
		 * @en pathname returns the path relative to import.meta.env.BASE_URL, so there is no need to specify the third parameter basename
		 */
	) ?? [];

	const hasChildren = matches[matches.length - 1]?.route?.children?.filter(item => !item.index)?.length;
	/**
	 * @zh 如果当前路由有子路由，则跳转到 404 页面
	 * @en If the current route has sub-routes, jump to the 404 page
	 */
	if (hasChildren && hasChildren > 0) {
		return (
			<Navigate
				to={exception404Path}
				replace
			/>
		);
	}

	/**
	 * @zh 权限校验逻辑：
	 * 路由配置了 permission 且用户没有该权限码，则跳转到 403 页面
	 * 未配置 permission 的路由，所有登录用户均可访问
	 *
	 * @en Permission verification logic:
	 * If the route has a permission code and the user does not have it, jump to the 403 page
	 * Routes without permission are accessible to all logged-in users
	 */
	if (routePermission && !permissions.has(routePermission)) {
		return (
			<Navigate
				to={exception403Path}
				replace
			/>
		);
	}

	return children;
}
/**
 * 验证路由跳转是否正确的步骤：
 * 1. 未登录情况下，输入 login 路由
 * 2. 未登录情况下，输入非 login 路由
 * 3. 已登录情况下，使用系统的退出登录，然后再次登录
 * 4. 任选一个非 home 页面，使用开发者工具清除 localStorage，刷新页面之后进行登录
 * 5. 已登录情况下，输入 login 路由
 * 6. 已登录情况下，输入非 login 路由
 * 7. 已登录情况下，输入 http://localhost:3333 跳转到 /home 路由，用户接口发送一次
 * 8. 已登录情况下，输入 http://localhost:3333/ 跳转到 /home 路由，用户接口发送一次
 * 9. 已登录情况下，输入 http://localhost:3333/home 跳转到 /home 路由，用户接口发送一次
 */
