import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useQuerySubmission } from "./queryFilterLayout";

describe("useQuerySubmission", () => {
	it("creates a new query revision for every explicit query submission", () => {
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
