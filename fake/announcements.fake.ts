import { defineFakeRoute } from "vite-plugin-fake-server/client";

import type {
	CreatePlatformAnnouncementInput,
	PlatformAnnouncement,
} from "../src/api/announcements";
import { announcements } from "./store";
import { pageValue, resultError, resultSuccess, routeParam } from "./utils";

function getAnnouncement(announcementId: string | undefined) {
	return announcements.find(
		(announcement) => announcement.id === announcementId,
	);
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
				id: `announcement-${Date.now()}`,
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
