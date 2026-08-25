export type BasicFormCategory = "operation" | "project" | "other";
export type FormPriority = "high" | "low" | "normal";

export interface SubmitBasicFormInput {
	category: BasicFormCategory;
	endAt: string;
	notify: boolean;
	owner: string;
	priority: FormPriority;
	startAt: string;
	summary: string;
	title: string;
}

export interface SubmitStepFormInput {
	name: string;
	notes?: string;
	owner: string;
	scheduledAt: string;
}

export interface FormExampleSubmission {
	id: string;
	submittedAt: string;
}
