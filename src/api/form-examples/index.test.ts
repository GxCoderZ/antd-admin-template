import { afterEach, describe, expect, it, vi } from "vitest";

import { submitBasicForm, submitStepForm } from "./index";

afterEach(() => {
	vi.unstubAllGlobals();
});

function successResponse(data: unknown) {
	return new Response(JSON.stringify({ code: 0, data, msg: "OK" }), {
		headers: { "Content-Type": "application/json" },
		status: 200,
	});
}

describe("form examples API", () => {
	it("submits the basic form through the shared API client", async () => {
		const input = {
			category: "operation" as const,
			endAt: "2026-09-08T00:00:00.000Z",
			notify: true,
			owner: "张伟",
			priority: "normal" as const,
			startAt: "2026-09-01T00:00:00.000Z",
			summary: "用于验证通用基础表单。",
			title: "基础表单演示",
		};
		const fetchMock = vi.fn().mockResolvedValue(
			successResponse({
				id: "basic-001",
				submittedAt: "2026-08-26T00:00:00.000Z",
			}),
		);
		vi.stubGlobal("fetch", fetchMock);

		await submitBasicForm(input);

		expect(fetchMock).toHaveBeenCalledWith(
			"/api/platform/form-examples/basic",
			expect.objectContaining({
				body: JSON.stringify(input),
				method: "POST",
			}),
		);
	});

	it("submits the step form through the shared API client", async () => {
		const input = {
			name: "分步表单演示",
			notes: "确认后提交。",
			owner: "李娜",
			scheduledAt: "2026-09-01T00:00:00.000Z",
		};
		const fetchMock = vi.fn().mockResolvedValue(
			successResponse({
				id: "step-001",
				submittedAt: "2026-08-26T00:00:00.000Z",
			}),
		);
		vi.stubGlobal("fetch", fetchMock);

		await submitStepForm(input);

		expect(fetchMock).toHaveBeenCalledWith(
			"/api/platform/form-examples/step",
			expect.objectContaining({
				body: JSON.stringify(input),
				method: "POST",
			}),
		);
	});
});
