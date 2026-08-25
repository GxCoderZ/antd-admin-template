export interface AccountRoleType {
	id: number
	name: string
}

export interface AccountProfileType {
	id: number
	username: string
	display_name: string
	email: string
	avatar: string
	roles: AccountRoleType[]
	created_at: string
}

export interface AccountSessionType {
	id: string
	current: boolean
	device: string
	ip: string
	language: string
	time_zone: string
	created_at: string
	expires_at: string
}

export interface AccountProfileUpdateReq {
	display_name: string
	email: string
}

export interface AccountAvatarUpdateReq {
	avatar_data: string
	mime_type: string
	size: number
}

export interface AccountPasswordChangeReq {
	current_password: string
	new_password: string
}

export interface AccountSessionRevokeReq {
	session_id: string
}

export interface AccountSessionRevokeResp {
	revoked_sessions: number
}
