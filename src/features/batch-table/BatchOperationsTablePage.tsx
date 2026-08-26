import { PlusOutlined } from "@ant-design/icons";
import {
	keepPreviousData,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import {
	Badge,
	Button,
	Col,
	Form,
	Input,
	Modal,
	Select,
	Space,
	message,
	theme,
	Typography,
} from "antd";
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
	type BatchTableStatusMutation,
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
import { TableActionButton } from "../../app/TableActionButton";
import { LogQueryPanel, LogTablePanel } from "../operations/LogTablePanel";
import { BatchSelectionToolbar } from "./components/BatchSelectionToolbar";

const { Link } = Typography;

interface BatchTableFilterValues {
	callCount?: string;
	description?: string;
	ruleName?: string;
	status: "all" | BatchTableRecordStatus;
}

interface BatchTableState {
	order: ListBatchTableRecordsInput["order"];
	page: number;
	pageSize: number;
	sort: ListBatchTableRecordsInput["sort"];
}

const defaultFilters: BatchTableFilterValues = { status: "all" };
const batchTableSortMap = {
	callCount: "call_count",
	lastScheduledAt: "last_scheduled_at",
	ruleName: "rule_name",
	status: "status",
} as const satisfies Record<string, BatchTableRecordSort>;
const batchTableColumnVisibility: readonly ResponsiveTableColumnConfig<string>[] =
	[
		{ key: "ruleName", priority: "compact", required: true },
		{ key: "description", priority: "compact" },
		{ key: "callCount", priority: "compact" },
		{ key: "status", priority: "compact" },
		{ key: "lastScheduledAt", priority: "compact" },
		{ key: "actions", priority: "compact", required: true },
	];

function getStatusBadgeStatus(status: BatchTableRecordStatus) {
	const statusMap = {
		closed: "default",
		exception: "error",
		online: "success",
		running: "processing",
	} as const;

	return statusMap[status];
}

function formatCallCount(value: number) {
	return `${Math.round(value / 10_000)}万`;
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
		pageSize: 20,
		sort: "last_scheduled_at",
	});
	const querySubmission = useQuerySubmission();
	const queryLayout = useQueryFilterLayout({
		expanded: filtersExpanded,
		fieldCount: 4,
	});
	const showDescriptionFilter =
		filtersExpanded || queryLayout.collapsedFieldCount >= 2;
	const showCallCountFilter =
		filtersExpanded || queryLayout.collapsedFieldCount >= 3;
	const showStatusFilter =
		filtersExpanded || queryLayout.collapsedFieldCount >= 4;
	const selectedIds = selectedRowKeys.map(String);
	const hasSelection = selectedIds.length > 0;
	const params = useMemo<ListBatchTableRecordsInput>(
		() => ({
			page: tableState.page,
			pageSize: tableState.pageSize,
			...(filters.ruleName?.trim()
				? { ruleName: filters.ruleName.trim() }
				: {}),
			...(filters.description?.trim()
				? { description: filters.description.trim() }
				: {}),
			...(filters.callCount?.trim()
				? { callCount: filters.callCount.trim() }
				: {}),
			...(filters.status !== "all" ? { status: filters.status } : {}),
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
	const currentRows = query.data?.items ?? [];
	const currentRowsById = new Map(currentRows.map((row) => [row.id, row]));
	const selectedCallCount = selectedIds.reduce(
		(total, id) => total + (currentRowsById.get(id)?.callCount ?? 0),
		0,
	);
	const selectedCallCountInTenThousands = Math.round(
		selectedCallCount / 10_000,
	);
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
			dataIndex: "ruleName",
			key: "ruleName",
			render: (value: string) => <Link>{value}</Link>,
			sortDirections: ["ascend", "descend"],
			sorter: true,
			sortOrder: sortOrder("rule_name"),
			title: t("adminShell.batchTable.columns.ruleName"),
			width: token.controlHeight * 6,
		},
		{
			dataIndex: "description",
			key: "description",
			title: t("adminShell.batchTable.columns.description"),
			width: token.controlHeight * 7,
		},
		{
			dataIndex: "callCount",
			key: "callCount",
			render: formatCallCount,
			sortDirections: ["ascend", "descend"],
			sorter: true,
			sortOrder: sortOrder("call_count"),
			title: t("adminShell.batchTable.columns.callCount"),
			width: token.controlHeight * 4,
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
			dataIndex: "lastScheduledAt",
			key: "lastScheduledAt",
			render: (value: string) => formatDateTime(value, formatPreferences),
			sortDirections: ["ascend", "descend"],
			sorter: true,
			sortOrder: sortOrder("last_scheduled_at"),
			title: t("adminShell.batchTable.columns.lastScheduledAt"),
			width: token.controlHeight * 5,
		},
		{
			key: "actions",
			render: () => (
				<Space size="middle">
					<TableActionButton
						onClick={() => void messageApi.info(t("adminShell.batchTable.configureTip"))}
					>
						{t("adminShell.batchTable.configure")}
					</TableActionButton>
					<TableActionButton
						onClick={() =>
							void messageApi.info(t("adminShell.batchTable.subscribeAlertTip"))
						}
					>
						{t("adminShell.batchTable.subscribeAlert")}
					</TableActionButton>
				</Space>
			),
			title: t("adminShell.batchTable.columns.actions"),
			width: token.controlHeight * 5,
		},
	];

	const applyFilters = (values: BatchTableFilterValues) => {
		setFilters({
			...(values.callCount?.trim()
				? { callCount: values.callCount.trim() }
				: {}),
			...(values.description?.trim()
				? { description: values.description.trim() }
				: {}),
			...(values.ruleName?.trim()
				? { ruleName: values.ruleName.trim() }
				: {}),
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
	const updateSelectedStatus = (status: BatchTableStatusMutation) => {
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
					label={t("adminShell.batchTable.filters.ruleName")}
					name="ruleName"
					style={{ marginBottom: 0 }}
				>
					<Input
						allowClear
						maxLength={80}
						placeholder={t("adminShell.batchTable.placeholders.input")}
					/>
				</Form.Item>
			</Col>
			{showDescriptionFilter ? (
				<Col span={queryLayout.columnSpan}>
					<Form.Item
						label={t("adminShell.batchTable.filters.description")}
						name="description"
						style={{ marginBottom: 0 }}
					>
						<Input
							allowClear
							maxLength={120}
							placeholder={t("adminShell.batchTable.placeholders.input")}
						/>
					</Form.Item>
				</Col>
			) : null}
			{showCallCountFilter ? (
				<Col span={queryLayout.columnSpan}>
					<Form.Item
						label={t("adminShell.batchTable.filters.callCount")}
						name="callCount"
						style={{ marginBottom: 0 }}
					>
						<Input
							allowClear
							maxLength={20}
							placeholder={t("adminShell.batchTable.placeholders.input")}
						/>
					</Form.Item>
				</Col>
			) : null}
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
									label: t("adminShell.batchTable.statuses.exception"),
									value: "exception",
								},
								{
									label: t("adminShell.batchTable.statuses.closed"),
									value: "closed",
								},
								{
									label: t("adminShell.batchTable.statuses.online"),
									value: "online",
								},
								{
									label: t("adminShell.batchTable.statuses.running"),
									value: "running",
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
				dataSource={currentRows}
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
						selectedCallCount={selectedCallCountInTenThousands}
						selectedCount={selectedIds.length}
						statusLoading={statusMutation.isPending}
					/>
				}
				emptyText={t("adminShell.batchTable.empty")}
				error={query.error}
				errorFallback={t("adminShell.batchTable.errorFallback")}
				errorTitle={t("adminShell.batchTable.loadError")}
				initialLoading={query.isPending}
				minimumWidth={token.controlHeight * 34}
				onPageChange={(page, pageSize) =>
					setTableState((value) => ({ ...value, page, pageSize }))
				}
				onReload={() => void query.refetch()}
				onTableChange={handleTableChange}
				page={query.data?.page ?? tableState.page}
				pageSize={query.data?.pageSize ?? tableState.pageSize}
				primaryAction={
					<Button
						icon={<PlusOutlined aria-hidden />}
						onClick={() =>
							void messageApi.info(t("adminShell.batchTable.createTip"))
						}
						type="primary"
					>
						{t("adminShell.batchTable.create")}
					</Button>
				}
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
