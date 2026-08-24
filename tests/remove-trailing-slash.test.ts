import { removeTrailingSlash } from "#src/router/utils/remove-trailing-slash";

describe("removeTrailingSlash", () => {
	it("removes a trailing slash without changing the root path", () => {
		expect(removeTrailingSlash("/tenant/")).toBe("/tenant");
		expect(removeTrailingSlash("/tenant")).toBe("/tenant");
		expect(removeTrailingSlash("/")).toBe("/");
	});
});
