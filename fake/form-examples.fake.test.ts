import { describe, expect, it } from "vitest";

import type { AdvancedFormPayload } from "../src/api/form-examples";
import formExampleRoutes from "./form-examples.fake";

interface TestRoute {
	method?: string;
	response?: (request: { body?: unknown }) => unknown;
	url: string;
}

interface SubmissionPayload {
	data: { id: string };
}

interface SuccessPayload<T> {
	data: T;
}

function findRoute(url: string) {
	const route = (formExampleRoutes as unknown as TestRoute[]).find(
		(candidate) => candidate.method === "post" && candidate.url === url,
	);

	if (!route?.response) {
		throw new Error(`Missing Fake route: POST ${url}`);
	}

	return route.response;
}

describe("Fake form examples", () => {
	it("accepts valid basic and step submissions", () => {
		const submitBasic = findRoute("/platform/form-examples/basic");
		const submitStep = findRoute("/platform/form-examples/step");

		const basicSubmission = submitBasic({
			body: {
				client: "内部客户",
				endAt: "2026-09-08T00:00:00.000Z",
				goal: "提升客户满意度",
				invites: "张伟",
				publicType: "2",
				publicUsers: "1",
				startAt: "2026-09-01T00:00:00.000Z",
				standard: "满意度达到 95%",
				title: "客户满意度目标",
				weight: 30,
			},
		}) as SubmissionPayload;
		const stepSubmission = submitStep({
			body: {
				amount: 500,
				password: "123456",
				payAccount: "ant-design@alipay.com",
				receiverAccount: "test@example.com",
				receiverMode: "alipay",
				receiverName: "Alex",
			},
		}) as SubmissionPayload;

		expect(basicSubmission.data.id).toMatch(/^basic-/);
		expect(stepSubmission.data.id).toMatch(/^step-/);
	});

	it("rejects incomplete submissions", () => {
		const submitBasic = findRoute("/platform/form-examples/basic");
		const submitStep = findRoute("/platform/form-examples/step");

		expect(submitBasic({ body: { title: "" } })).toMatchObject({ code: 422 });
		expect(submitStep({ body: { receiverAccount: "" } })).toMatchObject({
			code: 422,
		});
	});

	it("persists advanced drafts, validates unique codes, and rejects invalid advanced submissions", () => {
		const getDraft = (formExampleRoutes as unknown as TestRoute[]).find(
			(candidate) =>
				candidate.method === "get" &&
				candidate.url === "/platform/form-examples/advanced/draft",
		)?.response;
		const saveDraft = findRoute("/platform/form-examples/advanced/draft");
		const submitAdvanced = findRoute("/platform/form-examples/advanced/submit");
		const validateCode = findRoute(
			"/platform/form-examples/advanced/validate-code",
		);
		if (!getDraft) {
			throw new Error("Missing Fake route: GET advanced draft");
		}

		const advancedPayload: AdvancedFormPayload = {
			accessMode: "team",
			approvers: ["lead"],
			description: "沉淀高级表单资产",
			enableApproval: true,
			endAt: "2026-09-30T00:00:00.000Z",
			members: [
				{
					email: "alex@example.com",
					name: "Alex",
					role: "owner",
					weight: 100,
				},
			],
			notifyChannels: ["mail"],
			notifyOwner: true,
			priority: "medium",
			projectCode: "ADV-001",
			projectName: "高级表单资产",
			rule: {
				action: "通知负责人复核",
				condition: "amount",
				name: "预算复核",
			},
			startAt: "2026-09-01T00:00:00.000Z",
			teamScope: "platform",
		};

		expect(validateCode({ body: { projectCode: "OPS-LOCKED" } })).toMatchObject(
			{
				data: { available: false },
			},
		);
		const draftSubmission = saveDraft({
			body: advancedPayload,
		}) as SubmissionPayload;
		expect(draftSubmission.data.id).toMatch(/^advanced-/);
		expect(
			(getDraft({}) as SuccessPayload<{
				approvers?: string[];
				projectCode: string;
			}>).data,
		).toMatchObject({ approvers: ["lead"], projectCode: "ADV-001" });
		const advancedSubmission = submitAdvanced({
			body: advancedPayload,
		}) as SubmissionPayload;
		expect(advancedSubmission.data.id).toMatch(/^advanced-/);
		expect(
			submitAdvanced({
				body: {
					...advancedPayload,
					members: [{ ...advancedPayload.members[0], weight: 50 }],
				},
			}),
		).toMatchObject({ code: 422 });
	});
});
