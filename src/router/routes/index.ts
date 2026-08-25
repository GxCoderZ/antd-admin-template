import type { AppRouteRecordRaw, RouteFileModule } from "#src/router/types";

import { forgotPasswordPath, loginPath } from "#src/router/extra-info";
import { ascending } from "#src/router/utils/ascending";
import { mergeRouteModules } from "#src/router/utils/merge-route-modules";
import { traverseTreeValues } from "#src/utils/tree";
import { coreRoutes } from "./core";

// 外部路由文件
export const externalRouteFiles: RouteFileModule = import.meta.glob("./external/**/*.ts", { eager: true });
// 前端静态路由文件
export const staticRouteFiles: RouteFileModule = import.meta.glob("./static/**/*.ts", { eager: true });

/**
 * 外部路由 1. 不进行权限校验， 2. 不会触发请求，例如用户信息接口
 * @example "privacy-policy", "terms-of-service" 等
 */
export const externalRoutes: AppRouteRecordRaw[] = mergeRouteModules(externalRouteFiles);

/** 静态路由 */
export const staticRoutes: AppRouteRecordRaw[] = mergeRouteModules(staticRouteFiles);

/**
 * 基本路由列表，包含核心路由、外部路由和业务静态路由
 */
const baseRoutes = ascending([
	...coreRoutes,
	...externalRoutes,
	...staticRoutes,
]);

/** 权限路由列表（用于菜单生成和权限过滤） */
const accessRoutes = [
	...staticRoutes,
];

/**
 * 路由白名单 1. 不进行权限校验， 2. 不会触发请求，例如用户信息接口
 * @example "privacy-policy", "terms-of-service" 等
 */
const whiteRouteNames = [
	loginPath,
	forgotPasswordPath,
	...traverseTreeValues(externalRoutes, route => route.path),
];

export {
	accessRoutes,
	baseRoutes,
	whiteRouteNames,
};
