import {
	keepPreviousData,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { Badge, Col, Form, Input, Modal, Select, Tag, message, theme } from "antd";
import type { TableColumnsType, TableProps } from "antd";
import type { Key } from "react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import {
	batchTableRecordsQueryKey,
	deleteBatchTableRecords,
	exportBatchTableRecords,
	listBatchTableRecords,
	updateBatchTableRecordStatus,
	type BatchTableRecord,
	type BatchTableRecordSort,
	type BatchTableRecordStatus,
	type ListBatchTableRecordsInput,
} from "#src/api/batch-table";
import { formatDateTime } from "../../app/formatting";
import { useLocalePreferences } from "../../app/localePreferences";
import { getTableColumnSettingsStorageKey } from "../../app/preferenceStorage";
import {
	useQueryFilterLayout,
	useQuerySubmission,
} from "../../app/queryFilterLayout";
import type { ResponsiveTableColumnConfig } from "../../app/tableColumnVisibility";
import { resolveTableSort } from "../../app/tableSorting";
import { LogQueryPanel, LogTablePanel } from "../operations/LogTablePanel";
import { BatchSelectionToolbar } from "./components/BatchSelectionToolbar";

interface BatchTableFilterValues {
	category: string;
	q?: string;
	status: "all" | BatchTableRecordStatus;
}

interface BatchTableState {
	order: ListBatchTableRecordsInput["order"];
	page: number;
	pageSize: number;
	sort: ListBatchTableRecordsInput["sort"];
}

const defaultFilters: BatchTableFilterValues = {
	category: "all",
	status: "all",
};
const batchTableSortMap = {
	name: "name",
	owner: "owner",
	status: "status",
	updated_at: "updated_at",
} as const satisfies Record<string, BatchTableRecordSort>;
const batchTableColumnVisibility: readonly ResponsiveTableColumnConfig<string>[] =
	[
		{ key: "name", priority: "compact", required: true },
		{ key: "status", priority: "compact" },
		{ key: "category", priority: "compact" },
		{ key: "owner", priority: "regular" },
		{ key: "updated_at", priority: "regular" },
	];

function getStatusBadgeStatus(status: BatchTableRecordStatus) {
	return status === "active" ? "success" : "default";
}

export function BatchOperationsTablePage() {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const [messageApi, messageContext] = message.useMessage();
	const queryClient = useQueryClient();
	const formatPreferences = useLocalePreferences();
	const [form] = Form.useForm<BatchTableFilterValues>();
	const [filters, setFilters] =
		useState<BatchTableFilterValues>(defaultFilters);
	const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);
	const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
	const [filtersExpanded, setFiltersExpanded] = useState(false);
	const [tableState, setTableState] = useState<BatchTableState>({
		order: "desc",
		page: 1,
		pageSize: 10,
		sort: "updated_at",
	});
	const querySubmission = useQuerySubmission();
	const queryLayout = useQueryFilterLayout({
		expanded: filtersExpanded,
		fieldCount: 3,
	});
	const showStatusFilter =
		filtersExpanded || queryLayout.collapsedFieldCount >= 2;
	const showCategoryFilter =
		filtersExpanded || queryLayout.collapsedFieldCount >= 3;
	const selectedIds = selectedRowKeys.map(String);
	const hasSelection = selectedIds.length > 0;
	const params = useMemo<ListBatchTableRecordsInput>(
		() => ({
			page: tableState.page,
			pageSize: tableState.pageSize,
			...(filters.q?.trim() ? { q: filters.q.trim() } : {}),
			...(filters.status !== "all" ? { status: filters.status } : {}),
			...(filters.category !== "all" ? { category: filters.category } : {}),
			...(tableState.sort && tableState.order
				? { order: tableState.order, sort: tableState.sort }
				: {}),
		}),
		[filters, tableState],
	);
	const query = useQuery({
		placeholderData: keepPreviousData,
		queryFn: ({ signal }) => listBatchTableRecords(params, signal),
		queryKey: [...batchTableRecordsQueryKey, params, querySubmission.revision],
	});
	const invalidateList = () =>
		queryClient.invalidateQueries({ queryKey: batchTableRecordsQueryKey });
	const statusMutation = useMutation({
		mutationFn: updateBatchTableRecordStatus,
		onError: () => void messageApi.error(t("adminShell.batchTable.statusError")),
		onSuccess: async (_result, input) => {
			await invalidateList();
			setSelectedRowKeys([]);
			void messageApi.success(
				t("adminShell.batchTable.statusSuccess", {
					count: input.ids.length,
					status: t(`adminShell.batchTable.statuses.${input.status}`),
				}),
			);
		},
	});
	const exportMutation = useMutation({
		mutationFn: exportBatchTableRecords,
		onError: () => void messageApi.error(t("adminShell.batchTable.exportError")),
		onSuccess: (result) => {
			void messageApi.success(
				t("adminShell.batchTable.exportSuccess", {
					count: result.rowCount,
					fileName: result.fileName,
				}),
			);
		},
	});
	const deleteMutation = useMutation({
		mutationFn: deleteBatchTableRecords,
		onError: () => void messageApi.error(t("adminShell.batchTable.deleteError")),
		onSuccess: async (_result, input) => {
			await invalidateList();
			setDeleteConfirmOpen(false);
			setSelectedRowKeys([]);
			void messageApi.success(
				t("adminShell.batchTable.deleteSuccess", { count: input.ids.length }),
			);
		},
	});
	const sortOrder = (column: BatchTableRecordSort) =>
		tableState.sort === column && tableState.order
			? tableState.order === "asc"
				? "ascend"
				: "descend"
			: null;
	const columns: TableColumnsType<BatchTableRecord> = [
		{
			dataIndex: "name",
			key: "name",
			sortDirections: ["ascend", "descend"],
			sorter: true,
			sortOrder: sortOrder("name"),
			title: t("adminShell.batchTable.columns.name"),
			width: token.controlHeight * 6,
		},
		{
			dataIndex: "status",
			key: "status",
			render: (value: BatchTableRecordStatus) => (
				<Badge
					status={getStatusBadgeStatus(value)}
					text={t(`adminShell.batchTable.statuses.${value}`)}
				/>
			),
			sortDirections: ["ascend", "descend"],
			sorter: true,
			sortOrder: sortOrder("status"),
			title: t("adminShell.batchTable.columns.status"),
			width: token.controlHeight * 3,
		},
		{
			dataIndex: "category",
			key: "category",
			render: (value: string) => <Tag>{value}</Tag>,
			title: t("adminShell.batchTable.columns.category"),
			width: token.controlHeight * 4,
		},
		{
			dataIndex: "owner",
			key: "owner",
			sortDirections: ["ascend", "descend"],
			sorter: true,
			sortOrder: sortOrder("owner"),
			title: t("adminShell.batchTable.columns.owner"),
			width: token.controlHeight * 4,
		},
		{
			dataIndex: "updatedAt",
			key: "updated_at",
			render: (value: string) => formatDateTime(value, formatPreferences),
			sortDirections: ["ascend", "descend"],
			sorter: true,
			sortOrder: sortOrder("updated_at"),
			title: t("adminShell.batchTable.columns.updatedAt"),
			width: token.controlHeight * 5,
		},
	];

	const applyFilters = (values: BatchTableFilterValues) => {
		setFilters({
			category: values.category,
			...(values.q?.trim() ? { q: values.q.trim() } : {}),
			status: values.status,
		});
		setSelectedRowKeys([]);
		setTableState((value) => ({ ...value, page: 1 }));
		querySubmission.submit();
	};
	const resetFilters = () => {
		form.resetFields();
		setFilters(defaultFilters);
		setSelectedRowKeys([]);
		setTableState((value) => ({ ...value, page: 1 }));
		querySubmission.submit();
	};
	const handleTableChange: NonNullable<
		TableProps<BatchTableRecord>["onChange"]
	> = (pagination, _filters, sorterState, extra) => {
		if (extra.action === "sort") {
			const sorter = Array.isArray(sorterState) ? sorterState[0] : sorterState;
			const nextSort = resolveTableSort(
				sorter?.columnKey,
				sorter?.order,
				batchTableSortMap,
			);
			setTableState((value) => ({
				order: nextSort.order,
				page: 1,
				pageSize: pagination.pageSize ?? value.pageSize,
				sort: nextSort.sort,
			}));
			return;
		}
		setTableState((value) => ({
			...value,
			page: pagination.current ?? value.page,
			pageSize: pagination.pageSize ?? value.pageSize,
		}));
	};
	const updateSelectedStatus = (status: BatchTableRecordStatus) => {
		if (hasSelection) {
			statusMutation.mutate({ ids: selectedIds, status });
		}
	};
	const queryPanel = (
		<LogQueryPanel<BatchTableFilterValues>
			actionsTestId="batch-table-query-actions"
			canExpand={queryLayout.canExpand}
			columnSpan={queryLayout.columnSpan}
			containerRef={queryLayout.containerRef}
			expanded={filtersExpanded}
			form={form}
			formLayout={queryLayout.formLayout}
			initialValues={defaultFilters}
			loading={query.isFetching && !query.isPending}
			onFinish={applyFilters}
			onReset={resetFilters}
			onToggle={() => setFiltersExpanded((value) => !value)}
			submitterOffset={queryLayout.submitterOffset}
			testId="batch-table-query-form"
		>
			<Col span={queryLayout.columnSpan}>
				<Form.Item
					label={t("adminShell.batchTable.filters.q")}
					name="q"
					style={{ marginBottom: 0 }}
				>
					<Input
						allowClear
						maxLength={80}
						placeholder={t("adminShell.batchTable.placeholders.q")}
					/>
				</Form.Item>
			</Col>
			{showStatusFilter ? (
				<Col span={queryLayout.columnSpan}>
					<Form.Item
						label={t("adminShell.batchTable.filters.status")}
						name="status"
						style={{ marginBottom: 0 }}
					>
						<Select
							options={[
								{
									label: t("adminShell.batchTable.statuses.all"),
									value: "all",
								},
								{
									label: t("adminShell.batchTable.statuses.active"),
									value: "active",
								},
								{
									label: t("adminShell.batchTable.statuses.disabled"),
									value: "disabled",
								},
							]}
						/>
					</Form.Item>
				</Col>
			) : null}
			{showCategoryFilter ? (
				<Col span={queryLayout.columnSpan}>
					<Form.Item
						label={t("adminShell.batchTable.filters.category")}
						name="category"
						style={{ marginBottom: 0 }}
					>
						<Select
							options={[
								{
									label: t("adminShell.batchTable.categories.all"),
									value: "all",
								},
								{
									label: t("adminShell.batchTable.categories.permission"),
									value: "权限资产",
								},
								{
									label: t("adminShell.batchTable.categories.content"),
									value: "内容资产",
								},
								{
									label: t("adminShell.batchTable.categories.operation"),
									value: "运营资产",
								},
							]}
						/>
					</Form.Item>
				</Col>
			) : null}
		</LogQueryPanel>
	);

	return (
		<>
			{messageContext}
			<LogTablePanel<BatchTableRecord>
				columnSettingsStorageKey={getTableColumnSettingsStorageKey(
					"batch-table-records",
				)}
				columnVisibility={batchTableColumnVisibility}
				columns={columns}
				dataSource={query.data?.items ?? []}
				description={
					<BatchSelectionToolbar
						deleteLoading={deleteMutation.isPending}
						disabled={!hasSelection}
						exportLoading={exportMutation.isPending}
						onClear={() => setSelectedRowKeys([])}
						onDelete={() => setDeleteConfirmOpen(true)}
						onExport={() =>
							hasSelection && exportMutation.mutate({ ids: selectedIds })
						}
						onStatusChange={updateSelectedStatus}
						selectedCount={selectedIds.length}
						statusLoading={statusMutation.isPending}
					/>
				}
				emptyText={t("adminShell.batchTable.empty")}
				error={query.error}
				errorFallback={t("adminShell.batchTable.errorFallback")}
				errorTitle={t("adminShell.batchTable.loadError")}
				initialLoading={query.isPending}
				minimumWidth={token.controlHeight * 25}
				onPageChange={(page, pageSize) =>
					setTableState((value) => ({ ...value, page, pageSize }))
				}
				onReload={() => void query.refetch()}
				onTableChange={handleTableChange}
				page={query.data?.page ?? tableState.page}
				pageSize={query.data?.pageSize ?? tableState.pageSize}
				queryPanel={queryPanel}
				refreshing={query.isFetching && !query.isPending}
				rowSelection={{
					onChange: (keys) => setSelectedRowKeys(keys),
					preserveSelectedRowKeys: true,
					selectedRowKeys,
				}}
				testId="batch-table-card"
				title={t("adminShell.batchTable.title")}
				total={query.data?.total ?? 0}
				workspaceTestId="batch-table-workspace"
			/>
			<Modal
				cancelText={t("adminShell.batchTable.cancelDelete")}
				confirmLoading={deleteMutation.isPending}
				onCancel={() => setDeleteConfirmOpen(false)}
				onOk={() => deleteMutation.mutate({ ids: selectedIds })}
				okButtonProps={{ danger: true, disabled: !hasSelection }}
				okText={t("adminShell.batchTable.confirmDelete")}
				open={deleteConfirmOpen}
				title={t("adminShell.batchTable.deleteTitle")}
			>
				{t("adminShell.batchTable.deleteDescription", {
					count: selectedIds.length,
				})}
			</Modal>
		</>
	);
}
