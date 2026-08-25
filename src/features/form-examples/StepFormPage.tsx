import {
	ArrowLeftOutlined,
	ArrowRightOutlined,
	CheckOutlined,
	ReloadOutlined,
} from "@ant-design/icons";
import { useMutation } from "@tanstack/react-query";
import {
	Alert,
	Button,
	Card,
	DatePicker,
	Descriptions,
	Flex,
	Form,
	Input,
	Result,
	Space,
	Steps,
	theme,
} from "antd";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { submitStepForm } from "#src/api/form-examples";
import { getFormExampleProblemDetail } from "./formExampleProblems";

interface StepFormValues {
	name: string;
	notes?: string;
	owner: string;
	scheduledAt: Dayjs;
}

const initialValues: StepFormValues = {
	name: "",
	notes: "",
	owner: "",
	scheduledAt: dayjs().add(1, "day").startOf("day"),
};

export function StepFormPage() {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const [form] = Form.useForm<StepFormValues>();
	const [currentStep, setCurrentStep] = useState(0);
	const [values, setValues] = useState<StepFormValues | null>(null);
	const mutation = useMutation({
		mutationFn: submitStepForm,
		onSuccess: () => setCurrentStep(2),
	});

	const proceedToConfirmation = async () => {
		const nextValues = await form.validateFields();
		setValues(nextValues);
		setCurrentStep(1);
	};

	const restart = () => {
		form.resetFields();
		mutation.reset();
		setValues(null);
		setCurrentStep(0);
	};

	return (
		<Card>
			<Flex gap={token.marginXL} vertical>
				<Steps
					current={currentStep}
					items={(["details", "confirm", "complete"] as const).map((step) => ({
						title: t(`adminShell.formExamples.step.steps.${step}`),
					}))}
					responsive
				/>
				<Flex justify="center">
					<div style={{ maxWidth: token.screenSM, width: "100%" }}>
						{currentStep === 0 ? (
							<Form<StepFormValues>
								form={form}
								initialValues={initialValues}
								layout="vertical"
								onFinish={() => void proceedToConfirmation()}
							>
								<Form.Item
									label={t("adminShell.formExamples.step.fields.name")}
									name="name"
									rules={[
										{
											max: 80,
											message: t(
												"adminShell.formExamples.step.validation.name",
											),
											required: true,
											whitespace: true,
										},
									]}
								>
									<Input
										maxLength={80}
										placeholder={t(
											"adminShell.formExamples.step.placeholders.name",
										)}
									/>
								</Form.Item>
								<Form.Item
									label={t("adminShell.formExamples.step.fields.owner")}
									name="owner"
									rules={[
										{
											max: 40,
											message: t(
												"adminShell.formExamples.step.validation.owner",
											),
											required: true,
											whitespace: true,
										},
									]}
								>
									<Input
										maxLength={40}
										placeholder={t(
											"adminShell.formExamples.step.placeholders.owner",
										)}
									/>
								</Form.Item>
								<Form.Item
									label={t("adminShell.formExamples.step.fields.scheduledAt")}
									name="scheduledAt"
									rules={[{ required: true }]}
								>
									<DatePicker
										allowClear={false}
										placeholder={t(
											"adminShell.formExamples.step.placeholders.scheduledAt",
										)}
										style={{ width: "100%" }}
									/>
								</Form.Item>
								<Form.Item
									label={t("adminShell.formExamples.step.fields.notes")}
									name="notes"
									rules={[
										{
											max: 300,
											message: t(
												"adminShell.formExamples.step.validation.notes",
											),
										},
									]}
								>
									<Input.TextArea
										maxLength={300}
										placeholder={t(
											"adminShell.formExamples.step.placeholders.notes",
										)}
										rows={4}
										showCount
									/>
								</Form.Item>
								<Button
									htmlType="submit"
									icon={<ArrowRightOutlined aria-hidden />}
									type="primary"
								>
									{t("adminShell.formExamples.step.next")}
								</Button>
							</Form>
						) : null}
						{currentStep === 1 && values ? (
							<Flex gap={token.margin} vertical>
								{mutation.isError ? (
									<Alert
										description={
											getFormExampleProblemDetail(mutation.error) ??
											t("adminShell.formExamples.common.errorFallback")
										}
										showIcon
										title={t("adminShell.formExamples.step.submitError")}
										type="error"
									/>
								) : null}
								<Alert
									showIcon
									title={t("adminShell.formExamples.step.confirmHint")}
									type="info"
								/>
								<Descriptions
									bordered
									column={1}
									items={[
										{
											children: values.name,
											key: "name",
											label: t("adminShell.formExamples.step.fields.name"),
										},
										{
											children: values.owner,
											key: "owner",
											label: t("adminShell.formExamples.step.fields.owner"),
										},
										{
											children: values.scheduledAt.format("YYYY-MM-DD"),
											key: "scheduledAt",
											label: t(
												"adminShell.formExamples.step.fields.scheduledAt",
											),
										},
										{
											children:
												values.notes ||
												t("adminShell.formExamples.step.noNotes"),
											key: "notes",
											label: t("adminShell.formExamples.step.fields.notes"),
										},
									]}
									size="small"
								/>
								<Space wrap>
									<Button
										disabled={mutation.isPending}
										icon={<ArrowLeftOutlined aria-hidden />}
										onClick={() => {
											mutation.reset();
											setCurrentStep(0);
										}}
									>
										{t("adminShell.formExamples.step.previous")}
									</Button>
									<Button
										icon={<CheckOutlined aria-hidden />}
										loading={mutation.isPending}
										onClick={() =>
											mutation.mutate({
												name: values.name.trim(),
												...(values.notes?.trim()
													? { notes: values.notes.trim() }
													: {}),
												owner: values.owner.trim(),
												scheduledAt: values.scheduledAt.toISOString(),
											})
										}
										type="primary"
									>
										{t("adminShell.formExamples.step.confirmSubmit")}
									</Button>
								</Space>
							</Flex>
						) : null}
						{currentStep === 2 && mutation.data ? (
							<Result
								extra={
									<Button
										icon={<ReloadOutlined aria-hidden />}
										onClick={restart}
										type="primary"
									>
										{t("adminShell.formExamples.step.restart")}
									</Button>
								}
								status="success"
								subTitle={t("adminShell.formExamples.common.submissionId", {
									id: mutation.data.id,
								})}
								title={t("adminShell.formExamples.step.submitSuccess")}
							/>
						) : null}
					</div>
				</Flex>
			</Flex>
		</Card>
	);
}
