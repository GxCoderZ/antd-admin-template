export interface PermissionTreeNode {
	module: string
	module_name: string
	permissions: PermissionNodeItem[]
}

export interface PermissionNodeItem {
	id: number
	name: string
	code: string
}
