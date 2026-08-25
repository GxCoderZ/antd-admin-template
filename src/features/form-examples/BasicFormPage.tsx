import { SaveOutlined } from "@ant-design/icons";
import { useMutation } from "@tanstack/react-query";
import {
	Alert,
	Button,
	Card,
	DatePicker,
	Flex,
	Form,
	Input,
	Radio,
	Select,
	Space,
	Switch,
	theme,
} from "antd";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";

import {
	submitBasicForm,
	type BasicFormCategory,
	type FormPriority,
} from "#src/api/form-examples";
import { getFormExampleProblemDetail } from "./formExampleProblems";

interface BasicFormValues {
	category: BasicFormCategory;
	dateRange: [Dayjs, Dayjs];
	notify: boolean;
	owner: string;
	priority: FormPriority;
	summary: string;
	title: string;
}

const initialValues: BasicFormValues = {
	category: "operation",
	dateRange: [dayjs().startOf("day"), dayjs().add(7, "day").startOf("day")],
	notify: true,
	owner: "",
	priority: "normal",
	summary: "",
	title: "",
};

export function BasicFormPage() {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const [form] = Form.useForm<BasicFormValues>();
	const mutation = useMutation({ mutationFn: submitBasicForm });

	return (
		<Card>
			<Flex justify="center">
				<Flex
					gap={token.margin}
					style={{ maxWidth: token.screenSM, width: "100%" }}
					vertical
				>
					{mutation.isError ? (
						<Alert
							closable
							description={
								getFormExampleProblemDetail(mutation.error) ??
								t("adminShell.formExamples.common.errorFallback")
							}
							onClose={() => mutation.reset()}
							showIcon
							title={t("adminShell.formExamples.basic.submitError")}
							type="error"
						/>
					) : null}
					{mutation.isSuccess ? (
						<Alert
							closable
							description={t("adminShell.formExamples.common.submissionId", {
								id: mutation.data.id,
							})}
							onClose={() => mutation.reset()}
							showIcon
							title={t("adminShell.formExamples.basic.submitSuccess")}
							type="success"
						/>
					) : null}
					<Form<BasicFormValues>
						form={form}
						initialValues={initialValues}
						layout="vertical"
						onFinish={(values) =>
							mutation.mutate({
								category: values.category,
								endAt: values.dateRange[1].toISOString(),
								notify: values.notify,
								owner: values.owner.trim(),
								priority: values.priority,
								startAt: values.dateRange[0].toISOString(),
								summary: values.summary.trim(),
								title: values.title.trim(),
							})
						}
						onValuesChange={() => mutation.reset()}
					>
						<Form.Item
							label={t("adminShell.formExamples.basic.fields.title")}
							name="title"
							rules={[
								{
									max: 80,
									message: t("adminShell.formExamples.basic.validation.title"),
									required: true,
									whitespace: true,
								},
							]}
						>
							<Input
								maxLength={80}
								placeholder={t(
									"adminShell.formExamples.basic.placeholders.title",
								)}
								showCount
							/>
						</Form.Item>
						<Form.Item
							label={t("adminShell.formExamples.basic.fields.owner")}
							name="owner"
							rules={[
								{
									max: 40,
									message: t("adminShell.formExamples.basic.validation.owner"),
									required: true,
									whitespace: true,
								},
							]}
						>
							<Input
								maxLength={40}
								placeholder={t(
									"adminShell.formExamples.basic.placeholders.owner",
								)}
							/>
						</Form.Item>
						<Form.Item
							label={t("adminShell.formExamples.basic.fields.category")}
							name="category"
							rules={[{ required: true }]}
						>
							<Select
								options={(["operation", "project", "other"] as const).map(
									(value) => ({
										label: t(
											`adminShell.formExamples.basic.categories.${value}`,
										),
										value,
									}),
								)}
							/>
						</Form.Item>
						<Form.Item
							label={t("adminShell.formExamples.basic.fields.dateRange")}
							name="dateRange"
							rules={[{ required: true }]}
						>
							<DatePicker.RangePicker
								allowClear={false}
								placeholder={[
									t("adminShell.formExamples.basic.placeholders.startAt"),
									t("adminShell.formExamples.basic.placeholders.endAt"),
								]}
								style={{ width: "100%" }}
							/>
						</Form.Item>
						<Form.Item
							label={t("adminShell.formExamples.basic.fields.summary")}
							name="summary"
							rules={[
								{
									max: 500,
									message: t(
										"adminShell.formExamples.basic.validation.summary",
									),
									required: true,
									whitespace: true,
								},
							]}
						>
							<Input.TextArea
								maxLength={500}
								placeholder={t(
									"adminShell.formExamples.basic.placeholders.summary",
								)}
								rows={5}
								showCount
							/>
						</Form.Item>
						<Form.Item
							label={t("adminShell.formExamples.basic.fields.priority")}
							name="priority"
						>
							<Radio.Group
								options={(["low", "normal", "high"] as const).map((value) => ({
									label: t(`adminShell.formExamples.basic.priorities.${value}`),
									value,
								}))}
							/>
						</Form.Item>
						<Form.Item
							label={t("adminShell.formExamples.basic.fields.notify")}
							name="notify"
							valuePropName="checked"
						>
							<Switch />
						</Form.Item>
						<Form.Item style={{ marginBottom: 0 }}>
							<Space wrap>
								<Button
									htmlType="submit"
									icon={<SaveOutlined aria-hidden />}
									loading={mutation.isPending}
									type="primary"
								>
									{t("adminShell.formExamples.common.submit")}
								</Button>
								<Button
									disabled={mutation.isPending}
									onClick={() => {
										form.resetFields();
										mutation.reset();
									}}
								>
									{t("adminShell.formExamples.common.reset")}
								</Button>
							</Space>
						</Form.Item>
					</Form>
				</Flex>
			</Flex>
		</Card>
	);
}
