import type { PlatformUserRole } from "../types";

export interface PlatformAccount {
	address: string;
	bio: string;
	city: string;
	country: string;
	createdAt: string;
	displayName: string;
	email: string;
	id: string;
	phoneAreaCode: string;
	phoneNumber: string;
	province: string;
	roles: PlatformUserRole[];
	username: string;
	version?: number;
}

export interface UpdatePlatformAccountInput {
	address: string;
	bio: string;
	city: string;
	country: string;
	displayName: string;
	email: string;
	expectedVersion?: number;
	phoneAreaCode: string;
	phoneNumber: string;
	province: string;
}

export interface ChangePlatformAccountPasswordInput {
	currentPassword: string;
	newPassword: string;
}

export interface PlatformAccountNotifications {
	systemMessage: boolean;
	todoTask: boolean;
	userMessage: boolean;
}

export interface PlatformAccountSecurity {
	backupEmail: string;
	securityPhoneAreaCode: string;
	securityPhoneNumber: string;
}

export type UpdatePlatformAccountSecurityInput = PlatformAccountSecurity;
