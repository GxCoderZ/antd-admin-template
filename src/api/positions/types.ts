export type PlatformPositionStatus = "active" | "disabled";

export interface PlatformPosition {
	code: string;
	createdAt: string;
	departmentId: string;
	departmentName: string;
	id: string;
	memberCount: number;
	name: string;
	status: PlatformPositionStatus;
	updatedAt: string;
}

export interface ListPlatformPositionsInput {
	code?: string;
	departmentId?: string;
	name?: string;
	order?: "asc" | "desc";
	page: number;
	pageSize: number;
	sort?:
		"code" | "department" | "member_count" | "name" | "status" | "updated_at";
	status?: PlatformPositionStatus;
}

export interface CreatePlatformPositionInput {
	code: string;
	departmentId: string;
	name: string;
	status: PlatformPositionStatus;
}

export type UpdatePlatformPositionInput = CreatePlatformPositionInput;
