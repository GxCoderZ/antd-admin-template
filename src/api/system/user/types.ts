export type UserStatus = 1 | 2 | 3;
export type UserSortField = "username" | "display_name" | "email" | "status" | "created_at";

export interface UserItemType {
	id: number
	uuid: string
	username: string
	display_name: string
	email: string
	status: UserStatus
	created_at: string
}

export interface UserListReq {
	page: number
	page_size: number
	keyword?: string
	status?: UserStatus
	sort?: UserSortField
	order?: "ascend" | "descend"
	role_id?: number
}

export interface UserCreateReq {
	username: string
	password: string
	display_name?: string
	email?: string
	role_ids?: number[]
}

export interface UserUpdateReq {
	id: number
	username?: string
	display_name?: string
	email?: string
	status?: UserStatus
}

/**
 * 删除用户请求
 */
export interface UserDeleteReq {
	id: number
}

/**
 * 用户详情请求
 */
export interface UserDetailReq {
	id: number
}

/**
 * 重置密码请求
 */
export interface UserResetPasswordReq {
	id: number
	new_password?: string
}

export interface UserResetPasswordResp {
	temporary_password: string
}

export interface UserForceLogoutReq {
	id: number
}

export interface UserForceLogoutResp {
	revoked_sessions: number
}

/**
 * 绑定用户角色请求
 */
export interface BindUserRolesReq {
	user_id: number // 用户ID
	role_ids: number[] // 角色ID列表
}

/**
 * 获取用户角色请求
 */
export interface GetUserRolesReq {
	user_id: number // 用户ID
}

/**
 * 获取用户角色响应
 */
export interface GetUserRolesResp {
	role_ids: number[] // 角色ID列表
}
