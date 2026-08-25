import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import {
	Alert,
	Button,
	Col,
	Flex,
	Form,
	Grid,
	Input,
	message,
	Modal,
	Select,
	Space,
	Tag,
	theme,
} from "antd";
import type { TableColumnsType, TableProps } from "antd";
import {
	keepPreviousData,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { formatDateTime } from "../../app/formatting";
import { useLocalePreferences } from "../../app/localePreferences";
import { getTableColumnSettingsStorageKey } from "../../app/preferenceStorage";
import {
	useQueryFilterLayout,
	useQuerySubmission,
} from "../../app/queryFilterLayout";
import { resolveTableSort } from "../../app/tableSorting";
import { TableActionButton } from "../../app/TableActionButton";
import type { ResponsiveTableColumnConfig } from "../../app/tableColumnVisibility";
import {
	contentCategoriesQueryKey,
	contentCategoryItemsQueryKey,
	createContentCategory,
	createContentCategoryItem,
	deleteContentCategory,
	deleteContentCategoryItem,
	listContentCategories,
	listContentCategoryItems,
	type ContentCategory,
	type ContentCategoryItem,
	type ContentCategoryItemStatus,
	type ListContentCategoryItemsInput,
	type SaveContentCategoryInput,
	type SaveContentCategoryItemInput,
	updateContentCategory,
	updateContentCategoryItem,
} from "#src/api/content-categories";
import { LogQueryPanel, LogTablePanel } from "../operations/LogTablePanel";
import { CategoryEditorDrawer } from "./components/CategoryEditorDrawer";
import { CategoryTreePanel } from "./components/CategoryTreePanel";
import { ContentItemEditorDrawer } from "./components/ContentItemEditorDrawer";

interface FilterValues {
	q?: string;
	status: "all" | ContentCategoryItemStatus;
}

interface TableState {
	order: ListContentCategoryItemsInput["order"];
	page: number;
	pageSize: number;
	sort: ListContentCategoryItemsInput["sort"];
}

const defaultFilters: FilterValues = { status: "all" };
const sortMap: Record<string, NonNullable<ListContentCategoryItemsInput["sort"]>> = {
	categoryName: "category",
	owner: "owner",
	status: "status",
	title: "title",
	updatedAt: "updated_at",
};
const columnVisibility: readonly ResponsiveTableColumnConfig<string>[] = [
	{ key: "title", priority: "compact", required: true },
	{ key: "categoryName", priority: "regular" },
	{ key: "status", priority: "compact" },
	{ key: "owner", priority: "spacious" },
	{ key: "updatedAt", priority: "spacious" },
	{ key: "actions", priority: "compact", required: true },
];

function flattenCategories(
	categories: ContentCategory[],
	level = 0,
): Array<ContentCategory & { level: number }> {
	return categories.flatMap((category) => [
		{ ...category, level },
		...flattenCategories(category.children, level + 1),
	]);
}

export function ContentCategoryManagementPage() {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const screens = Grid.useBreakpoint();
	const formatPreferences = useLocalePreferences();
	const queryClient = useQueryClient();
	const [messageApi, messageContextHolder] = message.useMessage();
	const [modal, modalContextHolder] = Modal.useModal();
	const [filterForm] = Form.useForm<FilterValues>();
	const [categorySearch, setCategorySearch] = useState("");
	const [selectedCategoryId, setSelectedCategoryId] = useState("all");
	const [draftFilters, setDraftFilters] = useState<FilterValues>(defaultFilters);
	const [filters, setFilters] = useState<FilterValues>(defaultFilters);
	const [filtersExpanded, setFiltersExpanded] = useState(false);
	const [editingCategory, setEditingCategory] = useState<ContentCategory | null>(null);
	const [categoryEditorOpen, setCategoryEditorOpen] = useState(false);
	const [editingItem, setEditingItem] = useState<ContentCategoryItem | null>(null);
	const [itemEditorOpen, setItemEditorOpen] = useState(false);
	const [tableState, setTableState] = useState<TableState>({
		order: "desc",
		page: 1,
		pageSize: 10,
		sort: "updated_at",
	});
	const querySubmission = useQuerySubmission();
	const queryLayout = useQueryFilterLayout({
		expanded: filtersExpanded,
		fieldCount: 2,
	});
	const categoriesQuery = useQuery({
		queryFn: ({ signal }) => listContentCategories(categorySearch, signal),
		queryKey: [...contentCategoriesQueryKey, categorySearch],
	});
	const flatCategories = useMemo(
		() => flattenCategories(categoriesQuery.data ?? []),
		[categoriesQuery.data],
	);
	const categoryOptions = useMemo(
		() =>
			flatCategories.map((category) => ({
				label: `${"　".repeat(category.level)}${category.name}`,
				value: category.id,
			})),
		[flatCategories],
	);
	const selectedCategory = flatCategories.find(
		(category) => category.id === selectedCategoryId,
	);
	const itemQueryInput = useMemo<ListContentCategoryItemsInput>(
		() => ({
			...(selectedCategoryId !== "all" ? { categoryId: selectedCategoryId } : {}),
			...(filters.q?.trim() ? { q: filters.q.trim() } : {}),
			...(filters.status !== "all" ? { status: filters.status } : {}),
			...(tableState.order ? { order: tableState.order } : {}),
			page: tableState.page,
			pageSize: tableState.pageSize,
			...(tableState.sort ? { sort: tableState.sort } : {}),
		}),
		[filters, selectedCategoryId, tableState],
	);
	const itemsQuery = useQuery({
		placeholderData: keepPreviousData,
		queryFn: ({ signal }) => listContentCategoryItems(itemQueryInput, signal),
		queryKey: [
			...contentCategoryItemsQueryKey,
			itemQueryInput,
			querySubmission.revision,
		],
	});
	const refreshAll = async () => {
		await Promise.all([
			queryClient.invalidateQueries({ queryKey: contentCategoriesQueryKey }),
			queryClient.invalidateQueries({ queryKey: contentCategoryItemsQueryKey }),
		]);
	};
	const categorySaveMutation = useMutation({
		mutationFn: (input: SaveContentCategoryInput) =>
			editingCategory
				? updateContentCategory({ categoryId: editingCategory.id, input })
				: createContentCategory(input),
		onError: () => void messageApi.error(t("adminShell.contentCategories.feedback.saveError")),
		onSuccess: async () => {
			await refreshAll();
			setCategoryEditorOpen(false);
			setEditingCategory(null);
			void messageApi.success(t("adminShell.contentCategories.feedback.categorySaved"));
		},
	});
	const itemSaveMutation = useMutation({
		mutationFn: (input: SaveContentCategoryItemInput) =>
			editingItem
				? updateContentCategoryItem({ input, itemId: editingItem.id })
				: createContentCategoryItem(input),
		onError: () => void messageApi.error(t("adminShell.contentCategories.feedback.saveError")),
		onSuccess: async () => {
			await refreshAll();
			setItemEditorOpen(false);
			setEditingItem(null);
			void messageApi.success(t("adminShell.contentCategories.feedback.contentSaved"));
		},
	});
	const categoryDeleteMutation = useMutation({
		mutationFn: deleteContentCategory,
		onError: () => void messageApi.error(t("adminShell.contentCategories.feedback.categoryNotEmpty")),
		onSuccess: async () => {
			setSelectedCategoryId("all");
			await refreshAll();
			void messageApi.success(t("adminShell.contentCategories.feedback.categoryDeleted"));
		},
	});
	const itemDeleteMutation = useMutation({
		mutationFn: deleteContentCategoryItem,
		onError: () => void messageApi.error(t("adminShell.contentCategories.feedback.deleteError")),
		onSuccess: async () => {
			await refreshAll();
			void messageApi.success(t("adminShell.contentCategories.feedback.contentDeleted"));
		},
	});
	const sortOrder = useCallback(
		(sort: NonNullable<ListContentCategoryItemsInput["sort"]>) =>
			tableState.sort === sort && tableState.order
				? tableState.order === "asc"
					? "ascend"
					: "descend"
				: null,
		[tableState.order, tableState.sort],
	);
	const columns = useMemo<TableColumnsType<ContentCategoryItem>>(
		() => [
			{
				dataIndex: "title",
				key: "title",
				sortOrder: sortOrder("title"),
				sorter: true,
				title: t("adminShell.contentCategories.columns.title"),
				width: 260,
			},
			{
				dataIndex: "categoryName",
				key: "categoryName",
				sortOrder: sortOrder("category"),
				sorter: true,
				title: t("adminShell.contentCategories.columns.category"),
				width: 150,
			},
			{
				dataIndex: "status",
				key: "status",
				render: (status: ContentCategoryItemStatus) => (
					<Tag color={status === "published" ? "success" : "default"}>
						{t(`adminShell.contentCategories.itemStatuses.${status}`)}
					</Tag>
				),
				sortOrder: sortOrder("status"),
				sorter: true,
				title: t("adminShell.contentCategories.columns.status"),
				width: 110,
			},
			{
				dataIndex: "owner",
				key: "owner",
				sortOrder: sortOrder("owner"),
				sorter: true,
				title: t("adminShell.contentCategories.columns.owner"),
				width: 150,
			},
			{
				dataIndex: "updatedAt",
				key: "updatedAt",
				render: (value: string) => formatDateTime(value, formatPreferences),
				sortOrder: sortOrder("updated_at"),
				sorter: true,
				title: t("adminShell.contentCategories.columns.updatedAt"),
				width: 190,
			},
			{
				fixed: "right",
				key: "actions",
				render: (_value, item) => (
					<Space size="middle">
						<TableActionButton
							icon={<EditOutlined aria-hidden />}
							onClick={() => {
								setEditingItem(item);
								setItemEditorOpen(true);
							}}
						>
							{t("adminShell.contentCategories.edit")}
						</TableActionButton>
						<TableActionButton
							danger
							icon={<DeleteOutlined aria-hidden />}
							onClick={() => {
								modal.confirm({
									content: t("adminShell.contentCategories.confirmDeleteContent", { title: item.title }),
									okButtonProps: { danger: true },
									onOk: () => itemDeleteMutation.mutateAsync(item.id),
									title: t("adminShell.contentCategories.deleteContent"),
								});
							}}
						>
							{t("adminShell.contentCategories.delete")}
						</TableActionButton>
					</Space>
				),
				title: t("adminShell.contentCategories.columns.actions"),
				width: 150,
			},
		],
		[formatPreferences, itemDeleteMutation, modal, sortOrder, t],
	);
	const onTableChange: NonNullable<TableProps<ContentCategoryItem>["onChange"]> = (
		_pagination,
		_filters,
		sorterState,
		extra,
	) => {
		if (extra.action !== "sort") return;
		const sorter = Array.isArray(sorterState) ? sorterState[0] : sorterState;
		const next = resolveTableSort(sorter?.columnKey, sorter?.order, sortMap);
		setTableState((current) => ({ ...current, ...next, page: 1 }));
	};
	const queryPanel = (
		<LogQueryPanel<FilterValues>
			actionsTestId="content-category-query-actions"
			canExpand={queryLayout.canExpand}
			columnSpan={queryLayout.columnSpan}
			containerRef={queryLayout.containerRef}
			expanded={filtersExpanded}
			form={filterForm}
			formLayout={queryLayout.formLayout}
			initialValues={defaultFilters}
			loading={itemsQuery.isFetching}
			onFinish={() => {
				setFilters(draftFilters);
				setTableState((current) => ({ ...current, page: 1 }));
				querySubmission.submit();
			}}
			onReset={() => {
				filterForm.resetFields();
				setDraftFilters(defaultFilters);
				setFilters(defaultFilters);
				setTableState((current) => ({ ...current, page: 1 }));
				querySubmission.submit();
			}}
			onToggle={() => setFiltersExpanded((value) => !value)}
			submitterOffset={queryLayout.submitterOffset}
			testId="content-category-query"
		>
			<Col span={queryLayout.columnSpan}>
				<Form.Item label={t("adminShell.contentCategories.filters.keyword")} name="q">
					<Input
						allowClear
						onChange={(event) => setDraftFilters((current) => ({ ...current, q: event.target.value }))}
						placeholder={t("adminShell.contentCategories.searchContent")}
					/>
				</Form.Item>
			</Col>
			<Col
				span={queryLayout.columnSpan}
				style={{ display: filtersExpanded || queryLayout.collapsedFieldCount > 1 ? undefined : "none" }}
			>
				<Form.Item label={t("adminShell.contentCategories.filters.status")} name="status">
					<Select<FilterValues["status"]>
						onChange={(status) => setDraftFilters((current) => ({ ...current, status }))}
						options={[
							{ label: t("adminShell.contentCategories.itemStatuses.all"), value: "all" },
							{ label: t("adminShell.contentCategories.itemStatuses.draft"), value: "draft" },
							{ label: t("adminShell.contentCategories.itemStatuses.published"), value: "published" },
						]}
					/>
				</Form.Item>
			</Col>
		</LogQueryPanel>
	);
	const drawerSize = screens.sm ? 480 : "100%";
	const defaultItemCategory =
		selectedCategoryId !== "all"
			? selectedCategoryId
			: (categoryOptions[0]?.value ?? "");

	return (
		<>
			{messageContextHolder}
			{modalContextHolder}
			<Flex align="stretch" gap={token.marginLG} vertical={!screens.lg}>
				<div style={{ flex: screens.lg ? "0 0 300px" : "1 1 auto", minWidth: 0 }}>
					{categoriesQuery.isError ? (
						<Alert
							action={<Button onClick={() => void categoriesQuery.refetch()}>{t("adminShell.logs.common.retry")}</Button>}
						message={t("adminShell.contentCategories.feedback.loadError")}
						showIcon
						type="error"
						/>
					) : (
						<CategoryTreePanel
							categories={categoriesQuery.data ?? []}
							loading={categoriesQuery.isPending}
							onCreate={() => {
								setEditingCategory(null);
								setCategoryEditorOpen(true);
							}}
							onDelete={() => {
								if (!selectedCategory) return;
								modal.confirm({
									content: t("adminShell.contentCategories.confirmDeleteCategory", { name: selectedCategory.name }),
									okButtonProps: { danger: true },
									onOk: () => categoryDeleteMutation.mutateAsync(selectedCategory.id),
									title: t("adminShell.contentCategories.deleteCategory"),
								});
							}}
							onEdit={() => {
								if (!selectedCategory) return;
								setEditingCategory(selectedCategory);
								setCategoryEditorOpen(true);
							}}
							onSearch={setCategorySearch}
							onSelect={(categoryId) => {
								setSelectedCategoryId(categoryId);
								setTableState((current) => ({ ...current, page: 1 }));
							}}
							search={categorySearch}
							selectedCategoryId={selectedCategoryId}
						/>
					)}
				</div>
				<div style={{ flex: "1 1 0", minWidth: 0 }}>
					<LogTablePanel
						columnSettingsStorageKey={getTableColumnSettingsStorageKey("content-categories")}
						columnVisibility={columnVisibility}
						columns={columns}
						dataSource={itemsQuery.data?.items ?? []}
						emptyText={t("adminShell.contentCategories.emptyContent")}
						error={itemsQuery.error}
						errorTitle={t("adminShell.contentCategories.feedback.loadError")}
						initialLoading={itemsQuery.isPending}
						onPageChange={(page, pageSize) => setTableState((current) => ({ ...current, page, pageSize }))}
						onReload={() => void itemsQuery.refetch()}
						onTableChange={onTableChange}
						page={tableState.page}
						pageSize={tableState.pageSize}
						primaryAction={
							<Button
								disabled={categoryOptions.length === 0}
								icon={<PlusOutlined aria-hidden />}
								onClick={() => {
									setEditingItem(null);
									setItemEditorOpen(true);
								}}
								type="primary"
							>
								{t("adminShell.contentCategories.createContent")}
							</Button>
						}
						queryPanel={queryPanel}
						refreshing={itemsQuery.isFetching && !itemsQuery.isPending}
						testId="content-category-table"
						title={t("adminShell.contentCategories.tableTitle")}
						total={itemsQuery.data?.total ?? 0}
						workspaceTestId="content-category-workspace"
					/>
				</div>
			</Flex>
			<CategoryEditorDrawer
				category={editingCategory}
				categoryOptions={categoryOptions}
				defaultParentId={selectedCategoryId === "all" ? null : selectedCategoryId}
				loading={categorySaveMutation.isPending}
				onClose={() => setCategoryEditorOpen(false)}
				onSave={(input) => categorySaveMutation.mutate(input)}
				open={categoryEditorOpen}
				size={drawerSize}
			/>
			<ContentItemEditorDrawer
				categoryOptions={categoryOptions}
				defaultCategoryId={defaultItemCategory}
				item={editingItem}
				loading={itemSaveMutation.isPending}
				onClose={() => setItemEditorOpen(false)}
				onSave={(input) => itemSaveMutation.mutate(input)}
				open={itemEditorOpen}
				size={drawerSize}
			/>
		</>
	);
}
