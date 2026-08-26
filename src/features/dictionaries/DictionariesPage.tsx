import {
	CheckCircleOutlined,
	DeleteOutlined,
	PlusOutlined,
	StopOutlined,
} from "@ant-design/icons";
import {
	keepPreviousData,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import {
	Alert,
	Button,
	Col,
	Drawer,
	Flex,
	Form,
	Input,
	InputNumber,
	Modal,
	Select,
	Space,
	Tag,
	message,
	theme,
	Typography,
} from "antd";
import type { TableColumnsType, TableProps } from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { formatDateTime } from "../../app/formatting";
import { useLocalePreferences } from "../../app/localePreferences";
import { getTableColumnSettingsStorageKey } from "../../app/preferenceStorage";
import {
	useQueryFilterLayout,
	useQuerySubmission,
} from "../../app/queryFilterLayout";
import { useRouteSessionState } from "../../app/routeSessionState";
import { resolveTableSort } from "../../app/tableSorting";
import {
	TableActionButton,
	TableActionMenu,
} from "../../app/TableActionButton";
import type { ResponsiveTableColumnConfig } from "../../app/tableColumnVisibility";
import {
	createPlatformDictionaryItem,
	createPlatformDictionaryType,
	deletePlatformDictionaryItem,
	deletePlatformDictionaryType,
	listPlatformDictionaryItems,
	listPlatformDictionaryTypes,
	platformDictionaryItemsQueryKey,
	platformDictionaryTypesQueryKey,
	type CreatePlatformDictionaryItemInput,
	type CreatePlatformDictionaryTypeInput,
	type ListPlatformDictionaryItemsInput,
	type ListPlatformDictionaryTypesInput,
	type PlatformDictionaryItem,
	type PlatformDictionaryStatus,
	type PlatformDictionaryTagColor,
	type PlatformDictionaryType,
	updatePlatformDictionaryItem,
	updatePlatformDictionaryType,
} from "#src/api/dictionaries";
import { LogQueryPanel, LogTablePanel } from "../operations/LogTablePanel";

type TypeSort = NonNullable<ListPlatformDictionaryTypesInput["sort"]>;
type ItemSort = NonNullable<ListPlatformDictionaryItemsInput["sort"]>;

const typeColumnVisibility: readonly ResponsiveTableColumnConfig<string>[] = [
	{ key: "name", priority: "compact", required: true },
	{ key: "code", priority: "regular" },
	{ key: "status", priority: "compact" },
	{ key: "itemCount", priority: "spacious" },
	{ key: "updatedAt", priority: "optional" },
	{ key: "actions", priority: "compact", required: true },
];
const itemColumnVisibility: readonly ResponsiveTableColumnConfig<string>[] = [
	{ key: "label", priority: "compact", required: true },
	{ key: "value", priority: "regular" },
	{ key: "color", priority: "spacious" },
	{ key: "sort", priority: "spacious" },
	{ key: "status", priority: "compact" },
	{ key: "updatedAt", priority: "optional" },
	{ key: "actions", priority: "compact", required: true },
];

interface PageData<Row> {
	items: Row[];
	page: number;
	pageSize: number;
	total: number;
}

interface TypeFilterValues {
	q?: string;
	status: "all" | PlatformDictionaryStatus;
}

interface ItemFilterValues {
	q?: string;
	status: "all" | PlatformDictionaryStatus;
}

interface TypeTableState {
	order: ListPlatformDictionaryTypesInput["order"];
	page: number;
	pageSize: number;
	sort: ListPlatformDictionaryTypesInput["sort"];
}

interface ItemTableState {
	order: ListPlatformDictionaryItemsInput["order"];
	page: number;
	pageSize: number;
	sort: ListPlatformDictionaryItemsInput["sort"];
}

interface DictionariesPageProps {
	canManage?: boolean;
}

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

const defaultTypeFilters: TypeFilterValues = { status: "all" };
const defaultItemFilters: ItemFilterValues = { status: "all" };
const dictionariesRouteKey = "/system/dictionaries";
const defaultTypeTableState: TypeTableState = {
	order: "asc",
	page: 1,
	pageSize: 10,
	sort: "code",
};
const defaultItemTableState: ItemTableState = {
	order: "asc",
	page: 1,
	pageSize: 10,
	sort: "sort",
};
const colorOptions: PlatformDictionaryTagColor[] = [
	"default",
	"green",
	"blue",
	"cyan",
	"orange",
	"purple",
	"red",
];
const typeSortMap: Record<string, TypeSort> = {
	code: "code",
	itemCount: "item_count",
	name: "name",
	status: "status",
	updatedAt: "updated_at",
};
const itemSortMap: Record<string, ItemSort> = {
	label: "label",
	sort: "sort",
	status: "status",
	updatedAt: "updated_at",
	value: "value",
};

function getStatusColor(status: PlatformDictionaryStatus) {
	return status === "active" ? "success" : "default";
}

function DictionaryColorTag({
	children,
	color,
}: {
	children: string;
	color: PlatformDictionaryTagColor;
}) {
	const tagProps = color === "default" ? {} : { color };
	return <Tag {...tagProps}>{children}</Tag>;
}

function TypeQueryPanel({
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

function ItemQueryPanel({
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

function TypeFormDrawer({
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

function ItemFormDrawer({
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

export function DictionariesPage({ canManage = true }: DictionariesPageProps) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const queryClient = useQueryClient();
	const [messageApi, messageContext] = message.useMessage();
	const formatPreferences = useLocalePreferences();
	const [typeFilters, setTypeFilters] =
		useRouteSessionState<TypeFilterValues>({
			initialState: defaultTypeFilters,
			routeKey: dictionariesRouteKey,
			stateKey: "type-query-applied",
		});
	const [itemFilters, setItemFilters] =
		useRouteSessionState<ItemFilterValues>({
			initialState: defaultItemFilters,
			routeKey: dictionariesRouteKey,
			stateKey: "item-query-applied",
		});
	const [typeTableState, setTypeTableState] =
		useRouteSessionState<TypeTableState>({
			initialState: defaultTypeTableState,
			routeKey: dictionariesRouteKey,
			stateKey: "type-table",
		});
	const [itemTableState, setItemTableState] =
		useRouteSessionState<ItemTableState>({
			initialState: defaultItemTableState,
			routeKey: dictionariesRouteKey,
			stateKey: "item-table",
		});
	const [selectedTypeId, setSelectedTypeId] = useRouteSessionState<string | null>({
		initialState: null,
		routeKey: dictionariesRouteKey,
		stateKey: "selected-type",
	});
	const [typeFormOpen, setTypeFormOpen] = useState(false);
	const [itemFormOpen, setItemFormOpen] = useState(false);
	const [editingType, setEditingType] = useState<PlatformDictionaryType | null>(
		null,
	);
	const [editingItem, setEditingItem] = useState<PlatformDictionaryItem | null>(
		null,
	);
	const [deletingType, setDeletingType] =
		useState<PlatformDictionaryType | null>(null);
	const [deletingItem, setDeletingItem] =
		useState<PlatformDictionaryItem | null>(null);
	const { revision: typeRevision, submit: submitTypeQuery } =
		useQuerySubmission();
	const { revision: itemRevision, submit: submitItemQuery } =
		useQuerySubmission();
	const typeQueryParams = useMemo<ListPlatformDictionaryTypesInput>(() => {
		const q = typeFilters.q?.trim();
		const params: ListPlatformDictionaryTypesInput = {
			page: typeTableState.page,
			pageSize: typeTableState.pageSize,
			...(typeTableState.order && typeTableState.sort
				? { order: typeTableState.order, sort: typeTableState.sort }
				: {}),
		};

		if (q) {
			params.q = q;
		}
		if (typeFilters.status !== "all") {
			params.status = typeFilters.status;
		}

		return params;
	}, [typeFilters, typeTableState]);
	const itemQueryParams = useMemo<ListPlatformDictionaryItemsInput>(() => {
		const q = itemFilters.q?.trim();
		const params: ListPlatformDictionaryItemsInput = {
			page: itemTableState.page,
			pageSize: itemTableState.pageSize,
			...(itemTableState.order && itemTableState.sort
				? { order: itemTableState.order, sort: itemTableState.sort }
				: {}),
		};

		if (q) {
			params.q = q;
		}
		if (itemFilters.status !== "all") {
			params.status = itemFilters.status;
		}

		return params;
	}, [itemFilters, itemTableState]);
	const typeQuery = useQuery({
		placeholderData: keepPreviousData,
		queryFn: ({ signal }) =>
			listPlatformDictionaryTypes(typeQueryParams, signal),
		queryKey: [
			...platformDictionaryTypesQueryKey,
			typeQueryParams,
			typeRevision,
		],
	});
	const selectedType = useMemo(() => {
		const items = typeQuery.data?.items ?? [];
		if (selectedTypeId) {
			return (
				items.find((dictionaryType) => dictionaryType.id === selectedTypeId) ??
				null
			);
		}
		return items[0] ?? null;
	}, [selectedTypeId, typeQuery.data?.items]);
	const itemQuery = useQuery({
		enabled: selectedType !== null,
		placeholderData: keepPreviousData,
		queryFn: ({ signal }) =>
			selectedType
				? listPlatformDictionaryItems(selectedType.id, itemQueryParams, signal)
				: Promise.resolve<PageData<PlatformDictionaryItem>>({
						items: [],
						page: itemTableState.page,
						pageSize: itemTableState.pageSize,
						total: 0,
					}),
		queryKey: [
			...platformDictionaryItemsQueryKey,
			selectedType?.id,
			itemQueryParams,
			itemRevision,
		],
	});

	const refreshTypes = () =>
		queryClient.invalidateQueries({
			queryKey: platformDictionaryTypesQueryKey,
		});
	const refreshItems = () =>
		queryClient.invalidateQueries({
			queryKey: platformDictionaryItemsQueryKey,
		});
	const resetTypeTablePage = useCallback(() => {
		setTypeTableState((currentState) => ({ ...currentState, page: 1 }));
		submitTypeQuery();
	}, [setTypeTableState, submitTypeQuery]);
	const resetItemTablePage = useCallback(() => {
		setItemTableState((currentState) => ({ ...currentState, page: 1 }));
		submitItemQuery();
	}, [setItemTableState, submitItemQuery]);
	const saveTypeMutation = useMutation({
		mutationFn: (input: CreatePlatformDictionaryTypeInput) =>
			editingType
				? updatePlatformDictionaryType({ input, typeId: editingType.id })
				: createPlatformDictionaryType(input),
		onSuccess: async () => {
			await refreshTypes();
			setTypeFormOpen(false);
			setEditingType(null);
		},
	});
	const deleteTypeMutation = useMutation({
		mutationFn: deletePlatformDictionaryType,
		onSuccess: async () => {
			await refreshTypes();
			await refreshItems();
			if (deletingType?.id === selectedType?.id) {
				setSelectedTypeId(null);
			}
			setDeletingType(null);
		},
	});
	const toggleTypeMutation = useMutation({
		mutationFn: (dictionaryType: PlatformDictionaryType) =>
			updatePlatformDictionaryType({
				input: {
					code: dictionaryType.code,
					description: dictionaryType.description,
					name: dictionaryType.name,
					status: dictionaryType.status === "active" ? "disabled" : "active",
				},
				typeId: dictionaryType.id,
			}),
		onSuccess: async () => {
			await refreshTypes();
			void messageApi.success(t("adminShell.dictionaries.toggleSuccess"));
		},
		onError: () => {
			void messageApi.error(t("adminShell.dictionaries.toggleError"));
		},
	});
	const saveItemMutation = useMutation({
		mutationFn: (input: CreatePlatformDictionaryItemInput) =>
			editingItem
				? updatePlatformDictionaryItem({ input, itemId: editingItem.id })
				: createPlatformDictionaryItem({ input, typeId: selectedType!.id }),
		onSuccess: async () => {
			await refreshItems();
			await refreshTypes();
			setItemFormOpen(false);
			setEditingItem(null);
		},
	});
	const deleteItemMutation = useMutation({
		mutationFn: deletePlatformDictionaryItem,
		onSuccess: async () => {
			await refreshItems();
			await refreshTypes();
			setDeletingItem(null);
		},
	});
	const toggleItemMutation = useMutation({
		mutationFn: (dictionaryItem: PlatformDictionaryItem) =>
			updatePlatformDictionaryItem({
				input: {
					color: dictionaryItem.color,
					description: dictionaryItem.description,
					label: dictionaryItem.label,
					sort: dictionaryItem.sort,
					status: dictionaryItem.status === "active" ? "disabled" : "active",
					value: dictionaryItem.value,
				},
				itemId: dictionaryItem.id,
			}),
		onSuccess: async () => {
			await refreshItems();
			void messageApi.success(t("adminShell.dictionaries.toggleSuccess"));
		},
		onError: () => {
			void messageApi.error(t("adminShell.dictionaries.toggleError"));
		},
	});
	const statusTag = useCallback(
		(status: PlatformDictionaryStatus) => (
			<Tag color={getStatusColor(status)}>
				{t(`adminShell.dictionaries.statuses.${status}`)}
			</Tag>
		),
		[t],
	);
	const typeColumns = useMemo<TableColumnsType<PlatformDictionaryType>>(() => {
		const sortOrder = (column: TypeSort) =>
			typeTableState.sort === column && typeTableState.order
				? typeTableState.order === "asc"
					? "ascend"
					: "descend"
				: null;
		const columns: TableColumnsType<PlatformDictionaryType> = [
			{
				dataIndex: "name",
				key: "name",
				sorter: true,
				sortOrder: sortOrder("name"),
				title: t("adminShell.dictionaries.columns.name"),
				width: token.controlHeight * 4,
			},
			{
				dataIndex: "code",
				key: "code",
				sorter: true,
				sortOrder: sortOrder("code"),
				title: t("adminShell.dictionaries.columns.code"),
				width: token.controlHeight * 5,
			},
			{
				dataIndex: "status",
				key: "status",
				render: statusTag,
				sorter: true,
				sortOrder: sortOrder("status"),
				title: t("adminShell.dictionaries.columns.status"),
				width: token.controlHeight * 3,
			},
			{
				dataIndex: "itemCount",
				key: "itemCount",
				sorter: true,
				sortOrder: sortOrder("item_count"),
				title: t("adminShell.dictionaries.columns.itemCount"),
				width: token.controlHeight * 3,
			},
			{
				dataIndex: "updatedAt",
				key: "updatedAt",
				render: (value: string) => formatDateTime(value, formatPreferences),
				sorter: true,
				sortOrder: sortOrder("updated_at"),
				title: t("adminShell.dictionaries.columns.updatedAt"),
				width: token.controlHeight * 5,
			},
		];

		if (canManage) {
			columns.push({
				key: "actions",
				render: (_value, dictionaryType) => {
					const toggleLabel = t(
						dictionaryType.status === "active"
							? "adminShell.dictionaries.disable"
							: "adminShell.dictionaries.enable",
					);
					return (
						<Space size="middle">
							<TableActionButton
								onClick={() => {
									saveTypeMutation.reset();
									setEditingType(dictionaryType);
									setTypeFormOpen(true);
								}}
							>
								{t("adminShell.dictionaries.edit")}
							</TableActionButton>
							<TableActionButton
								onClick={() => {
									setSelectedTypeId(dictionaryType.id);
									resetItemTablePage();
								}}
							>
								{t("adminShell.dictionaries.manageItems")}
							</TableActionButton>
							<TableActionMenu
								items={[
									{
										icon:
											dictionaryType.status === "active" ? (
												<StopOutlined aria-hidden />
											) : (
												<CheckCircleOutlined aria-hidden />
											),
										key: "toggle",
										label: toggleLabel,
										onClick: () => {
											toggleTypeMutation.mutate(dictionaryType);
										},
									},
									{
										danger: true,
										icon: <DeleteOutlined aria-hidden />,
										key: "delete",
										label: t("adminShell.dictionaries.delete"),
										onClick: () => {
											deleteTypeMutation.reset();
											setDeletingType(dictionaryType);
										},
									},
								]}
								label={t("adminShell.dictionaries.more")}
							/>
						</Space>
					);
				},
				title: t("adminShell.dictionaries.columns.actions"),
				width: token.controlHeight * 7,
			});
		}

		return columns;
	}, [
		canManage,
		deleteTypeMutation,
		formatPreferences,
		saveTypeMutation,
		resetItemTablePage,
		setSelectedTypeId,
		statusTag,
		t,
		toggleTypeMutation,
		token.controlHeight,
		typeTableState.order,
		typeTableState.sort,
	]);
	const itemColumns = useMemo<TableColumnsType<PlatformDictionaryItem>>(() => {
		const sortOrder = (column: ItemSort) =>
			itemTableState.sort === column && itemTableState.order
				? itemTableState.order === "asc"
					? "ascend"
					: "descend"
				: null;
		const columns: TableColumnsType<PlatformDictionaryItem> = [
			{
				dataIndex: "label",
				key: "label",
				sorter: true,
				sortOrder: sortOrder("label"),
				title: t("adminShell.dictionaries.columns.label"),
				width: token.controlHeight * 4,
			},
			{
				dataIndex: "value",
				key: "value",
				sorter: true,
				sortOrder: sortOrder("value"),
				title: t("adminShell.dictionaries.columns.value"),
				width: token.controlHeight * 4,
			},
			{
				dataIndex: "color",
				key: "color",
				render: (color: PlatformDictionaryTagColor, dictionaryItem) => (
					<DictionaryColorTag color={color}>
						{dictionaryItem.label}
					</DictionaryColorTag>
				),
				title: t("adminShell.dictionaries.columns.color"),
				width: token.controlHeight * 3,
			},
			{
				dataIndex: "sort",
				key: "sort",
				sorter: true,
				sortOrder: sortOrder("sort"),
				title: t("adminShell.dictionaries.columns.sort"),
				width: token.controlHeight * 3,
			},
			{
				dataIndex: "status",
				key: "status",
				render: statusTag,
				sorter: true,
				sortOrder: sortOrder("status"),
				title: t("adminShell.dictionaries.columns.status"),
				width: token.controlHeight * 3,
			},
			{
				dataIndex: "updatedAt",
				key: "updatedAt",
				render: (value: string) => formatDateTime(value, formatPreferences),
				sorter: true,
				sortOrder: sortOrder("updated_at"),
				title: t("adminShell.dictionaries.columns.updatedAt"),
				width: token.controlHeight * 5,
			},
		];

		if (canManage) {
			columns.push({
				key: "actions",
				render: (_value, dictionaryItem) => {
					const toggleLabel = t(
						dictionaryItem.status === "active"
							? "adminShell.dictionaries.disable"
							: "adminShell.dictionaries.enable",
					);
					return (
						<Space size="middle">
							<TableActionButton
								onClick={() => {
									saveItemMutation.reset();
									setEditingItem(dictionaryItem);
									setItemFormOpen(true);
								}}
							>
								{t("adminShell.dictionaries.edit")}
							</TableActionButton>
							<TableActionMenu
								items={[
									{
										icon:
											dictionaryItem.status === "active" ? (
												<StopOutlined aria-hidden />
											) : (
												<CheckCircleOutlined aria-hidden />
											),
										key: "toggle",
										label: toggleLabel,
										onClick: () => {
											toggleItemMutation.mutate(dictionaryItem);
										},
									},
									{
										danger: true,
										icon: <DeleteOutlined aria-hidden />,
										key: "delete",
										label: t("adminShell.dictionaries.delete"),
										onClick: () => {
											deleteItemMutation.reset();
											setDeletingItem(dictionaryItem);
										},
									},
								]}
								label={t("adminShell.dictionaries.more")}
							/>
						</Space>
					);
				},
				title: t("adminShell.dictionaries.columns.actions"),
				width: token.controlHeight * 5,
			});
		}

		return columns;
	}, [
		canManage,
		deleteItemMutation,
		formatPreferences,
		itemTableState.order,
		itemTableState.sort,
		saveItemMutation,
		statusTag,
		t,
		toggleItemMutation,
		token.controlHeight,
	]);
	const handleTypeTableChange: NonNullable<
		TableProps<PlatformDictionaryType>["onChange"]
	> = (pagination, _filters, sorterState) => {
		const currentSorter = Array.isArray(sorterState)
			? sorterState[0]
			: sorterState;
		const nextSorting = resolveTableSort(
			currentSorter?.columnKey,
			currentSorter?.order,
			typeSortMap,
		);
		setTypeTableState({
			order: nextSorting.order,
			page: pagination.current ?? typeTableState.page,
			pageSize: pagination.pageSize ?? typeTableState.pageSize,
			sort: nextSorting.sort,
		});
	};
	const handleItemTableChange: NonNullable<
		TableProps<PlatformDictionaryItem>["onChange"]
	> = (pagination, _filters, sorterState) => {
		const currentSorter = Array.isArray(sorterState)
			? sorterState[0]
			: sorterState;
		const nextSorting = resolveTableSort(
			currentSorter?.columnKey,
			currentSorter?.order,
			itemSortMap,
		);
		setItemTableState({
			order: nextSorting.order,
			page: pagination.current ?? itemTableState.page,
			pageSize: pagination.pageSize ?? itemTableState.pageSize,
			sort: nextSorting.sort,
		});
	};

	return (
		<Flex gap={token.marginLG} vertical>
			{messageContext}
			<LogTablePanel<PlatformDictionaryType>
				columnSettingsStorageKey={getTableColumnSettingsStorageKey("dictionary-types")}
				columnVisibility={typeColumnVisibility}
				columns={typeColumns}
				dataSource={typeQuery.data?.items ?? []}
				emptyText={t("adminShell.dictionaries.typeEmpty")}
				error={typeQuery.error}
				errorFallback={t("adminShell.dictionaries.errors.fallback")}
				errorTitle={t("adminShell.dictionaries.errors.load")}
				initialLoading={typeQuery.isPending}
				minimumWidth={token.controlHeight * 28}
				onPageChange={(page, pageSize) =>
					setTypeTableState((currentState) => ({
						...currentState,
						page,
						pageSize,
					}))
				}
				onReload={() => void typeQuery.refetch()}
				onTableChange={handleTypeTableChange}
				page={typeQuery.data?.page ?? typeTableState.page}
				pageSize={typeQuery.data?.pageSize ?? typeTableState.pageSize}
				primaryAction={
					canManage ? (
						<Button
							icon={<PlusOutlined aria-hidden />}
							onClick={() => {
								saveTypeMutation.reset();
								setEditingType(null);
								setTypeFormOpen(true);
							}}
							type="primary"
						>
							{t("adminShell.dictionaries.createType")}
						</Button>
					) : undefined
				}
				queryPanel={
					<TypeQueryPanel
						initialFilters={defaultTypeFilters}
						loading={typeQuery.isFetching && !typeQuery.isPending}
						onApply={(filters) => {
							setTypeFilters(filters);
							resetTypeTablePage();
						}}
						onReset={() => {
							setTypeFilters(defaultTypeFilters);
							resetTypeTablePage();
						}}
					/>
				}
				refreshing={typeQuery.isFetching && !typeQuery.isPending}
				testId="admin-dictionaries-type-table"
				title={t("adminShell.dictionaries.typeTableTitle")}
				total={typeQuery.data?.total ?? 0}
				workspaceTestId="admin-dictionaries-type-workspace"
			/>

			<LogTablePanel<PlatformDictionaryItem>
				columnSettingsStorageKey={getTableColumnSettingsStorageKey("dictionary-items")}
				columnVisibility={itemColumnVisibility}
				columns={itemColumns}
				dataSource={itemQuery.data?.items ?? []}
				description={
					selectedType ? (
						<Typography.Text type="secondary">
							{t("adminShell.dictionaries.itemTableHint", {
								name: selectedType.name,
							})}
						</Typography.Text>
					) : (
						<Typography.Text type="secondary">
							{t("adminShell.dictionaries.noTypeSelected")}
						</Typography.Text>
					)
				}
				emptyText={t("adminShell.dictionaries.itemEmpty")}
				error={itemQuery.error}
				errorFallback={t("adminShell.dictionaries.errors.fallback")}
				errorTitle={t("adminShell.dictionaries.errors.load")}
				initialLoading={selectedType !== null && itemQuery.isPending}
				minimumWidth={token.controlHeight * 30}
				onPageChange={(page, pageSize) =>
					setItemTableState((currentState) => ({
						...currentState,
						page,
						pageSize,
					}))
				}
				onReload={() => void itemQuery.refetch()}
				onTableChange={handleItemTableChange}
				page={itemQuery.data?.page ?? itemTableState.page}
				pageSize={itemQuery.data?.pageSize ?? itemTableState.pageSize}
				primaryAction={
					canManage ? (
						<Button
							disabled={!selectedType}
							icon={<PlusOutlined aria-hidden />}
							onClick={() => {
								saveItemMutation.reset();
								setEditingItem(null);
								setItemFormOpen(true);
							}}
							type="primary"
						>
							{t("adminShell.dictionaries.createItem")}
						</Button>
					) : undefined
				}
				queryPanel={
					<ItemQueryPanel
						initialFilters={defaultItemFilters}
						loading={itemQuery.isFetching && !itemQuery.isPending}
						onApply={(filters) => {
							setItemFilters(filters);
							resetItemTablePage();
						}}
						onReset={() => {
							setItemFilters(defaultItemFilters);
							resetItemTablePage();
						}}
					/>
				}
				refreshing={itemQuery.isFetching && !itemQuery.isPending}
				testId="admin-dictionaries-item-table"
				title={t("adminShell.dictionaries.itemTableTitle")}
				total={itemQuery.data?.total ?? 0}
				workspaceTestId="admin-dictionaries-item-workspace"
			/>

			<TypeFormDrawer
				dictionaryType={editingType}
				error={saveTypeMutation.isError}
				loading={saveTypeMutation.isPending}
				onClose={() => {
					saveTypeMutation.reset();
					setTypeFormOpen(false);
					setEditingType(null);
				}}
				onSubmit={(values) => saveTypeMutation.mutate(values)}
				open={typeFormOpen}
			/>
			<ItemFormDrawer
				dictionaryItem={editingItem}
				error={saveItemMutation.isError}
				loading={saveItemMutation.isPending}
				onClose={() => {
					saveItemMutation.reset();
					setItemFormOpen(false);
					setEditingItem(null);
				}}
				onSubmit={(values) => saveItemMutation.mutate(values)}
				open={itemFormOpen}
			/>

			<Modal
				cancelText={t("adminShell.dictionaries.cancel")}
				confirmLoading={deleteTypeMutation.isPending}
				destroyOnHidden
				onCancel={() => setDeletingType(null)}
				onOk={() => {
					if (deletingType) {
						deleteTypeMutation.mutate(deletingType.id);
					}
				}}
				okButtonProps={{ danger: true }}
				okText={t("adminShell.dictionaries.confirmDelete")}
				open={deletingType !== null}
				title={t("adminShell.dictionaries.deleteTypeTitle")}
			>
				{deleteTypeMutation.isError ? (
					<Alert
						description={t("adminShell.dictionaries.errors.fallback")}
						showIcon
						title={t("adminShell.dictionaries.errors.delete")}
						type="error"
					/>
				) : (
					t("adminShell.dictionaries.deleteTypeDescription", {
						name: deletingType?.name,
					})
				)}
			</Modal>
			<Modal
				cancelText={t("adminShell.dictionaries.cancel")}
				confirmLoading={deleteItemMutation.isPending}
				destroyOnHidden
				onCancel={() => setDeletingItem(null)}
				onOk={() => {
					if (deletingItem) {
						deleteItemMutation.mutate(deletingItem.id);
					}
				}}
				okButtonProps={{ danger: true }}
				okText={t("adminShell.dictionaries.confirmDelete")}
				open={deletingItem !== null}
				title={t("adminShell.dictionaries.deleteItemTitle")}
			>
				{deleteItemMutation.isError ? (
					<Alert
						description={t("adminShell.dictionaries.errors.fallback")}
						showIcon
						title={t("adminShell.dictionaries.errors.delete")}
						type="error"
					/>
				) : (
					t("adminShell.dictionaries.deleteItemDescription", {
						label: deletingItem?.label,
					})
				)}
			</Modal>
		</Flex>
	);
}
