export interface LoginParams {
	username: string
	password: string
}

export interface LoginResult {
	access_token: string
	refresh_token: string
	expires_in: number
}

export interface UserInfoType {
	id: number
	uuid?: string
	avatar: string
	username: string
	nickname?: string
	email: string
	phone?: string
	phoneNumber?: string
	description?: string
	roles: string[]
}
