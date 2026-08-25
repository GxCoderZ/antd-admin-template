import { afterEach, describe, expect, it, vi } from "vitest";

import {
	getAdvancedFormDraft,
	saveAdvancedFormDraft,
	submitAdvancedForm,
	submitBasicForm,
	submitStepForm,
	validateAdvancedProjectCode,
} from "./index";

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
			client: "内部客户",
			endAt: "2026-09-08T00:00:00.000Z",
			goal: "提升客户满意度",
			invites: "张伟",
			publicType: "2" as const,
			publicUsers: "1",
			startAt: "2026-09-01T00:00:00.000Z",
			standard: "满意度达到 95%",
			title: "客户满意度目标",
			weight: 30,
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
			amount: 500,
			password: "123456",
			payAccount: "ant-design@alipay.com",
			receiverAccount: "test@example.com",
			receiverMode: "alipay" as const,
			receiverName: "Alex",
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

	it("loads, validates, saves, and submits the advanced form through the shared API client", async () => {
		const advancedInput = {
			accessMode: "team" as const,
			approvers: ["lead"],
			description: "沉淀高级表单资产",
			enableApproval: true,
			endAt: "2026-09-30T00:00:00.000Z",
			members: [
				{
					email: "alex@example.com",
					name: "Alex",
					role: "owner" as const,
					weight: 100,
				},
			],
			notifyChannels: ["mail"],
			notifyOwner: true,
			priority: "medium" as const,
			projectCode: "ADV-001",
			projectName: "高级表单资产",
			rule: {
				action: "通知负责人复核",
				condition: "amount" as const,
				name: "预算复核",
			},
			startAt: "2026-09-01T00:00:00.000Z",
			teamScope: "platform",
		};
		const fetchMock = vi.fn().mockImplementation(() =>
			Promise.resolve(
				successResponse({
					id: "advanced-001",
					submittedAt: "2026-08-26T00:00:00.000Z",
				}),
			),
		);
		vi.stubGlobal("fetch", fetchMock);

		await getAdvancedFormDraft();
		await validateAdvancedProjectCode({ projectCode: "ADV-001" });
		await saveAdvancedFormDraft(advancedInput);
		await submitAdvancedForm(advancedInput);

		expect(fetchMock).toHaveBeenNthCalledWith(
			1,
			"/api/platform/form-examples/advanced/draft",
			expect.objectContaining({
				method: "GET",
			}),
		);
		expect(fetchMock).toHaveBeenNthCalledWith(
			2,
			"/api/platform/form-examples/advanced/validate-code",
			expect.objectContaining({
				body: JSON.stringify({ projectCode: "ADV-001" }),
				method: "POST",
			}),
		);
		expect(fetchMock).toHaveBeenNthCalledWith(
			3,
			"/api/platform/form-examples/advanced/draft",
			expect.objectContaining({
				body: JSON.stringify(advancedInput),
				method: "POST",
			}),
		);
		expect(fetchMock).toHaveBeenNthCalledWith(
			4,
			"/api/platform/form-examples/advanced/submit",
			expect.objectContaining({
				body: JSON.stringify(advancedInput),
				method: "POST",
			}),
		);
	});
});
