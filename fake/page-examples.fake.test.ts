import { describe, expect, it } from "vitest";

import type {
	ExampleListItem,
	ExampleRecordDetail,
} from "../src/api/page-examples";
import pageExampleRoutes from "./page-examples.fake";

interface TestRoute {
	method?: string;
	response?: (request: {
		params?: Record<string, string>;
		query?: Record<string, string>;
	}) => unknown;
	url: string;
}

function findRoute(method: string, url: string) {
	const route = (pageExampleRoutes as unknown as TestRoute[]).find(
		(candidate) => candidate.method === method && candidate.url === url,
	);
	if (!route?.response) throw new Error(`Missing Fake route: ${method} ${url}`);
	return route.response;
}

describe("Fake page examples", () => {
	it("supports normal, searched and empty list states", () => {
		const list = findRoute("get", "/examples/items");
		const normal = list({ query: { page: "1", page_size: "10" } }) as {
			data: { items: ExampleListItem[]; total: number };
		};
		const searched = list({
			query: { page: "1", page_size: "10", q: "Ant" },
		}) as typeof normal;
		const empty = list({
			query: { page: "1", page_size: "10", q: "不存在的页面资产" },
		}) as typeof normal;

		expect(normal.data.items).toHaveLength(10);
		expect(normal.data.total).toBeGreaterThan(10);
		expect(searched.data.items.length).toBeGreaterThan(0);
		expect(empty.data.items).toHaveLength(0);
	});

	it("returns detail data and explicit failure states", () => {
		const detail = findRoute("get", "/examples/records/:recordId");
		expect(
			(
				detail({ params: { recordId: "record-001" } }) as {
					data: ExampleRecordDetail;
				}
			).data.id,
		).toBe("record-001");
		expect(detail({ params: { recordId: "missing" } })).toMatchObject({
			code: 404,
		});
	});
});
