/**
 * 角色列表项（后端返回的字段）
 */
export interface RoleItemType {
	id: number
	key: string
	name: string // 角色名称
	is_system: boolean // 是否系统角色（不可删除）
	status: number // 状态：1=启用 2=禁用
	user_count: number // 已分配用户数
	permission_codes: string[]
	remark: string // 备注
	created_at: string // 创建时间
}

/**
 * 角色列表请求参数
 */
export interface RoleListReq {
	page: number
	page_size: number
	name?: string // 角色名称（模糊搜索）
	status?: number // 状态：0=全部 1=启用 2=禁用
	sort?: "name" | "status" | "user_count" | "created_at"
	order?: "ascend" | "descend"
}

/**
 * 创建角色请求
 */
export interface RoleCreateReq {
	key?: string
	name: string // 角色名称
	remark?: string // 备注
}

/**
 * 更新角色请求
 */
export interface RoleUpdateReq {
	id: number // 角色ID
	key?: string
	name: string // 角色名称
	status: number // 状态：1=启用 2=禁用
	remark?: string // 备注
}

/**
 * 绑定角色权限请求
 */
export interface BindRolePermissionsReq {
	role_id: number // 角色ID
	permission_ids: number[] // 权限ID列表
}

/**
 * 获取角色权限请求
 */
export interface GetRolePermissionsReq {
	role_id: number // 角色ID
}

/**
 * 获取角色权限响应
 */
export interface GetRolePermissionsResp {
	permission_ids: number[] // 权限ID列表
}

/**
 * 权限项（permissions/tree 接口中 permissions 数组的元素）
 */
export interface PermissionItem {
	id: number
	code: string
	name: string
	type: number
	module: string
	status: number
	remark: string
	created_at: string
}

/**
 * 权限树节点（按模块分组，permissions/tree 接口返回格式）
 */
export interface PermissionTreeNode {
	module: string
	permissions: PermissionItem[]
	children: PermissionTreeNode[] | null
}
