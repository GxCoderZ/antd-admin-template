import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
	resolveQueryFilterLayoutMode,
	useQuerySubmission,
} from "./queryFilterLayout";

describe("useQuerySubmission", () => {
	it("creates a new query revision for every submit or reset action", () => {
		const { result } = renderHook(() => useQuerySubmission());

		expect(result.current.revision).toBe(0);
		act(() => result.current.submit());
		expect(result.current.revision).toBe(1);
		act(() => {
			result.current.submit();
			result.current.submit();
		});
		expect(result.current.revision).toBe(3);
	});
});

describe("useQueryFilterLayout", () => {
	it("keeps resize updates bucketed by filter layout breakpoints", () => {
		const screenSMMin = 576;
		const screenMDMin = 768;
		const screenXXLMin = 1600;

		expect(
			resolveQueryFilterLayoutMode(360, screenSMMin, screenMDMin, screenXXLMin),
		).toBe("compact");
		expect(
			resolveQueryFilterLayoutMode(700, screenSMMin, screenMDMin, screenXXLMin),
		).toBe("narrow");
		expect(
			resolveQueryFilterLayoutMode(
				1100,
				screenSMMin,
				screenMDMin,
				screenXXLMin,
			),
		).toBe("regular");
		expect(
			resolveQueryFilterLayoutMode(
				1800,
				screenSMMin,
				screenMDMin,
				screenXXLMin,
			),
		).toBe("wide");
	});
});
