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
				category: "operation",
				endAt: "2026-09-08T00:00:00.000Z",
				notify: true,
				owner: "张伟",
				priority: "normal",
				startAt: "2026-09-01T00:00:00.000Z",
				summary: "用于验证通用基础表单。",
				title: "基础表单演示",
			},
		}) as SubmissionPayload;
		const stepSubmission = submitStep({
			body: {
				name: "分步表单演示",
				owner: "李娜",
				scheduledAt: "2026-09-01T00:00:00.000Z",
			},
		}) as SubmissionPayload;

		expect(basicSubmission.data.id).toMatch(/^basic-/);
		expect(stepSubmission.data.id).toMatch(/^step-/);
	});

	it("rejects incomplete submissions", () => {
		const submitBasic = findRoute("/platform/form-examples/basic");
		const submitStep = findRoute("/platform/form-examples/step");

		expect(submitBasic({ body: { title: "" } })).toMatchObject({ code: 422 });
		expect(submitStep({ body: { name: "" } })).toMatchObject({ code: 422 });
	});
});
