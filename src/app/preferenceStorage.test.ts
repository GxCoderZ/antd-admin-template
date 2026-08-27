import { describe, expect, it } from "vitest";

import {
	defaultPreferences,
	preferenceStorageKeys,
	readNavigationSearchHistory,
	writeNavigationSearchHistory,
} from "./preferenceStorage";

describe("structural layout preferences", () => {
	it("does not expose content width or menu header visibility", () => {
		expect(defaultPreferences).not.toHaveProperty("contentWidth");
		expect(defaultPreferences).not.toHaveProperty("menuHeaderVisible");
		expect(preferenceStorageKeys).not.toHaveProperty("contentWidth");
		expect(preferenceStorageKeys).not.toHaveProperty("menuHeaderVisible");
	});
});

describe("navigation search history", () => {
	it("stores bounded, unique route paths per preview account", () => {
		writeNavigationSearchHistory("history-test", [
			"/users",
			"/users",
			...Array.from({ length: 12 }, (_, index) => `/page-${index}`),
		]);
		expect(readNavigationSearchHistory("history-test")).toEqual([
			"/users",
			...Array.from({ length: 9 }, (_, index) => `/page-${index}`),
		]);
		expect(readNavigationSearchHistory("other-history-test")).toEqual([]);
		writeNavigationSearchHistory("history-test", []);
		expect(readNavigationSearchHistory("history-test")).toEqual([]);
	});
});
