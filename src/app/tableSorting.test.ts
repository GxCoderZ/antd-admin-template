import { describe, expect, it } from "vitest";

import { resolveTableSort } from "./tableSorting";

const sortMap = {
	createdAt: "created_at",
	username: "username",
} as const;

describe("resolveTableSort", () => {
	it("maps ascending and descending table states to API sort values", () => {
		expect(resolveTableSort("username", "ascend", sortMap)).toEqual({
			order: "asc",
			sort: "username",
		});
		expect(resolveTableSort("createdAt", "descend", sortMap)).toEqual({
			order: "desc",
			sort: "created_at",
		});
	});

	it("clears API sorting when the table enters its third state", () => {
		expect(resolveTableSort("username", null, sortMap)).toEqual({
			order: undefined,
			sort: undefined,
		});
	});
});
