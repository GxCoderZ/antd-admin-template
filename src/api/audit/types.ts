export interface AuditItemType {
	id: number
	operator: string
	module: string
	action: string
	target: string
	result: "success" | "failed"
	ip: string
	created_at: string
}

export interface AuditListReq {
	page: number
	page_size: number
	keyword?: string
	module?: string
	result?: "success" | "failed"
	sort?: "operator" | "module" | "action" | "result" | "created_at"
	order?: "ascend" | "descend"
}
