export type PlatformAnnouncementStatus = "draft" | "published";

export interface PlatformAnnouncement {
	content: string;
	createdAt: string;
	id: string;
	status: PlatformAnnouncementStatus;
	title: string;
	updatedAt: string;
}

export interface ListPlatformAnnouncementsInput {
	order?: "asc" | "desc";
	page: number;
	pageSize: number;
	q?: string;
	sort?: "status" | "title" | "updated_at";
	status?: PlatformAnnouncementStatus;
}

export interface CreatePlatformAnnouncementInput {
	content: string;
	status: PlatformAnnouncementStatus;
	title: string;
}

export type UpdatePlatformAnnouncementInput = CreatePlatformAnnouncementInput;

export interface BatchUpdatePlatformAnnouncementStatusInput {
	ids: string[];
	status: PlatformAnnouncementStatus;
}

export interface BatchDeletePlatformAnnouncementsInput {
	ids: string[];
}

export interface BatchPlatformAnnouncementsResult {
	affected: number;
}
