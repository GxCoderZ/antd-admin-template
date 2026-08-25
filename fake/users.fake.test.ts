import { describe, expect, it } from "vitest";

import type { PlatformUser } from "../src/api/users";
import userRoutes from "./users.fake";

interface UserListPayload {
	data: {
		items: PlatformUser[];
		page: number;
		page_size: number;
		total: number;
	};
}

interface TestRoute {
	method?: string;
	response?: (request: { query: Record<string, string> }) => unknown;
	url: string;
}

function listUsers(query: Record<string, string>) {
	const response = (userRoutes as unknown as TestRoute[]).find(
		(route) => route.method === "get" && route.url === "/platform/users",
	)?.response;

	expect(response).toBeDefined();
	return response?.({ query }) as UserListPayload;
}

describe("Fake users", () => {
	it("provides enough deterministic records to demonstrate pagination", () => {
		const firstPage = listUsers({ page: "1", page_size: "10" });
		const secondPage = listUsers({ page: "2", page_size: "10" });

		expect(firstPage.data.total).toBeGreaterThanOrEqual(24);
		expect(firstPage.data.items).toHaveLength(10);
		expect(secondPage.data.items).toHaveLength(10);
		expect(secondPage.data.items.map((user) => user.id)).not.toEqual(
			firstPage.data.items.map((user) => user.id),
		);
	});

	it("keeps generated records useful for status and keyword filters", () => {
		const disabledUsers = listUsers({
			page: "1",
			page_size: "100",
			status: "disabled",
		});
		const keywordUsers = listUsers({
			page: "1",
			page_size: "100",
			q: "chen",
		});

		expect(disabledUsers.data.items.length).toBeGreaterThan(1);
		expect(
			disabledUsers.data.items.every((user) => user.status === "disabled"),
		).toBe(true);
		expect(keywordUsers.data.items.length).toBeGreaterThan(1);
		expect(
			keywordUsers.data.items.every((user) =>
				`${user.username} ${user.email}`.toLowerCase().includes("chen"),
			),
		).toBe(true);
	});
});
