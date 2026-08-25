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

function isOptionalText(value: unknown) {
	return value === undefined || typeof value === "string";
}

function isBasicFormInput(
	input: Partial<SubmitBasicFormInput>,
): input is SubmitBasicFormInput {
	return (
		isOptionalText(input.client) &&
		isIsoDate(input.endAt) &&
		isNonEmptyText(input.goal) &&
		isOptionalText(input.invites) &&
		(input.publicType === "1" ||
			input.publicType === "2" ||
			input.publicType === "3") &&
		isOptionalText(input.publicUsers) &&
		isIsoDate(input.startAt) &&
		isNonEmptyText(input.standard) &&
		isNonEmptyText(input.title) &&
		(input.weight === undefined ||
			(typeof input.weight === "number" &&
				input.weight >= 0 &&
				input.weight <= 100))
	);
}

function isStepFormInput(
	input: Partial<SubmitStepFormInput>,
): input is SubmitStepFormInput {
	return (
		typeof input.amount === "number" &&
		Number.isFinite(input.amount) &&
		input.amount > 0 &&
		isNonEmptyText(input.password) &&
		isNonEmptyText(input.payAccount) &&
		isNonEmptyText(input.receiverAccount) &&
		(input.receiverMode === "alipay" || input.receiverMode === "bank") &&
		isNonEmptyText(input.receiverName)
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
