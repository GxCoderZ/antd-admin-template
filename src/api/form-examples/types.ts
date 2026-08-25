export type GoalVisibility = "1" | "2" | "3";
type ReceiverMode = "alipay" | "bank";

export type AdvancedAccessMode = "private" | "team" | "public";
export type AdvancedMemberRole = "owner" | "reviewer" | "operator";
export type AdvancedPriority = "low" | "medium" | "high";
export type AdvancedRuleCondition = "amount" | "region" | "schedule";

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

export interface AdvancedFormMember {
	email: string;
	name: string;
	role: AdvancedMemberRole;
	weight: number;
}

export interface AdvancedFormRule {
	action: string;
	condition: AdvancedRuleCondition;
	name: string;
}

export interface AdvancedFormPayload {
	accessMode: AdvancedAccessMode;
	approvers?: string[];
	description: string;
	enableApproval: boolean;
	endAt: string;
	members: AdvancedFormMember[];
	notifyChannels: string[];
	notifyOwner: boolean;
	priority: AdvancedPriority;
	projectCode: string;
	projectName: string;
	rule: AdvancedFormRule;
	startAt: string;
	teamScope?: string;
}

export interface AdvancedFormDraft extends AdvancedFormPayload {
	updatedAt: string;
}

export interface AdvancedFormCodeValidation {
	available: boolean;
	message?: string;
}

export interface ValidateAdvancedProjectCodeInput {
	projectCode: string;
}

export interface FormExampleSubmission {
	id: string;
	submittedAt: string;
}
