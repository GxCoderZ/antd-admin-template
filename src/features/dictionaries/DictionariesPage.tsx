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
	Flex,
	Modal,
	Space,
	Tag,
	Tabs,
	message,
	theme,
} from "antd";
import type { TableColumnsType, TableProps } from "antd";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { formatDateTime } from "../../app/formatting";
import { useLocalePreferences } from "../../app/localePreferences";
import { getTableColumnSettingsStorageKey } from "../../app/preferenceStorage";
import { useQuerySubmission } from "../../app/queryFilterLayout";
import { useRouteSessionState } from "../../app/routeSessionState";
import { resolveTableSort } from "../../app/tableSorting";
import {
	TableActionButton,
	TableActionMenu,
} from "../../app/TableActionButton";
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
import { LogTablePanel } from "../operations/LogTablePanel";
import {
	DictionaryItemDetailDrawer,
	DictionaryTypeDetailDrawer,
} from "./components/DictionaryDetailDrawers";

import {
	DictionaryColorTag,
	ItemFormDrawer,
	ItemQueryPanel,
	TypeFormDrawer,
	TypeQueryPanel,
} from "./components/DictionariesPageParts";
import {
	defaultItemFilters,
	defaultItemTableState,
	defaultTypeFilters,
	defaultTypeTableState,
	dictionariesRouteKey,
	getStatusColor,
	itemColumnVisibility,
	itemSortMap,
	typeColumnVisibility,
	typeSortMap,
	type ItemFilterValues,
	type ItemSort,
	type ItemTableState,
	type PageData,
	type TypeFilterValues,
	type TypeSort,
	type TypeTableState,
} from "./components/DictionariesPageModel";

interface DictionariesPageProps {
	canManage?: boolean;
}
export function DictionariesPage({ canManage = true }: DictionariesPageProps) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const queryClient = useQueryClient();
	const [messageApi, messageContext] = message.useMessage();
	const formatPreferences = useLocalePreferences();
	const [typeFilters, setTypeFilters] = useRouteSessionState<TypeFilterValues>({
		initialState: defaultTypeFilters,
		routeKey: dictionariesRouteKey,
		stateKey: "type-query-applied",
	});
	const [itemFilters, setItemFilters] = useRouteSessionState<ItemFilterValues>({
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
	const [selectedTypeId, setSelectedTypeId] = useRouteSessionState<
		string | null
	>({
		initialState: null,
		routeKey: dictionariesRouteKey,
		stateKey: "selected-type",
	});
	const [activePane, setActivePane] = useRouteSessionState<"types" | "items">({
		initialState: "types",
		routeKey: dictionariesRouteKey,
		stateKey: "active-pane",
	});
	const [typeFormOpen, setTypeFormOpen] = useState(false);
	const [itemFormOpen, setItemFormOpen] = useState(false);
	const [editingType, setEditingType] = useState<PlatformDictionaryType | null>(
		null,
	);
	const [editingItem, setEditingItem] = useState<PlatformDictionaryItem | null>(
		null,
	);
	const [viewingType, setViewingType] = useState<PlatformDictionaryType | null>(
		null,
	);
	const [viewingItem, setViewingItem] = useState<PlatformDictionaryItem | null>(
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
	const selectTypeForItems = useCallback(
		(typeId: string) => {
			setSelectedTypeId(typeId);
			resetItemTablePage();
			setActivePane("items");
		},
		[resetItemTablePage, setActivePane, setSelectedTypeId],
	);
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
				render: (name: string, dictionaryType) => (
					<TableActionButton onClick={() => setViewingType(dictionaryType)}>
						{name}
					</TableActionButton>
				),
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
									selectTypeForItems(dictionaryType.id);
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
		selectTypeForItems,
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
				render: (label: string, dictionaryItem) => (
					<TableActionButton onClick={() => setViewingItem(dictionaryItem)}>
						{label}
					</TableActionButton>
				),
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
	const typePanel = (
		<LogTablePanel<PlatformDictionaryType>
			columnSettingsStorageKey={getTableColumnSettingsStorageKey(
				"dictionary-types",
			)}
			columnVisibility={typeColumnVisibility}
			columns={typeColumns}
			dataSource={typeQuery.data?.items ?? []}
			emptyText={t("adminShell.dictionaries.typeEmpty")}
			error={typeQuery.error}
			errorFallback={t("adminShell.dictionaries.errors.fallback")}
			errorTitle={t("adminShell.dictionaries.errors.load")}
			initialLoading={typeQuery.isPending}
			minimumWidth={token.controlHeight * 24}
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
	);
	const itemPanel = (
		<LogTablePanel<PlatformDictionaryItem>
			columnSettingsStorageKey={getTableColumnSettingsStorageKey(
				"dictionary-items",
			)}
			columnVisibility={itemColumnVisibility}
			columns={itemColumns}
			dataSource={itemQuery.data?.items ?? []}
			emptyText={
				selectedType
					? t("adminShell.dictionaries.itemEmpty")
					: t("adminShell.dictionaries.noTypeSelected")
			}
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
			title={
				selectedType
					? selectedType.name
					: t("adminShell.dictionaries.itemTableTitle")
			}
			total={itemQuery.data?.total ?? 0}
			workspaceTestId="admin-dictionaries-item-workspace"
		/>
	);
	const dictionaryWorkspace = (
		<Tabs
			activeKey={activePane}
			data-testid="admin-dictionaries-master-detail"
			destroyOnHidden
			items={[
				{
					children: typePanel,
					key: "types",
					label: t("adminShell.dictionaries.typeTableTitle"),
				},
				{
					children: itemPanel,
					key: "items",
					label: t("adminShell.dictionaries.itemTableTitle"),
				},
			]}
			onChange={(key) => {
				if (key === "types" || key === "items") {
					setActivePane(key);
				}
			}}
		/>
	);

	return (
		<Flex gap={token.marginLG} vertical>
			{messageContext}
			{dictionaryWorkspace}

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
			<DictionaryTypeDetailDrawer
				dictionaryType={viewingType}
				onClose={() => setViewingType(null)}
			/>
			<DictionaryItemDetailDrawer
				dictionaryItem={viewingItem}
				onClose={() => setViewingItem(null)}
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
