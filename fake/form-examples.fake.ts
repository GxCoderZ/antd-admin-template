import { defineFakeRoute } from "vite-plugin-fake-server/client";

import type {
	SubmitBasicFormInput,
	SubmitStepFormInput,
} from "../src/api/form-examples";
import { resultError, resultSuccess } from "./utils";

let submissionSequence = 0;

function isNonEmptyText(value: unknown) {
	return typeof value === "string" && value.trim().length > 0;
}

function isIsoDate(value: unknown) {
	return typeof value === "string" && Number.isFinite(Date.parse(value));
}

function isBasicFormInput(
	input: Partial<SubmitBasicFormInput>,
): input is SubmitBasicFormInput {
	return (
		(input.category === "operation" ||
			input.category === "project" ||
			input.category === "other") &&
		isIsoDate(input.endAt) &&
		typeof input.notify === "boolean" &&
		isNonEmptyText(input.owner) &&
		(input.priority === "high" ||
			input.priority === "low" ||
			input.priority === "normal") &&
		isIsoDate(input.startAt) &&
		isNonEmptyText(input.summary) &&
		isNonEmptyText(input.title)
	);
}

function isStepFormInput(
	input: Partial<SubmitStepFormInput>,
): input is SubmitStepFormInput {
	return (
		isNonEmptyText(input.name) &&
		isNonEmptyText(input.owner) &&
		isIsoDate(input.scheduledAt) &&
		(input.notes === undefined || typeof input.notes === "string")
	);
}

function createSubmission(prefix: "basic" | "step") {
	submissionSequence += 1;
	return {
		id: `${prefix}-${Date.now()}-${submissionSequence}`,
		submittedAt: new Date().toISOString(),
	};
}

export default defineFakeRoute([
	{
		method: "post",
		url: "/platform/form-examples/basic",
		response: ({ body }) => {
			const input = body as Partial<SubmitBasicFormInput>;
			return isBasicFormInput(input)
				? resultSuccess(createSubmission("basic"))
				: resultError("Invalid basic form submission", 422);
		},
	},
	{
		method: "post",
		url: "/platform/form-examples/step",
		response: ({ body }) => {
			const input = body as Partial<SubmitStepFormInput>;
			return isStepFormInput(input)
				? resultSuccess(createSubmission("step"))
				: resultError("Invalid step form submission", 422);
		},
	},
]);
