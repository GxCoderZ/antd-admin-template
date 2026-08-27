import { defineFakeRoute } from "vite-plugin-fake-server/client";

import type {
	BatchDeletePlatformAnnouncementsInput,
	BatchUpdatePlatformAnnouncementStatusInput,
	CreatePlatformAnnouncementInput,
	PlatformAnnouncement,
} from "../src/api/announcements";
import { announcements } from "./store";
import { pageValue, resultError, resultSuccess, routeParam } from "./utils";

let createdAnnouncementSequence = announcements.reduce((currentMax, announcement) => {
	const nextValue = Number(announcement.id.replace(/^announcement-/, ""));
	return Number.isFinite(nextValue) ? Math.max(currentMax, nextValue) : currentMax;
}, announcements.length);

function getAnnouncement(announcementId: string | undefined) {
	return announcements.find(
		(announcement) => announcement.id === announcementId,
	);
}

function createAnnouncementId() {
	createdAnnouncementSequence += 1;
	return `announcement-${createdAnnouncementSequence}`;
}

function isValidInput(
	input: unknown,
): input is CreatePlatformAnnouncementInput {
	return (
		typeof input === "object" &&
		input !== null &&
		"title" in input &&
		typeof input.title === "string" &&
		input.title.trim().length > 0 &&
		input.title.length <= 100 &&
		"content" in input &&
		typeof input.content === "string" &&
		input.content.trim().length > 0 &&
		input.content.length <= 2_000 &&
		"status" in input &&
		(input.status === "draft" || input.status === "published")
	);
}

function hasUniqueIds(ids: string[]) {
	return new Set(ids).size === ids.length;
}

function isNonEmptyStringArray(value: unknown): value is string[] {
	return (
		Array.isArray(value) &&
		value.length > 0 &&
		value.every((id) => typeof id === "string" && id.trim().length > 0)
	);
}

function isValidBatchStatusInput(
	input: unknown,
): input is BatchUpdatePlatformAnnouncementStatusInput {
	return (
		typeof input === "object" &&
		input !== null &&
		"ids" in input &&
		isNonEmptyStringArray(input.ids) &&
		hasUniqueIds(input.ids) &&
		"status" in input &&
		(input.status === "draft" || input.status === "published")
	);
}

function isValidBatchDeleteInput(
	input: unknown,
): input is BatchDeletePlatformAnnouncementsInput {
	return (
		typeof input === "object" &&
		input !== null &&
		"ids" in input &&
		isNonEmptyStringArray(input.ids) &&
		hasUniqueIds(input.ids)
	);
}

function getExistingAnnouncementIds(ids: string[]) {
	const existingIds = new Set(announcements.map((announcement) => announcement.id));
	return ids.filter((id) => existingIds.has(id));
}

export default defineFakeRoute([
	{
		method: "get",
		url: "/platform/announcements",
		response: ({ query }) => {
			const page = pageValue(query.page, 1);
			const pageSize = pageValue(query.page_size, 10);
			const keyword = String(query.q ?? "")
				.trim()
				.toLowerCase();
			const status = routeParam(query.status);
			const sort = routeParam(query.sort) ?? "updated_at";
			const order = routeParam(query.order) ?? "desc";
			const sortValue = (announcement: PlatformAnnouncement) => {
				switch (sort) {
					case "status":
						return announcement.status;
					case "title":
						return announcement.title;
					default:
						return announcement.updatedAt;
				}
			};
			const filtered = announcements.filter(
				(announcement) =>
					(!keyword ||
						announcement.title.toLowerCase().includes(keyword) ||
						announcement.content.toLowerCase().includes(keyword)) &&
					(!status || announcement.status === status),
			);
			const sorted = [...filtered].sort(
				(left, right) =>
					sortValue(left).localeCompare(sortValue(right)) *
					(order === "asc" ? 1 : -1),
			);
			const start = (page - 1) * pageSize;

			return resultSuccess({
				items: sorted.slice(start, start + pageSize),
				page,
				page_size: pageSize,
				total: sorted.length,
			});
		},
	},
	{
		method: "post",
		url: "/platform/announcements",
		response: ({ body }) => {
			const input = body;
			if (!isValidInput(input)) {
				return resultError("Invalid announcement input", 422);
			}

			const timestamp = new Date().toISOString();
			const announcement: PlatformAnnouncement = {
				content: input.content.trim(),
				createdAt: timestamp,
				id: createAnnouncementId(),
				status: input.status,
				title: input.title.trim(),
				updatedAt: timestamp,
			};
			announcements.unshift(announcement);
			return resultSuccess(announcement);
		},
	},
	{
		method: "patch",
		url: "/platform/announcements/status",
		response: ({ body }) => {
			const input = body;
			if (!isValidBatchStatusInput(input)) {
				return resultError("Invalid announcement batch input", 422);
			}
			const existingIds = getExistingAnnouncementIds(input.ids);
			if (existingIds.length !== input.ids.length) {
				return resultError("Announcement not found", 404);
			}

			const idSet = new Set(input.ids);
			const timestamp = new Date().toISOString();
			announcements.forEach((announcement) => {
				if (idSet.has(announcement.id)) {
					announcement.status = input.status;
					announcement.updatedAt = timestamp;
				}
			});
			return resultSuccess({ affected: input.ids.length });
		},
	},
	{
		method: "patch",
		url: "/platform/announcements/:announcementId",
		response: ({ body, params }) => {
			const announcement = getAnnouncement(routeParam(params.announcementId));
			if (!announcement) {
				return resultError("Announcement not found", 404);
			}

			const input = body;
			if (!isValidInput(input)) {
				return resultError("Invalid announcement input", 422);
			}

			announcement.content = input.content.trim();
			announcement.status = input.status;
			announcement.title = input.title.trim();
			announcement.updatedAt = new Date().toISOString();
			return resultSuccess(announcement);
		},
	},
	{
		method: "delete",
		url: "/platform/announcements",
		response: ({ body }) => {
			const input = body;
			if (!isValidBatchDeleteInput(input)) {
				return resultError("Invalid announcement batch input", 422);
			}
			const existingIds = getExistingAnnouncementIds(input.ids);
			if (existingIds.length !== input.ids.length) {
				return resultError("Announcement not found", 404);
			}

			const idSet = new Set(input.ids);
			let affected = 0;
			for (let index = announcements.length - 1; index >= 0; index -= 1) {
				const announcement = announcements[index];
				if (announcement && idSet.has(announcement.id)) {
					announcements.splice(index, 1);
					affected += 1;
				}
			}
			return resultSuccess({ affected });
		},
	},
	{
		method: "delete",
		url: "/platform/announcements/:announcementId",
		response: ({ params }) => {
			const announcementId = routeParam(params.announcementId);
			const index = announcements.findIndex(
				(announcement) => announcement.id === announcementId,
			);
			if (index < 0) {
				return resultError("Announcement not found", 404);
			}

			announcements.splice(index, 1);
			return resultSuccess(null);
		},
	},
]);
