import { request } from "../client";
import type {
	AdvancedFormCodeValidation,
	AdvancedFormDraft,
	AdvancedFormPayload,
	FormExampleSubmission,
	SubmitBasicFormInput,
	SubmitStepFormInput,
	ValidateAdvancedProjectCodeInput,
} from "./types";

export * from "./types";

export function submitBasicForm(input: SubmitBasicFormInput) {
	return request<FormExampleSubmission>("/platform/form-examples/basic", {
		body: input,
		method: "POST",
	});
}

export function submitStepForm(input: SubmitStepFormInput) {
	return request<FormExampleSubmission>("/platform/form-examples/step", {
		body: input,
		method: "POST",
	});
}

export function getAdvancedFormDraft() {
	return request<AdvancedFormDraft>("/platform/form-examples/advanced/draft");
}

export function saveAdvancedFormDraft(input: AdvancedFormPayload) {
	return request<FormExampleSubmission>(
		"/platform/form-examples/advanced/draft",
		{
			body: input,
			method: "POST",
		},
	);
}

export function submitAdvancedForm(input: AdvancedFormPayload) {
	return request<FormExampleSubmission>(
		"/platform/form-examples/advanced/submit",
		{
			body: input,
			method: "POST",
		},
	);
}

export function validateAdvancedProjectCode(
	input: ValidateAdvancedProjectCodeInput,
) {
	return request<AdvancedFormCodeValidation>(
		"/platform/form-examples/advanced/validate-code",
		{
			body: input,
			method: "POST",
		},
	);
}
