import { describe, expect, it } from "vitest";

import type { PlatformPosition } from "../src/api/positions";
import positionRoutes from "./positions.fake";
import { findFakeRoute } from "./route-helpers";

interface PositionListPayload {
	data: {
		items: PlatformPosition[];
		page: number;
		page_size: number;
		total: number;
	};
}

function findRoute(method: string, url: string) {
	return findFakeRoute(positionRoutes, method, url);
}

describe("Fake positions", () => {
	it("supports filters, pagination and sorting", () => {
		const listPositions = findRoute("get", "/platform/positions");
		const firstPage = listPositions({
			query: { page: "1", page_size: "10", sort: "name", order: "asc" },
		}) as PositionListPayload;
		const filtered = listPositions({
			query: {
				department_id: "dept-operations",
				name: "专员",
				page: "1",
				page_size: "100",
				status: "active",
			},
		}) as PositionListPayload;

		expect(firstPage.data.total).toBeGreaterThanOrEqual(20);
		expect(firstPage.data.items).toHaveLength(10);
		expect(
			filtered.data.items.every(
				(item) =>
					item.departmentId === "dept-operations" &&
					item.name.includes("专员") &&
					item.status === "active",
			),
		).toBe(true);
	});

	it("persists create, update, disable and delete operations in the preview session", () => {
		const listPositions = findRoute("get", "/platform/positions");
		const createPosition = findRoute("post", "/platform/positions");
		const updatePosition = findRoute(
			"patch",
			"/platform/positions/:positionId",
		);
		const deletePosition = findRoute(
			"delete",
			"/platform/positions/:positionId",
		);
		const created = createPosition({
			body: {
				code: "quality_specialist",
				departmentId: "dept-operations",
				name: "质量专员",
				status: "active",
			},
		}) as { data: PlatformPosition };

		updatePosition({
			body: { ...created.data, name: "高级质量专员", status: "disabled" },
			params: { positionId: created.data.id },
		});
		const afterUpdate = listPositions({
			query: { code: "quality_specialist", page: "1", page_size: "10" },
		}) as PositionListPayload;
		expect(afterUpdate.data.items[0]).toMatchObject({
			id: created.data.id,
			name: "高级质量专员",
			status: "disabled",
		});

		deletePosition({ params: { positionId: created.data.id } });
		const afterDelete = listPositions({
			query: { code: "quality_specialist", page: "1", page_size: "10" },
		}) as PositionListPayload;
		expect(afterDelete.data.items).toHaveLength(0);
	});
});
