import {
	Alert,
	Button,
	Col,
	Drawer,
	Form,
	Input,
	InputNumber,
	Select,
	Space,
	Tag,
} from "antd";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import { useQueryFilterLayout } from "../../../app/queryFilterLayout";
import { useRouteSessionState } from "../../../app/routeSessionState";
import type {
	CreatePlatformDictionaryItemInput,
	CreatePlatformDictionaryTypeInput,
	PlatformDictionaryItem,
	PlatformDictionaryTagColor,
	PlatformDictionaryType,
} from "#src/api/dictionaries";
import { LogQueryPanel } from "../../operations/LogTablePanel";
import {
	colorOptions,
	dictionariesRouteKey,
	type ItemFilterValues,
	type TypeFilterValues,
} from "./DictionariesPageModel";

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

export function TypeQueryPanel({
	initialFilters,
	loading,
	onApply,
	onReset,
}: {
	initialFilters: TypeFilterValues;
	loading: boolean;
	onApply: (filters: TypeFilterValues) => void;
	onReset: () => void;
}) {
	const { t } = useTranslation();
	const [form] = Form.useForm<TypeFilterValues>();
	const [draftFilters, setDraftFilters] =
		useRouteSessionState<TypeFilterValues>({
			initialState: initialFilters,
			routeKey: dictionariesRouteKey,
			stateKey: "type-query-draft",
		});
	const [expanded, setExpanded] = useRouteSessionState({
		initialState: false,
		routeKey: dictionariesRouteKey,
		stateKey: "type-query-expanded",
	});
	const {
		canExpand,
		collapsedFieldCount,
		columnSpan,
		containerRef,
		formLayout,
		submitterOffset,
	} = useQueryFilterLayout({ expanded, fieldCount: 2 });
	const showStatusFilter = expanded || collapsedFieldCount >= 2;

	return (
		<LogQueryPanel<TypeFilterValues>
			actionsTestId="admin-dictionaries-type-query-actions"
			canExpand={canExpand}
			columnSpan={columnSpan}
			containerRef={containerRef}
			expanded={expanded}
			form={form}
			formLayout={formLayout}
			initialValues={initialFilters}
			loading={loading}
			onFinish={() => onApply(draftFilters)}
			onReset={() => {
				setDraftFilters(initialFilters);
				onReset();
			}}
			onToggle={() => setExpanded((currentExpanded) => !currentExpanded)}
			submitterOffset={submitterOffset}
			testId="admin-dictionaries-type-query-form"
		>
			<Col span={columnSpan}>
				<Form.Item
					label={t("adminShell.dictionaries.filters.q")}
					style={{ marginBottom: 0 }}
				>
					<Input
						allowClear
						maxLength={100}
						onChange={(event) =>
							setDraftFilters((currentFilters) => ({
								...currentFilters,
								q: event.target.value,
							}))
						}
						placeholder={t("adminShell.dictionaries.placeholders.query")}
						style={{ width: "100%" }}
						value={draftFilters.q}
					/>
				</Form.Item>
			</Col>
			{showStatusFilter ? (
				<Col span={columnSpan}>
					<Form.Item
						label={t("adminShell.dictionaries.filters.status")}
						style={{ marginBottom: 0 }}
					>
						<Select
							aria-label={t("adminShell.dictionaries.filters.status")}
							onChange={(status: TypeFilterValues["status"]) =>
								setDraftFilters((currentFilters) => ({
									...currentFilters,
									status,
								}))
							}
							options={[
								{
									label: t("adminShell.dictionaries.allStatuses"),
									value: "all",
								},
								{
									label: t("adminShell.dictionaries.statuses.active"),
									value: "active",
								},
								{
									label: t("adminShell.dictionaries.statuses.disabled"),
									value: "disabled",
								},
							]}
							style={{ width: "100%" }}
							value={draftFilters.status}
						/>
					</Form.Item>
				</Col>
			) : null}
		</LogQueryPanel>
	);
}

export function ItemQueryPanel({
	initialFilters,
	loading,
	onApply,
	onReset,
}: {
	initialFilters: ItemFilterValues;
	loading: boolean;
	onApply: (filters: ItemFilterValues) => void;
	onReset: () => void;
}) {
	const { t } = useTranslation();
	const [form] = Form.useForm<ItemFilterValues>();
	const [draftFilters, setDraftFilters] =
		useRouteSessionState<ItemFilterValues>({
			initialState: initialFilters,
			routeKey: dictionariesRouteKey,
			stateKey: "item-query-draft",
		});
	const [expanded, setExpanded] = useRouteSessionState({
		initialState: false,
		routeKey: dictionariesRouteKey,
		stateKey: "item-query-expanded",
	});
	const {
		canExpand,
		collapsedFieldCount,
		columnSpan,
		containerRef,
		formLayout,
		submitterOffset,
	} = useQueryFilterLayout({ expanded, fieldCount: 2 });
	const showStatusFilter = expanded || collapsedFieldCount >= 2;

	return (
		<LogQueryPanel<ItemFilterValues>
			actionsTestId="admin-dictionaries-item-query-actions"
			canExpand={canExpand}
			columnSpan={columnSpan}
			containerRef={containerRef}
			expanded={expanded}
			form={form}
			formLayout={formLayout}
			initialValues={initialFilters}
			loading={loading}
			onFinish={() => onApply(draftFilters)}
			onReset={() => {
				setDraftFilters(initialFilters);
				onReset();
			}}
			onToggle={() => setExpanded((currentExpanded) => !currentExpanded)}
			submitterOffset={submitterOffset}
			testId="admin-dictionaries-item-query-form"
		>
			<Col span={columnSpan}>
				<Form.Item
					label={t("adminShell.dictionaries.filters.itemQuery")}
					style={{ marginBottom: 0 }}
				>
					<Input
						allowClear
						maxLength={100}
						onChange={(event) =>
							setDraftFilters((currentFilters) => ({
								...currentFilters,
								q: event.target.value,
							}))
						}
						placeholder={t("adminShell.dictionaries.placeholders.itemQuery")}
						style={{ width: "100%" }}
						value={draftFilters.q}
					/>
				</Form.Item>
			</Col>
			{showStatusFilter ? (
				<Col span={columnSpan}>
					<Form.Item
						label={t("adminShell.dictionaries.filters.status")}
						style={{ marginBottom: 0 }}
					>
						<Select
							aria-label={t("adminShell.dictionaries.filters.status")}
							onChange={(status: ItemFilterValues["status"]) =>
								setDraftFilters((currentFilters) => ({
									...currentFilters,
									status,
								}))
							}
							options={[
								{
									label: t("adminShell.dictionaries.allStatuses"),
									value: "all",
								},
								{
									label: t("adminShell.dictionaries.statuses.active"),
									value: "active",
								},
								{
									label: t("adminShell.dictionaries.statuses.disabled"),
									value: "disabled",
								},
							]}
							style={{ width: "100%" }}
							value={draftFilters.status}
						/>
					</Form.Item>
				</Col>
			) : null}
		</LogQueryPanel>
	);
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

	useEffect(() => {
		if (!open) {
			return;
		}

		form.setFieldsValue(
			dictionaryType
				? {
						code: dictionaryType.code,
						description: dictionaryType.description,
						name: dictionaryType.name,
						status: dictionaryType.status,
					}
				: { code: "", description: "", name: "", status: "active" },
		);
	}, [dictionaryType, form, open]);

	return (
		<Drawer
			destroyOnHidden
			extra={
				<Space>
					<Button disabled={loading} onClick={onClose}>
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
				</Space>
			}
			onClose={onClose}
			open={open}
			title={t(
				dictionaryType
					? "adminShell.dictionaries.editTypeTitle"
					: "adminShell.dictionaries.createTypeTitle",
			)}
		>
			{error ? (
				<Alert
					description={t("adminShell.dictionaries.errors.fallback")}
					showIcon
					style={{ marginBottom: 16 }}
					title={t("adminShell.dictionaries.errors.save")}
					type="error"
				/>
			) : null}
			<Form<TypeFormValues>
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

	useEffect(() => {
		if (!open) {
			return;
		}

		form.setFieldsValue(
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
		);
	}, [dictionaryItem, form, open]);

	return (
		<Drawer
			destroyOnHidden
			extra={
				<Space>
					<Button disabled={loading} onClick={onClose}>
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
				</Space>
			}
			onClose={onClose}
			open={open}
			title={t(
				dictionaryItem
					? "adminShell.dictionaries.editItemTitle"
					: "adminShell.dictionaries.createItemTitle",
			)}
		>
			{error ? (
				<Alert
					description={t("adminShell.dictionaries.errors.fallback")}
					showIcon
					style={{ marginBottom: 16 }}
					title={t("adminShell.dictionaries.errors.save")}
					type="error"
				/>
			) : null}
			<Form<ItemFormValues>
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
