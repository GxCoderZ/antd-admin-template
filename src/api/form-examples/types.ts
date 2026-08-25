export type GoalVisibility = "1" | "2" | "3";
type ReceiverMode = "alipay" | "bank";

export interface SubmitBasicFormInput {
	client?: string;
	endAt: string;
	goal: string;
	invites?: string;
	publicType: GoalVisibility;
	publicUsers?: string;
	startAt: string;
	standard: string;
	title: string;
	weight?: number;
}

export interface SubmitStepFormInput {
	amount: number;
	password: string;
	payAccount: string;
	receiverAccount: string;
	receiverMode: ReceiverMode;
	receiverName: string;
}

export interface FormExampleSubmission {
	id: string;
	submittedAt: string;
}
