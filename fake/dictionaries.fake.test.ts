import { describe, expect, it } from "vitest";

import type {
	PlatformDictionaryItem,
	PlatformDictionaryType,
} from "../src/api/dictionaries";
import dictionaryRoutes from "./dictionaries.fake";
import { findFakeRoute } from "./route-helpers";

interface PagePayload<T> {
	data: {
		items: T[];
		page: number;
		page_size: number;
		total: number;
	};
}

function findRoute(method: string, url: string) {
	return findFakeRoute(dictionaryRoutes, method, url);
}

describe("Fake dictionaries", () => {
	it("supports dictionary type pagination, filtering and sorting", () => {
		const listTypes = findRoute("get", "/platform/dictionaries/types");
		const firstPage = listTypes({
			query: { page: "1", page_size: "10" },
		}) as PagePayload<PlatformDictionaryType>;
		const activeTypes = listTypes({
			query: {
				order: "asc",
				page: "1",
				page_size: "100",
				sort: "code",
				status: "active",
			},
		}) as PagePayload<PlatformDictionaryType>;

		expect(firstPage.data.total).toBeGreaterThanOrEqual(18);
		expect(firstPage.data.items).toHaveLength(10);
		expect(activeTypes.data.items.length).toBeGreaterThan(1);
		expect(
			activeTypes.data.items.every((item) => item.status === "active"),
		).toBe(true);
		expect(
			activeTypes.data.items[0]!.code <= activeTypes.data.items.at(-1)!.code,
		).toBe(true);
	});

	it("persists dictionary type create, update and delete operations", () => {
		const listTypes = findRoute("get", "/platform/dictionaries/types");
		const createType = findRoute("post", "/platform/dictionaries/types");
		const updateType = findRoute(
			"patch",
			"/platform/dictionaries/types/:typeId",
		);
		const deleteType = findRoute(
			"delete",
			"/platform/dictionaries/types/:typeId",
		);
		const created = createType({
			body: {
				code: "fake_crud_type",
				description: "Fake CRUD 字典类型",
				name: "Fake CRUD 类型",
				status: "active",
			},
		}) as { data: PlatformDictionaryType };

		expect(created.data.itemCount).toBe(0);
		const updated = updateType({
			body: {
				code: created.data.code,
				description: created.data.description,
				name: "Fake CRUD 类型（更新）",
				status: "disabled",
			},
			params: { typeId: created.data.id },
		}) as { data: PlatformDictionaryType };
		expect(updated.data.status).toBe("disabled");

		deleteType({ params: { typeId: created.data.id } });
		const afterDelete = listTypes({
			query: { page: "1", page_size: "100", q: created.data.code },
		}) as PagePayload<PlatformDictionaryType>;
		expect(afterDelete.data.items).toHaveLength(0);
	});

	it("persists dictionary item mutations under a selected type", () => {
		const listItems = findRoute(
			"get",
			"/platform/dictionaries/types/:typeId/items",
		);
		const createItem = findRoute(
			"post",
			"/platform/dictionaries/types/:typeId/items",
		);
		const updateItem = findRoute(
			"patch",
			"/platform/dictionaries/items/:itemId",
		);
		const deleteItem = findRoute(
			"delete",
			"/platform/dictionaries/items/:itemId",
		);
		const created = createItem({
			body: {
				color: "purple",
				description: "Fake CRUD 字典项",
				label: "验证项",
				sort: 99,
				status: "active",
				value: "fake_item",
			},
			params: { typeId: "dict-user-status" },
		}) as { data: PlatformDictionaryItem };

		expect(created.data.typeId).toBe("dict-user-status");
		const updated = updateItem({
			body: {
				color: "red",
				description: created.data.description,
				label: "验证项（停用）",
				sort: 100,
				status: "disabled",
				value: created.data.value,
			},
			params: { itemId: created.data.id },
		}) as { data: PlatformDictionaryItem };
		expect(updated.data.status).toBe("disabled");
		expect(updated.data.sort).toBe(100);

		deleteItem({ params: { itemId: created.data.id } });
		const afterDelete = listItems({
			params: { typeId: "dict-user-status" },
			query: { page: "1", page_size: "100", q: created.data.value },
		}) as PagePayload<PlatformDictionaryItem>;
		expect(afterDelete.data.items).toHaveLength(0);
	});
});
