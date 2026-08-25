/**
 * 权限项（后端返回的字段）
 */
export interface MenuItemType {
	id: number // 权限ID
	code: string // 权限标识（如：system:user:view）
	name: string // 权限名称
	module: string // 所属模块
	status: number // 状态（1=启用 2=禁用）
	remark: string // 备注

	created_at: string // 创建时间
}

/**
 * 权限列表请求参数
 */
export interface MenuListReq {
	module?: string // 所属模块：空=全部
	status?: number // 状态：0=全部 1=启用 2=禁用
}

/**
 * 权限树请求参数（按模块分组）
 */
export interface MenuTreeReq {
	status?: number // 状态：0=全部 1=启用 2=禁用
}

export interface PermissionGroupType {
	children: PermissionGroupType[] | null
	module: string
	permissions: MenuItemType[]
}
