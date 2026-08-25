import type {
	BindUserRolesReq,
	GetUserRolesReq,
	GetUserRolesResp,
	UserCreateReq,
	UserDeleteReq,
	UserDetailReq,
	UserForceLogoutReq,
	UserForceLogoutResp,
	UserItemType,
	UserListReq,
	UserResetPasswordReq,
	UserResetPasswordResp,
	UserUpdateReq,
} from "./types";
import { request } from "#src/utils/request";

export * from "./types";

// ========== 用户管理 CRUD ==========

/**
 * 获取用户列表
 * POST /api/system/users/list
 */
export function fetchUserList(data: UserListReq) {
	return request
		.post("/api/system/users/list", { json: data })
		.json<ApiListResponse<UserItemType>>();
}

/**
 * 创建用户
 * POST /api/system/users/create
 */
export function fetchCreateUser(data: UserCreateReq) {
	return request
		.post("/api/system/users/create", { json: data })
		.json<ApiResponse<UserItemType>>();
}

/**
 * 获取用户详情
 * POST /api/system/users/detail
 */
export function fetchUserDetail(data: UserDetailReq) {
	return request
		.post("/api/system/users/detail", { json: data })
		.json<ApiResponse<UserItemType>>();
}

/**
 * 更新用户
 * POST /api/system/users/update
 */
export function fetchUpdateUser(data: UserUpdateReq) {
	return request
		.post("/api/system/users/update", { json: data })
		.json<ApiResponse<void>>();
}

/**
 * 删除用户
 * POST /api/system/users/delete
 */
export function fetchDeleteUser(data: UserDeleteReq) {
	return request
		.post("/api/system/users/delete", { json: data })
		.json<ApiResponse<void>>();
}

/**
 * 重置用户密码
 * POST /api/system/users/reset-password
 */
export function fetchResetUserPassword(data: UserResetPasswordReq) {
	return request
		.post("/api/system/users/reset-password", { json: data })
		.json<ApiResponse<UserResetPasswordResp>>();
}

export function fetchForceLogoutUser(data: UserForceLogoutReq) {
	return request
		.post("/api/system/users/force-logout", { json: data })
		.json<ApiResponse<UserForceLogoutResp>>();
}

// ========== 用户角色关联 ==========

/**
 * 获取用户的角色列表
 * POST /api/system/user-roles/get
 */
export function fetchUserRoles(data: GetUserRolesReq) {
	return request
		.post("/api/system/user-roles/get", { json: data })
		.json<ApiResponse<GetUserRolesResp>>();
}

/**
 * 为用户绑定角色
 * POST /api/system/user-roles/bind
 */
export function fetchBindUserRoles(data: BindUserRolesReq) {
	return request
		.post("/api/system/user-roles/bind", { json: data })
		.json<ApiResponse<void>>();
}
