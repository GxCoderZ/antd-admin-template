import { describe, expect, it } from "vitest";

import { defaultPreferences, preferenceStorageKeys } from "./preferenceStorage";

describe("structural layout preferences", () => {
	it("does not expose content width or menu header visibility", () => {
		expect(defaultPreferences).not.toHaveProperty("contentWidth");
		expect(defaultPreferences).not.toHaveProperty("menuHeaderVisible");
		expect(preferenceStorageKeys).not.toHaveProperty("contentWidth");
		expect(preferenceStorageKeys).not.toHaveProperty("menuHeaderVisible");
	});
});
