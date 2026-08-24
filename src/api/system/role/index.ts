import type { BindRolePermissionsReq, GetRolePermissionsReq, GetRolePermissionsResp, PermissionTreeNode, RoleCreateReq, RoleItemType, RoleListReq, RoleUpdateReq } from "./types";
import { request } from "#src/utils/request";

export * from "./types";

/**
 * 获取角色列表
 * POST /api/system/roles/list
 */
export function fetchRoleList(data: RoleListReq) {
	return request
		.post("/api/system/roles/list", { json: data })
		.json<ApiResponse<RoleItemType[] | { items: RoleItemType[], total: number }>>();
}

/**
 * 创建角色
 * POST /api/system/roles/create
 */
export function fetchAddRoleItem(data: RoleCreateReq) {
	return request
		.post("/api/system/roles/create", { json: data })
		.json<ApiResponse<{ id: number }>>();
}

/**
 * 更新角色
 * POST /api/system/roles/update
 */
export function fetchUpdateRoleItem(data: RoleUpdateReq) {
	return request
		.post("/api/system/roles/update", { json: data })
		.json<ApiResponse<void>>();
}

/**
 * 删除角色
 * POST /api/system/roles/delete
 */
export function fetchDeleteRoleItem(id: number) {
	return request
		.post("/api/system/roles/delete", { json: { id } })
		.json<ApiResponse<void>>();
}

/**
 * 绑定角色权限
 * POST /api/system/roles/permissions/bind
 */
export function fetchBindRoleMenus(data: BindRolePermissionsReq) {
	return request
		.post("/api/system/roles/permissions/bind", { json: data })
		.json<ApiResponse<void>>();
}

/**
 * 获取角色的权限ID列表
 * POST /api/system/roles/permissions/get
 */
export function fetchMenuByRoleId(data: GetRolePermissionsReq) {
	return request
		.post("/api/system/roles/permissions/get", { json: data })
		.json<ApiResponse<GetRolePermissionsResp>>();
}

/**
 * 获取权限树（用于角色分配权限）
 * POST /api/system/permissions/list
 */
export function fetchRoleMenu() {
	return request
		.post("/api/system/permissions/list", { json: {} })
		.json<ApiResponse<PermissionTreeNode[] | { tree: PermissionTreeNode[] }>>();
}
