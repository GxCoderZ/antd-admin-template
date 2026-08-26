import { PlusOutlined } from "@ant-design/icons";
import {
	PageContainer,
	ProTable,
	type ProColumns,
} from "@ant-design/pro-components";
import {
	keepPreviousData,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { Alert, Button, Modal, message } from "antd";
import type { TableProps } from "antd";
import type { Key } from "react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { useRouteSessionState } from "../../app/routeSessionState";
import { resolveTableSort } from "../../app/tableSorting";
import {
	batchTableRecordsQueryKey,
	deleteBatchTableRecords,
	listBatchTableRecords,
	updateBatchTableRecordStatus,
	type BatchTableRecord,
	type BatchTableRecordSort,
	type BatchTableRecordStatus,
	type BatchTableStatusMutation,
	type ListBatchTableRecordsInput,
} from "#src/api/batch-table";
import { ApiProblemError } from "#src/api/client";
import { BatchBulkActionBar } from "./components/BatchSelectionToolbar";

interface BatchTableFilterValues {
	callCount?: string;
	description?: string;
	lastScheduledAt?: string;
	ruleName?: string;
	status?: BatchTableRecordStatus;
}

interface BatchTableState {
	order?: ListBatchTableRecordsInput["order"];
	page: number;
	pageSize: number;
	sort?: ListBatchTableRecordsInput["sort"];
}

const defaultFilters: BatchTableFilterValues = {};
const defaultTableState: BatchTableState = {
	page: 1,
	pageSize: 20,
};
const pageSizeOptions = [10, 20, 50, 100];
const batchTableRouteKey = "/examples/lists/batch-operations";
const batchTableSortMap = {
	callCount: "call_count",
} as const satisfies Record<string, BatchTableRecordSort>;

function formatCallCount(value: number) {
	return `${Math.round(value / 10_000)}万`;
}

function formatProDateTime(value: string) {
	return value.replace("T", " ").replace(/\.\d{3}Z$/, "");
}

function getProblemDetail(error: unknown) {
	return error instanceof ApiProblemError ? error.problem?.detail : undefined;
}

export function BatchOperationsTablePage() {
	const { t } = useTranslation();
	const [messageApi, messageContext] = message.useMessage();
	const queryClient = useQueryClient();
	const [filters, setFilters] = useRouteSessionState<BatchTableFilterValues>({
		initialState: defaultFilters,
		routeKey: batchTableRouteKey,
		stateKey: "query-applied",
	});
	const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);
	const [selectedRows, setSelectedRows] = useState<BatchTableRecord[]>([]);
	const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
	const [tableState, setTableState] = useRouteSessionState<BatchTableState>({
		initialState: defaultTableState,
		routeKey: batchTableRouteKey,
		stateKey: "table",
	});
	const selectedIds = selectedRowKeys.map(String);
	const hasSelection = selectedIds.length > 0;
	const selectedCallCountInTenThousands = Math.round(
		selectedRows.reduce((total, row) => total + row.callCount, 0) / 10_000,
	);
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
			...(filters.lastScheduledAt?.trim()
				? { lastScheduledAt: filters.lastScheduledAt.trim() }
				: {}),
			...(filters.status ? { status: filters.status } : {}),
			...(tableState.sort === "call_count" && tableState.order
				? { order: tableState.order, sort: tableState.sort }
				: {}),
		}),
		[filters, tableState],
	);
	const query = useQuery({
		placeholderData: keepPreviousData,
		queryFn: ({ signal }) => listBatchTableRecords(params, signal),
		queryKey: [...batchTableRecordsQueryKey, params],
	});
	const currentRows = query.data?.items ?? [];
	const invalidateList = () =>
		queryClient.invalidateQueries({ queryKey: batchTableRecordsQueryKey });
	const clearSelection = () => {
		setSelectedRowKeys([]);
		setSelectedRows([]);
	};
	const statusMutation = useMutation({
		mutationFn: updateBatchTableRecordStatus,
		onError: () =>
			void messageApi.error(t("adminShell.batchTable.statusError")),
		onSuccess: async (_result, input) => {
			await invalidateList();
			clearSelection();
			void messageApi.success(
				t("adminShell.batchTable.statusSuccess", {
					count: input.ids.length,
					status: t(`adminShell.batchTable.statuses.${input.status}`),
				}),
			);
		},
	});
	const deleteMutation = useMutation({
		mutationFn: deleteBatchTableRecords,
		onError: () =>
			void messageApi.error(t("adminShell.batchTable.deleteError")),
		onSuccess: async (_result, input) => {
			await invalidateList();
			setDeleteConfirmOpen(false);
			clearSelection();
			void messageApi.success(
				t("adminShell.batchTable.deleteSuccess", { count: input.ids.length }),
			);
		},
	});
	const columns: ProColumns<BatchTableRecord>[] = [
		{
			dataIndex: "ruleName",
			key: "ruleName",
			render: (dom) => (
				<Button
					onClick={() =>
						void messageApi.info(t("adminShell.batchTable.configureTip"))
					}
					type="link"
				>
					{dom}
				</Button>
			),
			title: t("adminShell.batchTable.columns.ruleName"),
		},
		{
			dataIndex: "description",
			key: "description",
			title: t("adminShell.batchTable.columns.description"),
			valueType: "textarea",
		},
		{
			dataIndex: "callCount",
			key: "callCount",
			renderText: formatCallCount,
			sorter: true,
			sortOrder:
				tableState.sort === "call_count" && tableState.order
					? tableState.order === "asc"
						? "ascend"
						: "descend"
					: null,
			title: t("adminShell.batchTable.columns.callCount"),
		},
		{
			dataIndex: "status",
			key: "status",
			title: t("adminShell.batchTable.columns.status"),
			valueEnum: {
				closed: {
					status: "Default",
					text: t("adminShell.batchTable.statuses.closed"),
				},
				exception: {
					status: "Error",
					text: t("adminShell.batchTable.statuses.exception"),
				},
				online: {
					status: "Success",
					text: t("adminShell.batchTable.statuses.online"),
				},
				running: {
					status: "Processing",
					text: t("adminShell.batchTable.statuses.running"),
				},
			},
		},
		{
			dataIndex: "lastScheduledAt",
			key: "lastScheduledAt",
			render: (_, record) => formatProDateTime(record.lastScheduledAt),
			title: t("adminShell.batchTable.columns.lastScheduledAt"),
			valueType: "dateTime",
		},
		{
			key: "actions",
			render: () => [
				<Button
					key="configure"
					onClick={() =>
						void messageApi.info(t("adminShell.batchTable.configureTip"))
					}
					type="link"
				>
					{t("adminShell.batchTable.configure")}
				</Button>,
				<Button
					key="subscribe-alert"
					onClick={() =>
						void messageApi.info(t("adminShell.batchTable.subscribeAlertTip"))
					}
					type="link"
				>
					{t("adminShell.batchTable.subscribeAlert")}
				</Button>,
			],
			title: t("adminShell.batchTable.columns.actions"),
			valueType: "option",
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
			...(values.lastScheduledAt?.trim()
				? { lastScheduledAt: values.lastScheduledAt.trim() }
				: {}),
			...(values.ruleName?.trim() ? { ruleName: values.ruleName.trim() } : {}),
			...(values.status ? { status: values.status } : {}),
		});
		clearSelection();
		setTableState((value) => ({ ...value, page: 1 }));
	};
	const resetFilters = () => {
		setFilters(defaultFilters);
		clearSelection();
		setTableState((value) => ({ ...value, page: 1 }));
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
				...value,
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

	return (
		<PageContainer pageHeaderRender={false}>
			{messageContext}
			<ProTable<BatchTableRecord, BatchTableFilterValues>
				columns={columns}
				dataSource={currentRows}
				dateFormatter="string"
				defaultSize="middle"
				form={{ initialValues: defaultFilters }}
				headerTitle={t("adminShell.batchTable.title")}
				loading={query.isPending || query.isFetching}
				locale={{
					emptyText: query.error ? (
						<Alert
							action={
								<Button onClick={() => void query.refetch()}>
									{t("adminShell.logs.common.retry")}
								</Button>
							}
							description={
								getProblemDetail(query.error) ??
								t("adminShell.batchTable.errorFallback")
							}
							showIcon
							title={t("adminShell.batchTable.loadError")}
							type="error"
						/>
					) : (
						t("adminShell.batchTable.empty")
					),
				}}
				onChange={handleTableChange}
				onReset={resetFilters}
				onSubmit={applyFilters}
				options={{
					density: true,
					reload: () => void query.refetch(),
					setting: true,
				}}
				pagination={{
					current: query.data?.page ?? tableState.page,
					pageSize: query.data?.pageSize ?? tableState.pageSize,
					pageSizeOptions,
					showSizeChanger: true,
					showTotal: (total, [start, end]) =>
						t("adminShell.logs.common.paginationTotal", {
							end,
							start,
							total,
						}),
					total: query.data?.total ?? 0,
				}}
				rowKey="id"
				rowSelection={{
					onChange: (keys, rows) => {
						setSelectedRowKeys(keys);
						setSelectedRows(rows);
					},
					preserveSelectedRowKeys: true,
					selectedRowKeys,
				}}
				search={{ labelWidth: 120 }}
				scroll={{ x: "max-content" }}
				toolBarRender={() => [
					<Button
						icon={<PlusOutlined aria-hidden />}
						key="create"
						onClick={() =>
							void messageApi.info(t("adminShell.batchTable.createTip"))
						}
						type="primary"
					>
						{t("adminShell.batchTable.create")}
					</Button>,
				]}
			/>
			<BatchBulkActionBar
				deleteLoading={deleteMutation.isPending}
				disabled={!hasSelection}
				onDelete={() => setDeleteConfirmOpen(true)}
				onStatusChange={updateSelectedStatus}
				selectedCallCount={selectedCallCountInTenThousands}
				selectedCount={selectedIds.length}
				statusLoading={statusMutation.isPending}
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
		</PageContainer>
	);
}
