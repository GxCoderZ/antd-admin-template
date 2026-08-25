export type LoginResultStatus = "success" | "failed";

export interface LoginLogItemType {
	id: number
	identifier: string
	result: LoginResultStatus
	device: string
	ip: string
	language: string
	time_zone: string
	created_at: string
}

export interface LoginLogListReq {
	page: number
	page_size: number
	keyword?: string
	result?: LoginResultStatus
	sort?: "identifier" | "result" | "ip" | "created_at"
	order?: "ascend" | "descend"
}
