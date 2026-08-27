import {
	Alert,
	Button,
	Drawer,
	Flex,
	Form,
	Input,
	InputNumber,
	Select,
	Tag,
	theme,
} from "antd";
import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";

import type {
	CreatePlatformDictionaryItemInput,
	CreatePlatformDictionaryTypeInput,
	PlatformDictionaryItem,
	PlatformDictionaryTagColor,
	PlatformDictionaryType,
} from "#src/api/dictionaries";
import { colorOptions } from "./DictionariesPageModel";
import {
	hasFormChanges,
	useDiscardChanges,
} from "../../../app/useDiscardChanges";

type TypeFormValues = Omit<CreatePlatformDictionaryTypeInput, "description"> & {
	description?: string;
};

type ItemFormValues = Omit<
	CreatePlatformDictionaryItemInput,
	"description" | "sort"
> & {
	description?: string;
	sort?: number;
};
export function DictionaryColorTag({
	children,
	color,
}: {
	children: string;
	color: PlatformDictionaryTagColor;
}) {
	const tagProps = color === "default" ? {} : { color };
	return <Tag {...tagProps}>{children}</Tag>;
}

export function TypeFormDrawer({
	error,
	loading,
	onClose,
	onSubmit,
	open,
	dictionaryType,
}: {
	dictionaryType: PlatformDictionaryType | null;
	error: boolean;
	loading: boolean;
	onClose: () => void;
	onSubmit: (values: CreatePlatformDictionaryTypeInput) => void;
	open: boolean;
}) {
	const { t } = useTranslation();
	const [form] = Form.useForm<TypeFormValues>();
	const { token } = theme.useToken();
	const initialValues = useMemo<TypeFormValues>(
		() =>
			dictionaryType
				? {
						code: dictionaryType.code,
						description: dictionaryType.description,
						name: dictionaryType.name,
						status: dictionaryType.status,
					}
				: { code: "", description: "", name: "", status: "active" },
		[dictionaryType],
	);
	const discard = useDiscardChanges({
		isDirty: () => hasFormChanges(form, initialValues),
		onDiscard: onClose,
		saving: loading,
	});

	useEffect(() => {
		if (!open) {
			return;
		}

		form.setFieldsValue(initialValues);
	}, [initialValues, form, open]);

	return (
		<Drawer
			destroyOnHidden
			size="min(560px, 100vw)"
			footer={
				<Flex gap={token.marginXS} justify="flex-end">
					<Button disabled={loading} onClick={discard.requestClose}>
						{t("adminShell.dictionaries.cancel")}
					</Button>
					<Button
						form="dictionary-type-form"
						htmlType="submit"
						loading={loading}
						type="primary"
					>
						{t("adminShell.dictionaries.save")}
					</Button>
				</Flex>
			}
			onClose={discard.requestClose}
			closable={!loading}
			keyboard={!loading}
			mask={{ closable: !loading }}
			open={open}
			title={t(
				dictionaryType
					? "adminShell.dictionaries.editTypeTitle"
					: "adminShell.dictionaries.createTypeTitle",
			)}
		>
			{discard.contextHolder}
			{error ? (
				<Alert
					description={t("adminShell.dictionaries.errors.fallback")}
					showIcon
					style={{ marginBottom: token.margin }}
					title={t("adminShell.dictionaries.errors.save")}
					type="error"
				/>
			) : null}
			<Form<TypeFormValues>
				disabled={loading}
				form={form}
				id="dictionary-type-form"
				layout="vertical"
				name="dictionaryTypeEditor"
				onFinish={(values) =>
					onSubmit({
						code: values.code.trim(),
						description: values.description?.trim() ?? "",
						name: values.name.trim(),
						status: values.status,
					})
				}
			>
				<Form.Item
					label={t("adminShell.dictionaries.fields.code")}
					name="code"
					rules={[
						{
							max: 64,
							message: t("adminShell.dictionaries.validation.codeLength"),
							required: true,
						},
					]}
				>
					<Input
						maxLength={64}
						placeholder={t("adminShell.dictionaries.placeholders.code")}
						showCount
					/>
				</Form.Item>
				<Form.Item
					label={t("adminShell.dictionaries.fields.name")}
					name="name"
					rules={[
						{
							max: 80,
							message: t("adminShell.dictionaries.validation.nameLength"),
							required: true,
						},
					]}
				>
					<Input
						maxLength={80}
						placeholder={t("adminShell.dictionaries.placeholders.name")}
						showCount
					/>
				</Form.Item>
				<Form.Item
					label={t("adminShell.dictionaries.fields.status")}
					name="status"
					rules={[{ required: true }]}
				>
					<Select
						options={[
							{
								label: t("adminShell.dictionaries.statuses.active"),
								value: "active",
							},
							{
								label: t("adminShell.dictionaries.statuses.disabled"),
								value: "disabled",
							},
						]}
					/>
				</Form.Item>
				<Form.Item
					label={t("adminShell.dictionaries.fields.description")}
					name="description"
				>
					<Input.TextArea
						autoSize={{ maxRows: 5, minRows: 3 }}
						maxLength={200}
						placeholder={t("adminShell.dictionaries.placeholders.description")}
					/>
				</Form.Item>
			</Form>
		</Drawer>
	);
}

export function ItemFormDrawer({
	dictionaryItem,
	error,
	loading,
	onClose,
	onSubmit,
	open,
}: {
	dictionaryItem: PlatformDictionaryItem | null;
	error: boolean;
	loading: boolean;
	onClose: () => void;
	onSubmit: (values: CreatePlatformDictionaryItemInput) => void;
	open: boolean;
}) {
	const { t } = useTranslation();
	const [form] = Form.useForm<ItemFormValues>();
	const { token } = theme.useToken();
	const initialValues = useMemo<ItemFormValues>(
		() =>
			dictionaryItem
				? {
						color: dictionaryItem.color,
						description: dictionaryItem.description,
						label: dictionaryItem.label,
						sort: dictionaryItem.sort,
						status: dictionaryItem.status,
						value: dictionaryItem.value,
					}
				: {
						color: "default",
						description: "",
						label: "",
						sort: 10,
						status: "active",
						value: "",
					},
		[dictionaryItem],
	);
	const discard = useDiscardChanges({
		isDirty: () => hasFormChanges(form, initialValues),
		onDiscard: onClose,
		saving: loading,
	});

	useEffect(() => {
		if (!open) {
			return;
		}

		form.setFieldsValue(initialValues);
	}, [initialValues, form, open]);

	return (
		<Drawer
			destroyOnHidden
			size="min(560px, 100vw)"
			footer={
				<Flex gap={token.marginXS} justify="flex-end">
					<Button disabled={loading} onClick={discard.requestClose}>
						{t("adminShell.dictionaries.cancel")}
					</Button>
					<Button
						form="dictionary-item-form"
						htmlType="submit"
						loading={loading}
						type="primary"
					>
						{t("adminShell.dictionaries.save")}
					</Button>
				</Flex>
			}
			onClose={discard.requestClose}
			closable={!loading}
			keyboard={!loading}
			mask={{ closable: !loading }}
			open={open}
			title={t(
				dictionaryItem
					? "adminShell.dictionaries.editItemTitle"
					: "adminShell.dictionaries.createItemTitle",
			)}
		>
			{discard.contextHolder}
			{error ? (
				<Alert
					description={t("adminShell.dictionaries.errors.fallback")}
					showIcon
					style={{ marginBottom: token.margin }}
					title={t("adminShell.dictionaries.errors.save")}
					type="error"
				/>
			) : null}
			<Form<ItemFormValues>
				disabled={loading}
				form={form}
				id="dictionary-item-form"
				layout="vertical"
				name="dictionaryItemEditor"
				onFinish={(values) =>
					onSubmit({
						color: values.color,
						description: values.description?.trim() ?? "",
						label: values.label.trim(),
						sort: values.sort ?? 10,
						status: values.status,
						value: values.value.trim(),
					})
				}
			>
				<Form.Item
					label={t("adminShell.dictionaries.fields.value")}
					name="value"
					rules={[
						{
							max: 80,
							message: t("adminShell.dictionaries.validation.valueLength"),
							required: true,
						},
					]}
				>
					<Input
						maxLength={80}
						placeholder={t("adminShell.dictionaries.placeholders.value")}
						showCount
					/>
				</Form.Item>
				<Form.Item
					label={t("adminShell.dictionaries.fields.label")}
					name="label"
					rules={[
						{
							max: 80,
							message: t("adminShell.dictionaries.validation.labelLength"),
							required: true,
						},
					]}
				>
					<Input
						maxLength={80}
						placeholder={t("adminShell.dictionaries.placeholders.label")}
						showCount
					/>
				</Form.Item>
				<Form.Item
					label={t("adminShell.dictionaries.fields.status")}
					name="status"
					rules={[{ required: true }]}
				>
					<Select
						options={[
							{
								label: t("adminShell.dictionaries.statuses.active"),
								value: "active",
							},
							{
								label: t("adminShell.dictionaries.statuses.disabled"),
								value: "disabled",
							},
						]}
					/>
				</Form.Item>
				<Form.Item
					label={t("adminShell.dictionaries.fields.sort")}
					name="sort"
					rules={[{ required: true }]}
				>
					<InputNumber
						min={0}
						placeholder={t("adminShell.dictionaries.placeholders.sort")}
						precision={0}
						style={{ width: "100%" }}
					/>
				</Form.Item>
				<Form.Item
					label={t("adminShell.dictionaries.fields.color")}
					name="color"
					rules={[{ required: true }]}
				>
					<Select
						options={colorOptions.map((color) => ({
							label: (
								<DictionaryColorTag color={color}>
									{t(`adminShell.dictionaries.colors.${color}`)}
								</DictionaryColorTag>
							),
							value: color,
						}))}
					/>
				</Form.Item>
				<Form.Item
					label={t("adminShell.dictionaries.fields.description")}
					name="description"
				>
					<Input.TextArea
						autoSize={{ maxRows: 5, minRows: 3 }}
						maxLength={200}
						placeholder={t("adminShell.dictionaries.placeholders.description")}
					/>
				</Form.Item>
			</Form>
		</Drawer>
	);
}
