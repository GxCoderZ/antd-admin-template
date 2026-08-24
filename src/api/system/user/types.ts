// ========== 用户管理相关类型 ==========

/**
 * 用户项
 */
export interface UserItemType {
	id: number
	uuid: string
	username: string
	status: number // 1=启用 2=禁用
	created_at: string
}

/**
 * 用户列表请求
 */
export interface UserListReq {
	page: number
	page_size: number
	username?: string // 用户名（模糊搜索）
	status?: number // 0=全部 1=启用 2=禁用
}

/**
 * 创建用户请求
 */
export interface UserCreateReq {
	username: string
	password: string
}

/**
 * 更新用户请求
 */
export interface UserUpdateReq {
	id: number
	username: string
	status: number
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
	new_password: string
}

// ========== 用户角色关联相关类型 ==========

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
