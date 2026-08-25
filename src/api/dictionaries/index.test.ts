import { afterEach, describe, expect, it, vi } from "vitest";

import {
	createPlatformDictionaryItem,
	listPlatformDictionaryItems,
	listPlatformDictionaryTypes,
	updatePlatformDictionaryType,
} from "./index";

afterEach(() => {
	vi.unstubAllGlobals();
});

function successResponse(data: unknown) {
	return new Response(JSON.stringify({ code: 0, data, msg: "OK" }), {
		headers: { "Content-Type": "application/json" },
		status: 200,
	});
}

describe("dictionaries API", () => {
	it("maps dictionary type list parameters and shared pagination", async () => {
		const fetchMock = vi.fn().mockResolvedValue(
			successResponse({
				items: [],
				page: 2,
				page_size: 20,
				total: 26,
			}),
		);
		vi.stubGlobal("fetch", fetchMock);

		await expect(
			listPlatformDictionaryTypes({
				order: "asc",
				page: 2,
				pageSize: 20,
				q: "status",
				sort: "code",
				status: "active",
			}),
		).resolves.toEqual({ items: [], page: 2, pageSize: 20, total: 26 });
		expect(fetchMock).toHaveBeenCalledWith(
			"/api/platform/dictionaries/types?order=asc&page=2&q=status&sort=code&status=active&page_size=20",
			expect.objectContaining({ method: "GET" }),
		);
	});

	it("maps dictionary item list requests under the selected type", async () => {
		const fetchMock = vi.fn().mockResolvedValue(
			successResponse({
				items: [],
				page: 1,
				page_size: 10,
				total: 3,
			}),
		);
		vi.stubGlobal("fetch", fetchMock);

		await listPlatformDictionaryItems("dict-status", {
			order: "desc",
			page: 1,
			pageSize: 10,
			q: "启用",
			sort: "sort",
		});

		expect(fetchMock).toHaveBeenCalledWith(
			"/api/platform/dictionaries/types/dict-status/items?order=desc&page=1&q=%E5%90%AF%E7%94%A8&sort=sort&page_size=10",
			expect.objectContaining({ method: "GET" }),
		);
	});

	it("writes dictionary mutations through the local Fake API namespace", async () => {
		const fetchMock = vi.fn().mockResolvedValue(
			successResponse({
				code: "order_status",
				createdAt: "2026-08-25T00:00:00.000Z",
				description: "订单状态",
				id: "dict-order-status",
				itemCount: 0,
				name: "订单状态",
				status: "active",
				updatedAt: "2026-08-25T00:00:00.000Z",
			}),
		);
		vi.stubGlobal("fetch", fetchMock);

		await updatePlatformDictionaryType({
			input: {
				code: "order_status",
				description: "订单状态",
				name: "订单状态",
				status: "active",
			},
			typeId: "dict-order-status",
		});

		expect(fetchMock).toHaveBeenCalledWith(
			"/api/platform/dictionaries/types/dict-order-status",
			expect.objectContaining({
				body: JSON.stringify({
					code: "order_status",
					description: "订单状态",
					name: "订单状态",
					status: "active",
				}),
				method: "PATCH",
			}),
		);
	});

	it("creates dictionary items with sort value and color metadata", async () => {
		const input = {
			color: "green",
			description: "可选状态",
			label: "启用",
			sort: 10,
			status: "active" as const,
			value: "enabled",
		} as const;
		const fetchMock = vi.fn().mockResolvedValue(
			successResponse({
				...input,
				createdAt: "2026-08-25T00:00:00.000Z",
				id: "dict-item-enabled",
				typeId: "dict-status",
				updatedAt: "2026-08-25T00:00:00.000Z",
			}),
		);
		vi.stubGlobal("fetch", fetchMock);

		await createPlatformDictionaryItem({ input, typeId: "dict-status" });

		expect(fetchMock).toHaveBeenCalledWith(
			"/api/platform/dictionaries/types/dict-status/items",
			expect.objectContaining({
				body: JSON.stringify(input),
				method: "POST",
			}),
		);
	});
});
