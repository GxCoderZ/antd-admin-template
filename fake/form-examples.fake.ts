import { defineFakeRoute } from "vite-plugin-fake-server/client";

import type {
	AdvancedFormDraft,
	AdvancedFormPayload,
	SubmitBasicFormInput,
	SubmitStepFormInput,
	ValidateAdvancedProjectCodeInput,
} from "../src/api/form-examples";
import { resultError, resultSuccess } from "./utils";

let submissionSequence = 0;
const reservedProjectCodes = new Set(["OPS-LOCKED", "DEMO-USED"]);
let advancedDraft: AdvancedFormDraft = {
	accessMode: "team",
	approvers: ["lead"],
	description:
		"沉淀可复用的跨部门协作表单资产，覆盖常见联动、成员规则和提交反馈。",
	enableApproval: true,
	endAt: "2026-09-30T00:00:00.000Z",
	members: [
		{
			email: "alex@example.com",
			name: "Alex",
			role: "owner",
			weight: 60,
		},
		{
			email: "casey@example.com",
			name: "Casey",
			role: "reviewer",
			weight: 40,
		},
	],
	notifyChannels: ["mail", "message"],
	notifyOwner: true,
	priority: "medium",
	projectCode: "FORM-ASSET-2026",
	projectName: "高级表单资产",
	rule: {
		action: "自动通知项目负责人复核提交材料。",
		condition: "amount",
		name: "预算超限复核",
	},
	startAt: "2026-09-01T00:00:00.000Z",
	teamScope: "platform",
	updatedAt: "2026-08-26T00:00:00.000Z",
};

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

function isStringArray(value: unknown) {
	return (
		Array.isArray(value) && value.every((item) => typeof item === "string")
	);
}

function isAdvancedFormPayload(
	input: Partial<AdvancedFormPayload>,
): input is AdvancedFormPayload {
	const memberWeightTotal =
		input.members?.reduce((total, member) => total + member.weight, 0) ?? 0;
	const normalizedProjectCode =
		typeof input.projectCode === "string"
			? input.projectCode.trim().toUpperCase()
			: "";

	return (
		(input.accessMode === "private" ||
			input.accessMode === "team" ||
			input.accessMode === "public") &&
		(input.accessMode !== "team" || isNonEmptyText(input.teamScope)) &&
		(input.approvers === undefined || isStringArray(input.approvers)) &&
		isNonEmptyText(input.description) &&
		typeof input.enableApproval === "boolean" &&
		(!input.enableApproval ||
			(Array.isArray(input.approvers) && input.approvers.length > 0)) &&
		isIsoDate(input.endAt) &&
		Array.isArray(input.members) &&
		input.members.length > 0 &&
		input.members.every(
			(member) =>
				isNonEmptyText(member.name) &&
				isNonEmptyText(member.email) &&
				(member.role === "owner" ||
					member.role === "reviewer" ||
					member.role === "operator") &&
				typeof member.weight === "number" &&
				Number.isFinite(member.weight) &&
				member.weight > 0 &&
				member.weight <= 100,
		) &&
		memberWeightTotal === 100 &&
		isStringArray(input.notifyChannels) &&
		typeof input.notifyOwner === "boolean" &&
		(input.priority === "low" ||
			input.priority === "medium" ||
			input.priority === "high") &&
		isNonEmptyText(input.projectCode) &&
		!reservedProjectCodes.has(normalizedProjectCode) &&
		isNonEmptyText(input.projectName) &&
		input.rule !== undefined &&
		isNonEmptyText(input.rule.name) &&
		(input.rule.condition === "amount" ||
			input.rule.condition === "region" ||
			input.rule.condition === "schedule") &&
		isNonEmptyText(input.rule.action) &&
		isIsoDate(input.startAt)
	);
}

function createSubmission(prefix: "advanced" | "basic" | "step") {
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
	{
		method: "get",
		url: "/platform/form-examples/advanced/draft",
		response: () => resultSuccess(advancedDraft),
	},
	{
		method: "post",
		url: "/platform/form-examples/advanced/draft",
		response: ({ body }) => {
			const input = body as Partial<AdvancedFormPayload>;
			if (!isAdvancedFormPayload(input)) {
				return resultError("Invalid advanced form draft", 422);
			}
			advancedDraft = { ...input, updatedAt: new Date().toISOString() };
			return resultSuccess(createSubmission("advanced"));
		},
	},
	{
		method: "post",
		url: "/platform/form-examples/advanced/submit",
		response: ({ body }) => {
			const input = body as Partial<AdvancedFormPayload>;
			if (!isAdvancedFormPayload(input)) {
				return resultError("Invalid advanced form submission", 422);
			}
			advancedDraft = { ...input, updatedAt: new Date().toISOString() };
			return resultSuccess(createSubmission("advanced"));
		},
	},
	{
		method: "post",
		url: "/platform/form-examples/advanced/validate-code",
		response: ({ body }) => {
			const input = body as Partial<ValidateAdvancedProjectCodeInput>;
			const normalized = input.projectCode?.trim().toUpperCase();
			if (!normalized) {
				return resultError("Invalid project code", 422);
			}

			return resultSuccess(
				reservedProjectCodes.has(normalized)
					? {
							available: false,
							message: "项目编码已被占用",
						}
					: { available: true },
			);
		},
	},
]);
