export type PlatformDepartmentStatus = "active" | "disabled";

export interface PlatformDepartment {
	children: PlatformDepartment[];
	code: string;
	createdAt: string;
	id: string;
	memberCount: number;
	name: string;
	parentId: string | null;
	positionCount: number;
	status: PlatformDepartmentStatus;
	updatedAt: string;
}

export interface ListPlatformDepartmentsInput {
	name?: string;
	status?: PlatformDepartmentStatus;
}

export interface CreatePlatformDepartmentInput {
	code: string;
	name: string;
	parentId?: string | null;
	status: PlatformDepartmentStatus;
}

export type UpdatePlatformDepartmentInput = CreatePlatformDepartmentInput;
