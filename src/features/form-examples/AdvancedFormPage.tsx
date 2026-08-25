import {
	DeleteOutlined,
	PlusOutlined,
	SaveOutlined,
	SendOutlined,
} from "@ant-design/icons";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
	Alert,
	Button,
	Card,
	DatePicker,
	Divider,
	Flex,
	Form,
	Input,
	InputNumber,
	message,
	Radio,
	Result,
	Select,
	Skeleton,
	Space,
	Switch,
	theme,
	Typography,
} from "antd";
import type { FormProps } from "antd";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import {
	getAdvancedFormDraft,
	saveAdvancedFormDraft,
	submitAdvancedForm,
	validateAdvancedProjectCode,
	type AdvancedAccessMode,
	type AdvancedFormDraft,
	type AdvancedFormMember,
	type AdvancedFormPayload,
	type AdvancedFormRule,
	type AdvancedMemberRole,
	type AdvancedPriority,
	type AdvancedRuleCondition,
} from "#src/api/form-examples";
import { getFormExampleProblemDetail } from "./formExampleProblems";

interface AdvancedFormValues {
	accessMode: AdvancedAccessMode;
	approvers?: string[];
	description: string;
	effectiveRange: [Dayjs, Dayjs];
	enableApproval: boolean;
	members: AdvancedFormMember[];
	notifyChannels: string[];
	notifyOwner: boolean;
	priority: AdvancedPriority;
	projectCode: string;
	projectName: string;
	rule: AdvancedFormRule;
	teamScope?: string;
}

const wideControlStyle = { maxWidth: "100%", width: 552 } as const;
const mediumControlStyle = { maxWidth: "100%", width: 328 } as const;

function toFormValues(draft: AdvancedFormDraft): AdvancedFormValues {
	return {
		...draft,
		effectiveRange: [dayjs(draft.startAt), dayjs(draft.endAt)],
		members: draft.members.map((member) => ({ ...member })),
		rule: { ...draft.rule },
	};
}

function toPayload(values: AdvancedFormValues): AdvancedFormPayload {
	return {
		accessMode: values.accessMode,
		...(values.enableApproval && values.approvers?.length
			? { approvers: values.approvers }
			: {}),
		description: values.description.trim(),
		enableApproval: values.enableApproval,
		endAt: values.effectiveRange[1].toISOString(),
		members: values.members.map((member) => ({
			email: member.email.trim(),
			name: member.name.trim(),
			role: member.role,
			weight: member.weight,
		})),
		notifyChannels: values.notifyChannels,
		notifyOwner: values.notifyOwner,
		priority: values.priority,
		projectCode: values.projectCode.trim().toUpperCase(),
		projectName: values.projectName.trim(),
		rule: {
			action: values.rule.action.trim(),
			condition: values.rule.condition,
			name: values.rule.name.trim(),
		},
		startAt: values.effectiveRange[0].toISOString(),
		...(values.accessMode === "team" && values.teamScope
			? { teamScope: values.teamScope }
			: {}),
	};
}

export function AdvancedFormPage() {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const [form] = Form.useForm<AdvancedFormValues>();
	const [messageApi, messageContext] = message.useMessage();
	const [errorSummary, setErrorSummary] = useState<string | null>(null);
	const [resultTitle, setResultTitle] = useState<string | null>(null);

	const draftQuery = useQuery({
		queryFn: getAdvancedFormDraft,
		queryKey: ["form-examples", "advanced", "draft"],
		retry: false,
	});
	const draftMutation = useMutation({
		mutationFn: saveAdvancedFormDraft,
		onError: (error) => {
			void messageApi.error(
				getFormExampleProblemDetail(error) ??
					t("adminShell.formExamples.advanced.feedback.saveError"),
			);
		},
		onSuccess: () => {
			setResultTitle(t("adminShell.formExamples.advanced.feedback.draftSaved"));
			void messageApi.success(
				t("adminShell.formExamples.advanced.feedback.draftSaved"),
			);
		},
	});
	const accessMode =
		Form.useWatch("accessMode", form) ?? draftQuery.data?.accessMode;
	const enableApproval =
		Form.useWatch("enableApproval", form) ?? draftQuery.data?.enableApproval;
	const submitMutation = useMutation({
		mutationFn: submitAdvancedForm,
		onError: (error) => {
			void messageApi.error(
				getFormExampleProblemDetail(error) ??
					t("adminShell.formExamples.common.errorFallback"),
			);
		},
		onSuccess: () => {
			setResultTitle(t("adminShell.formExamples.advanced.feedback.submitted"));
			void messageApi.success(
				t("adminShell.formExamples.advanced.feedback.submitted"),
			);
		},
	});

	const handleInvalid: FormProps<AdvancedFormValues>["onFinishFailed"] = ({
		errorFields,
	}) => {
		const firstError = errorFields[0];
		setErrorSummary(
			t("adminShell.formExamples.advanced.feedback.errorLocated"),
		);
		if (firstError) {
			form.scrollToField(firstError.name, {
				block: "center",
				focus: true,
			});
		}
	};

	const saveDraft = async () => {
		try {
			const values = await form.validateFields();
			setErrorSummary(null);
			draftMutation.mutate(toPayload(values));
		} catch {
			handleInvalid({
				errorFields: form
					.getFieldsError()
					.filter((field) => field.errors.length > 0)
					.map((field) => ({
						errors: field.errors,
						name: field.name,
						warnings: field.warnings,
					})),
				message: "Validation failed",
				outOfDate: false,
				values: form.getFieldsValue(),
			});
		}
	};

	if (draftQuery.isPending) {
		return (
			<Flex gap={token.margin} vertical>
				<Typography.Title
					level={1}
					style={{
						fontSize: token.fontSizeHeading4,
						lineHeight: `${token.controlHeight}px`,
						margin: 0,
					}}
				>
					{t("adminShell.navigation.advancedForm")}
				</Typography.Title>
				<Card variant="borderless">
					<Skeleton active paragraph={{ rows: 10 }} />
				</Card>
			</Flex>
		);
	}

	if (draftQuery.isError) {
		return (
			<Flex gap={token.margin} vertical>
				<Typography.Title
					level={1}
					style={{
						fontSize: token.fontSizeHeading4,
						lineHeight: `${token.controlHeight}px`,
						margin: 0,
					}}
				>
					{t("adminShell.navigation.advancedForm")}
				</Typography.Title>
				<Alert
					action={
						<Button onClick={() => void draftQuery.refetch()} size="small">
							{t("adminShell.formExamples.advanced.feedback.retry")}
						</Button>
					}
					description={
						getFormExampleProblemDetail(draftQuery.error) ??
						t("adminShell.formExamples.advanced.feedback.loadError")
					}
					showIcon
					type="error"
				/>
			</Flex>
		);
	}

	return (
		<Flex gap={token.margin} vertical>
			{messageContext}
			<Typography.Title
				level={1}
				style={{
					fontSize: token.fontSizeHeading4,
					lineHeight: `${token.controlHeight}px`,
					margin: 0,
				}}
			>
				{t("adminShell.navigation.advancedForm")}
			</Typography.Title>
			<Typography.Paragraph
				style={{ color: token.colorTextSecondary, margin: 0 }}
			>
				{t("adminShell.formExamples.advanced.description")}
			</Typography.Paragraph>

			{resultTitle ? (
				<Result
					status="success"
					style={{ padding: `${token.padding}px 0 0` }}
					subTitle={t("adminShell.formExamples.advanced.feedback.successHint")}
					title={resultTitle}
				/>
			) : null}

			<Card variant="borderless">
				<Form<AdvancedFormValues>
					form={form}
					initialValues={toFormValues(draftQuery.data)}
					layout="vertical"
					name="advanced"
					onFinish={(values) => {
						setErrorSummary(null);
						submitMutation.mutate(toPayload(values));
					}}
					onFinishFailed={handleInvalid}
					requiredMark={false}
					style={{ margin: "8px auto 0", maxWidth: 880 }}
					variant="filled"
				>
					{errorSummary ? (
						<Alert
							message={errorSummary}
							showIcon
							style={{ marginBottom: token.marginLG }}
							type="error"
						/>
					) : null}

					<Typography.Title level={2} style={{ fontSize: token.fontSizeLG }}>
						{t("adminShell.formExamples.advanced.sections.basic")}
					</Typography.Title>
					<div
						style={{
							display: "grid",
							gap: `0 ${token.marginLG}px`,
							gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
						}}
					>
						<Form.Item
							label={t("adminShell.formExamples.advanced.fields.projectName")}
							name="projectName"
							rules={[
								{
									message: t(
										"adminShell.formExamples.advanced.validation.projectName",
									),
									required: true,
									whitespace: true,
								},
							]}
						>
							<Input
								placeholder={t(
									"adminShell.formExamples.advanced.placeholders.projectName",
								)}
							/>
						</Form.Item>
						<Form.Item
							label={t("adminShell.formExamples.advanced.fields.projectCode")}
							name="projectCode"
							rules={[
								{
									message: t(
										"adminShell.formExamples.advanced.validation.projectCode",
									),
									pattern: /^[A-Z0-9-]{3,32}$/i,
									required: true,
								},
								{
									validator: async (_, value: string | undefined) => {
										const normalized = value?.trim();
										if (!normalized) {
											return;
										}
										const result = await validateAdvancedProjectCode({
											projectCode: normalized,
										});
										if (!result.available) {
											throw new Error(
												result.message ??
													t(
														"adminShell.formExamples.advanced.validation.projectCodeTaken",
													),
											);
										}
									},
								},
							]}
							validateTrigger="onBlur"
						>
							<Input
								placeholder={t(
									"adminShell.formExamples.advanced.placeholders.projectCode",
								)}
								style={mediumControlStyle}
							/>
						</Form.Item>
						<Form.Item
							label={t("adminShell.formExamples.advanced.fields.priority")}
							name="priority"
							rules={[
								{
									message: t(
										"adminShell.formExamples.advanced.validation.priority",
									),
									required: true,
								},
							]}
						>
							<Select
								onChange={(value: AdvancedPriority) => {
									if (value === "high") {
										form.setFieldValue("enableApproval", true);
									}
								}}
								options={(["low", "medium", "high"] as const).map((value) => ({
									label: t(
										`adminShell.formExamples.advanced.priorities.${value}`,
									),
									value,
								}))}
								style={mediumControlStyle}
							/>
						</Form.Item>
						<Form.Item
							label={t(
								"adminShell.formExamples.advanced.fields.effectiveRange",
							)}
							name="effectiveRange"
							rules={[
								{
									message: t(
										"adminShell.formExamples.advanced.validation.effectiveRange",
									),
									required: true,
								},
							]}
						>
							<DatePicker.RangePicker
								placeholder={[
									t("adminShell.formExamples.advanced.placeholders.startAt"),
									t("adminShell.formExamples.advanced.placeholders.endAt"),
								]}
								style={mediumControlStyle}
							/>
						</Form.Item>
					</div>
					<Form.Item
						label={t("adminShell.formExamples.advanced.fields.description")}
						name="description"
						rules={[
							{
								message: t(
									"adminShell.formExamples.advanced.validation.description",
								),
								required: true,
								whitespace: true,
							},
						]}
					>
						<Input.TextArea
							placeholder={t(
								"adminShell.formExamples.advanced.placeholders.description",
							)}
							rows={4}
							style={wideControlStyle}
						/>
					</Form.Item>
					<Form.Item
						label={t("adminShell.formExamples.advanced.fields.accessMode")}
						name="accessMode"
						rules={[
							{
								message: t(
									"adminShell.formExamples.advanced.validation.accessMode",
								),
								required: true,
							},
						]}
					>
						<Radio.Group
							options={(["private", "team", "public"] as const).map(
								(value) => ({
									label: t(
										`adminShell.formExamples.advanced.accessModes.${value}`,
									),
									value,
								}),
							)}
						/>
					</Form.Item>
					{accessMode === "team" ? (
						<Form.Item
							label={t("adminShell.formExamples.advanced.fields.teamScope")}
							name="teamScope"
							rules={[
								{
									message: t(
										"adminShell.formExamples.advanced.validation.teamScope",
									),
									required: true,
								},
							]}
						>
							<Select
								options={(["platform", "operation", "finance"] as const).map(
									(value) => ({
										label: t(
											`adminShell.formExamples.advanced.teamScopes.${value}`,
										),
										value,
									}),
								)}
								placeholder={t(
									"adminShell.formExamples.advanced.placeholders.teamScope",
								)}
								style={mediumControlStyle}
							/>
						</Form.Item>
					) : null}
					<Form.Item
						label={t("adminShell.formExamples.advanced.fields.enableApproval")}
						name="enableApproval"
						valuePropName="checked"
					>
						<Switch />
					</Form.Item>
					{enableApproval ? (
						<Form.Item
							label={t("adminShell.formExamples.advanced.fields.approvers")}
							name="approvers"
							rules={[
								{
									message: t(
										"adminShell.formExamples.advanced.validation.approvers",
									),
									required: true,
									type: "array",
								},
							]}
						>
							<Select
								mode="multiple"
								options={(["lead", "security", "finance"] as const).map(
									(value) => ({
										label: t(
											`adminShell.formExamples.advanced.approvers.${value}`,
										),
										value,
									}),
								)}
								placeholder={t(
									"adminShell.formExamples.advanced.placeholders.approvers",
								)}
								style={wideControlStyle}
							/>
						</Form.Item>
					) : null}

					<Divider />
					<Typography.Title level={2} style={{ fontSize: token.fontSizeLG }}>
						{t("adminShell.formExamples.advanced.sections.members")}
					</Typography.Title>
					<Form.List
						name="members"
						rules={[
							{
								validator: (_, members?: AdvancedFormMember[]) => {
									if (!members?.length) {
										return Promise.reject(
											new Error(
												t(
													"adminShell.formExamples.advanced.validation.membersRequired",
												),
											),
										);
									}
									const total = members.reduce(
										(sum, member) => sum + Number(member.weight ?? 0),
										0,
									);
									if (total !== 100) {
										return Promise.reject(
											new Error(
												t(
													"adminShell.formExamples.advanced.validation.memberWeight",
												),
											),
										);
									}
									return Promise.resolve();
								},
							},
						]}
					>
						{(fields, { add, remove }, { errors }) => (
							<Flex gap={token.marginSM} vertical>
								{fields.map((field, index) => (
									<div
										key={field.key}
										style={{
											alignItems: "start",
											display: "grid",
											gap: token.marginSM,
											gridTemplateColumns:
												"repeat(auto-fit, minmax(148px, 1fr)) auto",
										}}
									>
										<Form.Item
											label={t(
												"adminShell.formExamples.advanced.fields.memberName",
											)}
											name={[field.name, "name"]}
											rules={[
												{
													message: t(
														"adminShell.formExamples.advanced.validation.memberName",
													),
													required: true,
													whitespace: true,
												},
											]}
										>
											<Input
												placeholder={t(
													"adminShell.formExamples.advanced.placeholders.memberName",
												)}
											/>
										</Form.Item>
										<Form.Item
											label={t(
												"adminShell.formExamples.advanced.fields.memberEmail",
											)}
											name={[field.name, "email"]}
											rules={[
												{
													message: t(
														"adminShell.formExamples.advanced.validation.memberEmail",
													),
													required: true,
													type: "email",
												},
											]}
										>
											<Input
												placeholder={t(
													"adminShell.formExamples.advanced.placeholders.memberEmail",
												)}
											/>
										</Form.Item>
										<Form.Item
											label={t(
												"adminShell.formExamples.advanced.fields.memberRole",
											)}
											name={[field.name, "role"]}
											rules={[
												{
													message: t(
														"adminShell.formExamples.advanced.validation.memberRole",
													),
													required: true,
												},
											]}
										>
											<Select
												options={(
													["owner", "reviewer", "operator"] as const
												).map((value: AdvancedMemberRole) => ({
													label: t(
														`adminShell.formExamples.advanced.memberRoles.${value}`,
													),
													value,
												}))}
											/>
										</Form.Item>
										<Form.Item
											label={t(
												"adminShell.formExamples.advanced.fields.memberWeight",
											)}
											name={[field.name, "weight"]}
											rules={[
												{
													message: t(
														"adminShell.formExamples.advanced.validation.memberWeightValue",
													),
													required: true,
													type: "number",
												},
											]}
										>
											<InputNumber<number>
												max={100}
												min={1}
												style={{ width: "100%" }}
											/>
										</Form.Item>
										<Button
											aria-label={t(
												"adminShell.formExamples.advanced.removeMember",
												{ index: index + 1 },
											)}
											danger
											disabled={fields.length === 1}
											icon={<DeleteOutlined />}
											onClick={() => remove(field.name)}
											style={{ marginTop: token.controlHeight }}
											type="text"
										/>
									</div>
								))}
								<Form.ErrorList errors={errors} />
								<Button
									aria-label={t("adminShell.formExamples.advanced.addMember")}
									icon={<PlusOutlined />}
									onClick={() =>
										add({
											email: "",
											name: "",
											role: "operator",
											weight: 1,
										})
									}
									style={{ width: "fit-content" }}
								>
									{t("adminShell.formExamples.advanced.addMember")}
								</Button>
							</Flex>
						)}
					</Form.List>

					<Divider />
					<Typography.Title level={2} style={{ fontSize: token.fontSizeLG }}>
						{t("adminShell.formExamples.advanced.sections.rule")}
					</Typography.Title>
					<div
						style={{
							display: "grid",
							gap: `0 ${token.marginLG}px`,
							gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
						}}
					>
						<Form.Item
							label={t("adminShell.formExamples.advanced.fields.ruleName")}
							name={["rule", "name"]}
							rules={[
								{
									message: t(
										"adminShell.formExamples.advanced.validation.ruleName",
									),
									required: true,
									whitespace: true,
								},
							]}
						>
							<Input
								placeholder={t(
									"adminShell.formExamples.advanced.placeholders.ruleName",
								)}
							/>
						</Form.Item>
						<Form.Item
							label={t("adminShell.formExamples.advanced.fields.ruleCondition")}
							name={["rule", "condition"]}
							rules={[
								{
									message: t(
										"adminShell.formExamples.advanced.validation.ruleCondition",
									),
									required: true,
								},
							]}
						>
							<Select
								options={(["amount", "region", "schedule"] as const).map(
									(value: AdvancedRuleCondition) => ({
										label: t(
											`adminShell.formExamples.advanced.ruleConditions.${value}`,
										),
										value,
									}),
								)}
							/>
						</Form.Item>
					</div>
					<Form.Item
						label={t("adminShell.formExamples.advanced.fields.ruleAction")}
						name={["rule", "action"]}
						rules={[
							{
								message: t(
									"adminShell.formExamples.advanced.validation.ruleAction",
								),
								required: true,
								whitespace: true,
							},
						]}
					>
						<Input.TextArea
							placeholder={t(
								"adminShell.formExamples.advanced.placeholders.ruleAction",
							)}
							rows={3}
							style={wideControlStyle}
						/>
					</Form.Item>

					<Divider />
					<Typography.Title level={2} style={{ fontSize: token.fontSizeLG }}>
						{t("adminShell.formExamples.advanced.sections.notify")}
					</Typography.Title>
					<Form.Item
						label={t("adminShell.formExamples.advanced.fields.notifyOwner")}
						name="notifyOwner"
						valuePropName="checked"
					>
						<Switch />
					</Form.Item>
					<Form.Item
						label={t("adminShell.formExamples.advanced.fields.notifyChannels")}
						name="notifyChannels"
						rules={[
							{
								message: t(
									"adminShell.formExamples.advanced.validation.notifyChannels",
								),
								required: true,
								type: "array",
							},
						]}
					>
						<Select
							mode="multiple"
							options={(["mail", "message", "todo"] as const).map((value) => ({
								label: t(
									`adminShell.formExamples.advanced.notifyChannels.${value}`,
								),
								value,
							}))}
							placeholder={t(
								"adminShell.formExamples.advanced.placeholders.notifyChannels",
							)}
							style={wideControlStyle}
						/>
					</Form.Item>
					<Form.Item style={{ marginBottom: 0 }}>
						<Space wrap>
							<Button
								disabled={draftMutation.isPending || submitMutation.isPending}
								onClick={() => {
									form.setFieldsValue(toFormValues(draftQuery.data));
									setErrorSummary(null);
									setResultTitle(null);
								}}
							>
								{t("adminShell.formExamples.common.reset")}
							</Button>
							<Button
								aria-label={t("adminShell.formExamples.advanced.saveDraft")}
								icon={<SaveOutlined />}
								loading={draftMutation.isPending}
								onClick={() => void saveDraft()}
							>
								{t("adminShell.formExamples.advanced.saveDraft")}
							</Button>
							<Button
								htmlType="submit"
								icon={<SendOutlined />}
								loading={submitMutation.isPending}
								type="primary"
							>
								{t("adminShell.formExamples.common.submit")}
							</Button>
						</Space>
					</Form.Item>
				</Form>
			</Card>
		</Flex>
	);
}
