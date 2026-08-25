import type { PlatformPermission } from "../types";

interface PlatformSessionUser {
	id: string;
	username: string;
	email: string;
	mustChangePassword?: boolean;
}

export interface PlatformSession {
	permissions: PlatformPermission[];
	user: PlatformSessionUser;
}

export interface PlatformLoginInput {
	identifier: string;
	password: string;
	timeZone?: string;
}
