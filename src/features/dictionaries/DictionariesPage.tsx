import { PlusOutlined } from "@ant-design/icons";
import {
	keepPreviousData,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { Alert, Button, Flex, Modal, Tabs, message, theme } from "antd";
import type { TableProps } from "antd";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { getTableColumnSettingsStorageKey } from "../../app/preferenceStorage";
import { useQuerySubmission } from "../../app/queryFilterLayout";
import { useRouteSessionState } from "../../app/routeSessionState";
import {
	resolveTableSort,
	tableSortStateVersion,
} from "../../app/tableSorting";
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
	ItemFormDrawer,
	TypeFormDrawer,
} from "./components/DictionariesPageParts";
import {
	useDictionaryItemTableColumns,
	useDictionaryTypeTableColumns,
} from "./components/useDictionaryTableColumns";
import { useItemQuery, useTypeQuery } from "./components/useDictionaryQueries";
import {
	defaultItemFilters,
	defaultItemTableState,
	defaultTypeFilters,
	defaultTypeTableState,
	dictionariesRouteKey,
	itemColumnVisibility,
	itemSortMap,
	typeColumnVisibility,
	typeSortMap,
	type ItemFilterValues,
	type ItemTableState,
	type PageData,
	type TypeFilterValues,
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
			version: tableSortStateVersion,
		});
	const [itemTableState, setItemTableState] =
		useRouteSessionState<ItemTableState>({
			initialState: defaultItemTableState,
			routeKey: dictionariesRouteKey,
			stateKey: "item-table",
			version: tableSortStateVersion,
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
	const handleTypeEdit = useCallback(
		(dictionaryType: PlatformDictionaryType) => {
			saveTypeMutation.reset();
			setEditingType(dictionaryType);
			setTypeFormOpen(true);
		},
		[saveTypeMutation],
	);
	const handleItemEdit = useCallback(
		(dictionaryItem: PlatformDictionaryItem) => {
			saveItemMutation.reset();
			setEditingItem(dictionaryItem);
			setItemFormOpen(true);
		},
		[saveItemMutation],
	);
	const handleTypeDelete = useCallback(
		(dictionaryType: PlatformDictionaryType) => {
			deleteTypeMutation.reset();
			setDeletingType(dictionaryType);
		},
		[deleteTypeMutation],
	);
	const handleItemDelete = useCallback(
		(dictionaryItem: PlatformDictionaryItem) => {
			deleteItemMutation.reset();
			setDeletingItem(dictionaryItem);
		},
		[deleteItemMutation],
	);
	const typeColumns = useDictionaryTypeTableColumns({
		canManage,
		onDelete: handleTypeDelete,
		onEdit: handleTypeEdit,
		onManageItems: (dictionaryType) => selectTypeForItems(dictionaryType.id),
		onToggle: toggleTypeMutation.mutate,
		onView: setViewingType,
		tableState: typeTableState,
	});
	const itemColumns = useDictionaryItemTableColumns({
		canManage,
		onDelete: handleItemDelete,
		onEdit: handleItemEdit,
		onToggle: toggleItemMutation.mutate,
		onView: setViewingItem,
		tableState: itemTableState,
	});
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
	const typeTableQuery = useTypeQuery({
		initialFilters: defaultTypeFilters,
		loading: typeQuery.isFetching && !typeQuery.isPending,
		onApply: (filters) => {
			setTypeFilters(filters);
			resetTypeTablePage();
		},
		onReset: () => {
			setTypeFilters(defaultTypeFilters);
			setTypeTableState((current) => ({
				...current,
				order: undefined,
				page: 1,
				sort: undefined,
			}));
			submitTypeQuery();
		},
	});

	const itemTableQuery = useItemQuery({
		initialFilters: defaultItemFilters,
		loading: itemQuery.isFetching && !itemQuery.isPending,
		onApply: (filters) => {
			setItemFilters(filters);
			resetItemTablePage();
		},
		onReset: () => {
			setItemFilters(defaultItemFilters);
			setItemTableState((current) => ({
				...current,
				order: undefined,
				page: 1,
				sort: undefined,
			}));
			submitItemQuery();
		},
	});

	const typePanel = (
		<LogTablePanel<PlatformDictionaryType, TypeFilterValues>
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
			query={typeTableQuery}
			refreshing={typeQuery.isFetching && !typeQuery.isPending}
			testId="admin-dictionaries-type-table"
			title={t("adminShell.dictionaries.typeTableTitle")}
			total={typeQuery.data?.total ?? 0}
			workspaceTestId="admin-dictionaries-type-workspace"
		/>
	);
	const itemPanel = (
		<LogTablePanel<PlatformDictionaryItem, ItemFilterValues>
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
			query={itemTableQuery}
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
