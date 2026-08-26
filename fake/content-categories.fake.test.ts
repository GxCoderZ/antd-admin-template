import { describe, expect, it } from "vitest";

import type {
	ContentCategory,
	ContentCategoryItem,
} from "../src/api/content-categories";
import routes from "./content-categories.fake";
import { findFakeRoute } from "./route-helpers";

function findRoute(method: string, url: string) {
	return findFakeRoute(routes, method, url);
}

describe("Fake content category management", () => {
	it("returns a nested category tree and supports category mutations", () => {
		const list = findRoute("get", "/examples/content-categories");
		const create = findRoute("post", "/examples/content-categories");
		const update = findRoute(
			"patch",
			"/examples/content-categories/:categoryId",
		);
		const remove = findRoute(
			"delete",
			"/examples/content-categories/:categoryId",
		);

		const created = create({
			body: {
				code: "release-notes",
				name: "版本公告",
				parentId: "category-content",
				status: "active",
			},
		}) as { data: ContentCategory };
		update({
			body: { ...created.data, name: "产品版本公告", status: "disabled" },
			params: { categoryId: created.data.id },
		});

		const afterUpdate = list({ query: { q: "产品版本" } }) as {
			data: ContentCategory[];
		};
		expect(afterUpdate.data[0]?.children[0]).toMatchObject({
			id: created.data.id,
			name: "产品版本公告",
			status: "disabled",
		});

		remove({ params: { categoryId: created.data.id } });
		const afterDelete = list({ query: { q: "产品版本" } }) as {
			data: ContentCategory[];
		};
		expect(afterDelete.data).toHaveLength(0);
	});

	it("filters, paginates and persists content item CRUD", () => {
		const list = findRoute("get", "/examples/content-category-items");
		const create = findRoute("post", "/examples/content-category-items");
		const update = findRoute(
			"patch",
			"/examples/content-category-items/:itemId",
		);
		const remove = findRoute(
			"delete",
			"/examples/content-category-items/:itemId",
		);

		const created = create({
			body: {
				categoryId: "category-guides",
				owner: "Platform Admin",
				status: "draft",
				title: "移动端使用说明",
			},
		}) as { data: ContentCategoryItem };
		update({
			body: { ...created.data, status: "published", title: "移动端操作指南" },
			params: { itemId: created.data.id },
		});

		const filtered = list({
			query: {
				category_id: "category-guides",
				page: "1",
				page_size: "10",
				q: "移动端操作",
				status: "published",
			},
		}) as { data: { items: ContentCategoryItem[]; total: number } };
		expect(filtered.data.items[0]).toMatchObject({
			id: created.data.id,
			status: "published",
		});

		remove({ params: { itemId: created.data.id } });
		const afterDelete = list({
			query: { page: "1", page_size: "10", q: "移动端操作" },
		}) as { data: { total: number } };
		expect(afterDelete.data.total).toBe(0);
	});
});
