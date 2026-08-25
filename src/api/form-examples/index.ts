import { request } from "../client";
import type {
	FormExampleSubmission,
	SubmitBasicFormInput,
	SubmitStepFormInput,
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
