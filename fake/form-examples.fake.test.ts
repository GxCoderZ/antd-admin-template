import { describe, expect, it } from "vitest";

import formExampleRoutes from "./form-examples.fake";

interface TestRoute {
	method?: string;
	response?: (request: { body?: unknown }) => unknown;
	url: string;
}

interface SubmissionPayload {
	data: { id: string };
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
});
