import type { MenuItemType, MenuListReq, MenuTreeReq } from "./types";
import { request } from "#src/utils/request";

export * from "./types";

/**
 * 获取权限列表
 */
export function fetchMenuList(data: MenuListReq) {
	return request
		.post("/api/system/permissions/list", { json: data })
		.json<ApiResponse<{ items: MenuItemType[] }>>();
}

/**
 * 获取权限树（按模块分组）
 */
export function fetchMenuTree(data: MenuTreeReq = {}) {
	return request
		.post("/api/system/permissions/list", { json: data })
		.json<ApiResponse<{ tree: MenuItemType[] }>>();
}
