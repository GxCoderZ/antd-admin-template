import { request, type ApiPage } from "../client";
import type {
	BatchDeletePlatformAnnouncementsInput,
	BatchPlatformAnnouncementsResult,
	BatchUpdatePlatformAnnouncementStatusInput,
	CreatePlatformAnnouncementInput,
	ListPlatformAnnouncementsInput,
	PlatformAnnouncement,
	UpdatePlatformAnnouncementInput,
} from "./types";

export * from "./types";

export const platformAnnouncementsQueryKey = [
	"platform-announcements",
] as const;

export function listPlatformAnnouncements(
	input: ListPlatformAnnouncementsInput,
	signal?: AbortSignal,
) {
	const { pageSize, ...query } = input;
	return request<ApiPage<PlatformAnnouncement>>("/platform/announcements", {
		query: { ...query, page_size: pageSize },
		signal,
	}).then(({ items, page, page_size, total }) => ({
		items,
		page,
		pageSize: page_size,
		total,
	}));
}

export function createPlatformAnnouncement(
	input: CreatePlatformAnnouncementInput,
) {
	return request<PlatformAnnouncement>("/platform/announcements", {
		body: input,
		method: "POST",
	});
}

export function updatePlatformAnnouncement({
	announcementId,
	input,
}: {
	announcementId: string;
	input: UpdatePlatformAnnouncementInput;
}) {
	return request<PlatformAnnouncement>(
		`/platform/announcements/${announcementId}`,
		{
			body: input,
			method: "PATCH",
		},
	);
}

export function updatePlatformAnnouncementStatuses(
	input: BatchUpdatePlatformAnnouncementStatusInput,
) {
	return request<BatchPlatformAnnouncementsResult>(
		"/platform/announcements/status",
		{
			body: input,
			method: "PATCH",
		},
	);
}

export function deletePlatformAnnouncement(announcementId: string) {
	return request<void>(`/platform/announcements/${announcementId}`, {
		method: "DELETE",
	});
}

export function deletePlatformAnnouncements(
	input: BatchDeletePlatformAnnouncementsInput,
) {
	return request<BatchPlatformAnnouncementsResult>("/platform/announcements", {
		body: input,
		method: "DELETE",
	});
}
