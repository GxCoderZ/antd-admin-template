import { useMutation } from "@tanstack/react-query";
import {
	Alert,
	Button,
	Card,
	Descriptions,
	Divider,
	Flex,
	Form,
	Input,
	InputNumber,
	Result,
	Select,
	Space,
	Statistic,
	Steps,
	theme,
	Typography,
} from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import {
	submitStepForm,
	type SubmitStepFormInput,
} from "#src/api/form-examples";
import { getFormExampleProblemDetail } from "./formExampleProblems";

type StepDetailsValues = Omit<SubmitStepFormInput, "password">;

interface StepConfirmationValues {
	password: string;
}

const initialStepData: StepDetailsValues = {
	amount: 500,
	payAccount: "ant-design@alipay.com",
	receiverAccount: "test@example.com",
	receiverMode: "alipay",
	receiverName: "Alex",
};

const mediumControlStyle = { maxWidth: "100%", width: 328 } as const;

interface StepDescriptionsProps {
	bordered?: boolean;
	stepData: StepDetailsValues;
}

function StepDescriptions({ bordered, stepData }: StepDescriptionsProps) {
	const { t } = useTranslation();

	return (
		<Descriptions
			{...(bordered === undefined ? {} : { bordered })}
			column={1}
			items={[
				{
					children: stepData.payAccount,
					key: "payAccount",
					label: t("adminShell.formExamples.step.fields.payAccount"),
				},
				{
					children: stepData.receiverAccount,
					key: "receiverAccount",
					label: t("adminShell.formExamples.step.fields.receiverAccount"),
				},
				{
					children: stepData.receiverName,
					key: "receiverName",
					label: t("adminShell.formExamples.step.fields.receiverName"),
				},
				{
					children: (
						<Statistic
							precision={2}
							suffix={
								<span style={{ fontSize: 14 }}>
									{t("adminShell.formExamples.step.amountSuffix")}
								</span>
							}
							value={stepData.amount}
						/>
					),
					key: "amount",
					label: t("adminShell.formExamples.step.fields.amount"),
				},
			]}
		/>
	);
}

export function StepFormPage() {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const [detailsForm] = Form.useForm<StepDetailsValues>();
	const [confirmationForm] = Form.useForm<StepConfirmationValues>();
	const [currentStep, setCurrentStep] = useState(0);
	const [stepData, setStepData] = useState<StepDetailsValues>(initialStepData);
	const mutation = useMutation({
		mutationFn: submitStepForm,
		onSuccess: () => setCurrentStep(2),
	});

	const restart = () => {
		detailsForm.setFieldsValue(initialStepData);
		confirmationForm.resetFields();
		mutation.reset();
		setStepData(initialStepData);
		setCurrentStep(0);
	};

	const resultStyle = {
		margin: "0 auto",
		maxWidth: 560,
		padding: "24px 0 8px",
	} as const;

	return (
		<Flex gap={token.marginLG} vertical>
			<Typography.Paragraph
				style={{ color: token.colorTextSecondary, margin: 0 }}
			>
				{t("adminShell.formExamples.step.description")}
			</Typography.Paragraph>
			<Card variant="borderless">
				<Flex gap={token.marginXL} vertical>
					<Steps
						current={currentStep}
						items={(["details", "confirm", "complete"] as const).map(
							(step) => ({
								title: t(`adminShell.formExamples.step.steps.${step}`),
							}),
						)}
						responsive
						style={{ margin: "0 auto", maxWidth: 750 }}
					/>

					{currentStep === 0 ? (
						<Form<StepDetailsValues>
							form={detailsForm}
							initialValues={stepData}
							layout="vertical"
							onFinish={(values) => {
								setStepData(values);
								setCurrentStep(1);
							}}
							requiredMark={false}
							style={{ margin: "0 auto", maxWidth: 500 }}
						>
							<Form.Item
								label={t("adminShell.formExamples.step.fields.payAccount")}
								name="payAccount"
								rules={[
									{
										message: t(
											"adminShell.formExamples.step.validation.payAccount",
										),
										required: true,
									},
								]}
							>
								<Select
									options={[
										{
											label: "ant-design@alipay.com",
											value: "ant-design@alipay.com",
										},
									]}
									style={mediumControlStyle}
								/>
							</Form.Item>
							<Form.Item
								label={t("adminShell.formExamples.step.fields.receiverAccount")}
								required
							>
								<Space.Compact block style={mediumControlStyle}>
									<Form.Item<StepDetailsValues>
										name="receiverMode"
										noStyle
										rules={[
											{
												message: t(
													"adminShell.formExamples.step.validation.receiverMode",
												),
												required: true,
											},
										]}
									>
										<Select
											aria-label={t(
												"adminShell.formExamples.step.fields.receiverMode",
											)}
											options={(["alipay", "bank"] as const).map((value) => ({
												label: t(
													`adminShell.formExamples.step.receiverModes.${value}`,
												),
												value,
											}))}
											style={{ flex: "0 0 116px" }}
										/>
									</Form.Item>
									<Form.Item<StepDetailsValues>
										name="receiverAccount"
										noStyle
										rules={[
											{
												message: t(
													"adminShell.formExamples.step.validation.receiverAccount",
												),
												required: true,
											},
											{
												message: t(
													"adminShell.formExamples.step.validation.email",
												),
												type: "email",
											},
										]}
									>
										<Input
											aria-label={t(
												"adminShell.formExamples.step.fields.receiverAccount",
											)}
											placeholder={t(
												"adminShell.formExamples.step.placeholders.receiverAccount",
											)}
											style={{ minWidth: 0 }}
										/>
									</Form.Item>
								</Space.Compact>
								<Form.Item noStyle shouldUpdate>
									{({ getFieldError }) => (
										<Form.ErrorList
											errors={[
												...getFieldError("receiverMode"),
												...getFieldError("receiverAccount"),
											]}
										/>
									)}
								</Form.Item>
							</Form.Item>
							<Form.Item
								label={t("adminShell.formExamples.step.fields.receiverName")}
								name="receiverName"
								rules={[
									{
										message: t(
											"adminShell.formExamples.step.validation.receiverName",
										),
										required: true,
										whitespace: true,
									},
								]}
							>
								<Input
									placeholder={t(
										"adminShell.formExamples.step.placeholders.receiverName",
									)}
									style={mediumControlStyle}
								/>
							</Form.Item>
							<Form.Item
								label={t("adminShell.formExamples.step.fields.amount")}
								name="amount"
								rules={[
									{
										message: t(
											"adminShell.formExamples.step.validation.amount",
										),
										required: true,
									},
									{
										message: t(
											"adminShell.formExamples.step.validation.validAmount",
										),
										pattern: /^(\d+)((?:\.\d+)?)$/,
									},
								]}
							>
								<InputNumber
									min={0.01}
									placeholder={t(
										"adminShell.formExamples.step.placeholders.amount",
									)}
									prefix={t("adminShell.formExamples.step.currencyPrefix")}
									style={mediumControlStyle}
								/>
							</Form.Item>
							<Button htmlType="submit" type="primary">
								{t("adminShell.formExamples.step.next")}
							</Button>
						</Form>
					) : null}

					{currentStep === 1 ? (
						<Form<StepConfirmationValues>
							form={confirmationForm}
							layout="vertical"
							onFinish={({ password }) =>
								mutation.mutate({ ...stepData, password: password.trim() })
							}
							requiredMark={false}
							style={resultStyle}
						>
							<Alert
								closable
								showIcon
								style={{ marginBottom: 24 }}
								title={t("adminShell.formExamples.step.confirmHint")}
							/>
							{mutation.isError ? (
								<Alert
									description={
										getFormExampleProblemDetail(mutation.error) ??
										t("adminShell.formExamples.common.errorFallback")
									}
									showIcon
									style={{ marginBottom: 24 }}
									title={t("adminShell.formExamples.step.submitError")}
									type="error"
								/>
							) : null}
							<StepDescriptions bordered stepData={stepData} />
							<Divider style={{ margin: "24px 0" }} />
							<Form.Item
								label={t("adminShell.formExamples.step.fields.password")}
								name="password"
								rules={[
									{
										message: t(
											"adminShell.formExamples.step.validation.password",
										),
										required: true,
									},
								]}
							>
								<Input.Password
									placeholder={t(
										"adminShell.formExamples.step.placeholders.password",
									)}
									style={mediumControlStyle}
								/>
							</Form.Item>
							<Space>
								<Button
									disabled={mutation.isPending}
									onClick={() => {
										mutation.reset();
										setCurrentStep(0);
									}}
								>
									{t("adminShell.formExamples.step.previous")}
								</Button>
								<Button
									htmlType="submit"
									loading={mutation.isPending}
									type="primary"
								>
									{t("adminShell.formExamples.common.submit")}
								</Button>
							</Space>
						</Form>
					) : null}

					{currentStep === 2 ? (
						<Result
							extra={
								<>
									<Button onClick={restart} type="primary">
										{t("adminShell.formExamples.step.restart")}
									</Button>
									<Button>{t("adminShell.formExamples.step.viewBill")}</Button>
								</>
							}
							status="success"
							style={resultStyle}
							subTitle={t("adminShell.formExamples.step.resultSubtitle")}
							title={t("adminShell.formExamples.step.resultTitle")}
						>
							<StepDescriptions stepData={stepData} />
						</Result>
					) : null}

					<Divider style={{ margin: "40px 0 24px" }} />
					<Flex gap={token.marginSM} vertical>
						<Typography.Title level={5} style={{ margin: 0 }}>
							{t("adminShell.formExamples.step.explanation.title")}
						</Typography.Title>
						<Typography.Text strong>
							{t("adminShell.formExamples.step.explanation.alipayTitle")}
						</Typography.Text>
						<Typography.Paragraph style={{ margin: 0 }}>
							{t("adminShell.formExamples.step.explanation.content")}
						</Typography.Paragraph>
						<Typography.Text strong>
							{t("adminShell.formExamples.step.explanation.bankTitle")}
						</Typography.Text>
						<Typography.Paragraph style={{ margin: 0 }}>
							{t("adminShell.formExamples.step.explanation.content")}
						</Typography.Paragraph>
					</Flex>
				</Flex>
			</Card>
		</Flex>
	);
}
