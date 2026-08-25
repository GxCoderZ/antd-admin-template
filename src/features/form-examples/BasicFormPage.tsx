import { useMutation } from "@tanstack/react-query";
import {
	Button,
	Card,
	DatePicker,
	Flex,
	Form,
	Input,
	InputNumber,
	message,
	Radio,
	Select,
	Space,
	theme,
	Typography,
} from "antd";
import type { Dayjs } from "dayjs";
import { useTranslation } from "react-i18next";

import { submitBasicForm, type GoalVisibility } from "#src/api/form-examples";
import { getFormExampleProblemDetail } from "./formExampleProblems";

interface BasicFormValues {
	client?: string;
	dateRange: [Dayjs, Dayjs];
	goal: string;
	invites?: string;
	publicType: GoalVisibility;
	publicUsers?: string;
	standard: string;
	title: string;
	weight?: number;
}

const mediumControlStyle = { maxWidth: "100%", width: 328 } as const;
const extraLargeControlStyle = { maxWidth: "100%", width: 552 } as const;

function optionalLabel(label: string, optional: string, color: string) {
	return (
		<span>
			{label}
			<em style={{ color, fontStyle: "normal" }}>{optional}</em>
		</span>
	);
}

export function BasicFormPage() {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const [form] = Form.useForm<BasicFormValues>();
	const [messageApi, messageContext] = message.useMessage();
	const publicType = Form.useWatch("publicType", form);
	const mutation = useMutation({
		mutationFn: submitBasicForm,
		onError: (error) => {
			void messageApi.error(
				getFormExampleProblemDetail(error) ??
					t("adminShell.formExamples.common.errorFallback"),
			);
		},
		onSuccess: () => {
			void messageApi.success(t("adminShell.formExamples.basic.submitSuccess"));
		},
	});

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
				{t("adminShell.navigation.basicForm")}
			</Typography.Title>
			<Typography.Paragraph
				style={{ color: token.colorTextSecondary, margin: 0 }}
			>
				{t("adminShell.formExamples.basic.description")}
			</Typography.Paragraph>
			<Card variant="borderless">
				<Form<BasicFormValues>
					form={form}
					initialValues={{ publicType: "1" }}
					layout="vertical"
					name="basic"
					onFinish={(values) => {
						mutation.mutate({
							...(values.client?.trim()
								? { client: values.client.trim() }
								: {}),
							endAt: values.dateRange[1].toISOString(),
							goal: values.goal.trim(),
							...(values.invites?.trim()
								? { invites: values.invites.trim() }
								: {}),
							publicType: values.publicType,
							...(values.publicUsers
								? { publicUsers: values.publicUsers }
								: {}),
							startAt: values.dateRange[0].toISOString(),
							standard: values.standard.trim(),
							title: values.title.trim(),
							...(values.weight === undefined ? {} : { weight: values.weight }),
						});
					}}
					requiredMark={false}
					style={{ margin: "8px auto 0", maxWidth: 600 }}
					variant="filled"
				>
					<Form.Item
						label={t("adminShell.formExamples.basic.fields.title")}
						name="title"
						rules={[
							{
								message: t("adminShell.formExamples.basic.validation.title"),
								required: true,
								whitespace: true,
							},
						]}
					>
						<Input
							placeholder={t(
								"adminShell.formExamples.basic.placeholders.title",
							)}
							style={mediumControlStyle}
						/>
					</Form.Item>
					<Form.Item
						label={t("adminShell.formExamples.basic.fields.dateRange")}
						name="dateRange"
						rules={[
							{
								message: t(
									"adminShell.formExamples.basic.validation.dateRange",
								),
								required: true,
							},
						]}
					>
						<DatePicker.RangePicker
							placeholder={[
								t("adminShell.formExamples.basic.placeholders.startAt"),
								t("adminShell.formExamples.basic.placeholders.endAt"),
							]}
							style={mediumControlStyle}
						/>
					</Form.Item>
					<Form.Item
						label={t("adminShell.formExamples.basic.fields.goal")}
						name="goal"
						rules={[
							{
								message: t("adminShell.formExamples.basic.validation.goal"),
								required: true,
								whitespace: true,
							},
						]}
					>
						<Input.TextArea
							placeholder={t("adminShell.formExamples.basic.placeholders.goal")}
							rows={3}
							style={extraLargeControlStyle}
						/>
					</Form.Item>
					<Form.Item
						label={t("adminShell.formExamples.basic.fields.standard")}
						name="standard"
						rules={[
							{
								message: t("adminShell.formExamples.basic.validation.standard"),
								required: true,
								whitespace: true,
							},
						]}
					>
						<Input.TextArea
							placeholder={t(
								"adminShell.formExamples.basic.placeholders.standard",
							)}
							rows={3}
							style={extraLargeControlStyle}
						/>
					</Form.Item>
					<Form.Item
						label={optionalLabel(
							t("adminShell.formExamples.basic.fields.client"),
							t("adminShell.formExamples.basic.optional"),
							token.colorTextSecondary,
						)}
						name="client"
						tooltip={t("adminShell.formExamples.basic.clientTooltip")}
					>
						<Input
							placeholder={t(
								"adminShell.formExamples.basic.placeholders.client",
							)}
							style={mediumControlStyle}
						/>
					</Form.Item>
					<Form.Item
						label={optionalLabel(
							t("adminShell.formExamples.basic.fields.invites"),
							t("adminShell.formExamples.basic.optional"),
							token.colorTextSecondary,
						)}
						name="invites"
					>
						<Input
							placeholder={t(
								"adminShell.formExamples.basic.placeholders.invites",
							)}
							style={mediumControlStyle}
						/>
					</Form.Item>
					<Form.Item
						label={optionalLabel(
							t("adminShell.formExamples.basic.fields.weight"),
							t("adminShell.formExamples.basic.optional"),
							token.colorTextSecondary,
						)}
						name="weight"
					>
						<InputNumber<number>
							formatter={(value) => `${value || 0}%`}
							max={100}
							min={0}
							parser={(value) => Number(value?.replace("%", "") ?? 0)}
							placeholder={t(
								"adminShell.formExamples.basic.placeholders.weight",
							)}
							style={{ maxWidth: "100%", width: 104 }}
						/>
					</Form.Item>
					<Form.Item
						label={t("adminShell.formExamples.basic.fields.publicType")}
						name="publicType"
					>
						<Radio.Group
							options={(["1", "2", "3"] as const).map((value) => ({
								label: t(`adminShell.formExamples.basic.visibility.${value}`),
								value,
							}))}
						/>
					</Form.Item>
					<Form.Item name="publicUsers">
						<Select
							aria-label={t("adminShell.formExamples.basic.fields.publicUsers")}
							options={(["1", "2", "3"] as const).map((value) => ({
								label: t(`adminShell.formExamples.basic.colleagues.${value}`),
								value,
							}))}
							placeholder={t(
								"adminShell.formExamples.basic.placeholders.publicUsers",
							)}
							style={{
								...mediumControlStyle,
								display: publicType === "2" ? "block" : "none",
								margin: "8px 0",
							}}
						/>
					</Form.Item>
					<Form.Item style={{ marginBottom: 0 }}>
						<Space>
							<Button
								disabled={mutation.isPending}
								onClick={() => {
									form.resetFields();
									mutation.reset();
								}}
							>
								{t("adminShell.formExamples.common.reset")}
							</Button>
							<Button
								htmlType="submit"
								loading={mutation.isPending}
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
