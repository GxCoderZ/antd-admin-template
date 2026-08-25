import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiProblemError, request } from "./client";

afterEach(() => {
	vi.unstubAllGlobals();
});

describe("Fake-only request client", () => {
	it("requests the local /api namespace and unwraps the shared envelope", async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValue(
				new Response(
					JSON.stringify({ code: 0, msg: "OK", data: { items: ["admin"] } }),
					{ status: 200, headers: { "Content-Type": "application/json" } },
				),
			);
		vi.stubGlobal("fetch", fetchMock);

		await expect(
			request<{ items: string[] }>("/platform/users", {
				query: { page: 1, q: "admin", empty: undefined },
			}),
		).resolves.toEqual({ items: ["admin"] });
		expect(fetchMock).toHaveBeenCalledWith(
			"/api/platform/users?page=1&q=admin",
			expect.objectContaining({ method: "GET" }),
		);
	});

	it("turns Fake Server failures into ApiProblemError", async () => {
		vi.stubGlobal(
			"fetch",
			vi
				.fn()
				.mockResolvedValue(
					new Response(
						JSON.stringify({ code: 401, msg: "Please sign in", data: null }),
						{ status: 200, headers: { "Content-Type": "application/json" } },
					),
				),
		);

		const error = await request("/platform/auth/session").catch(
			(reason: unknown) => reason,
		);
		expect(error).toBeInstanceOf(ApiProblemError);
		expect(error).toMatchObject({ status: 401, message: "Please sign in" });
	});
});
