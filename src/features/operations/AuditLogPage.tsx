import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
	Badge,
	Col,
	DatePicker,
	Flex,
	Form,
	Input,
	Select,
	Space,
	theme,
	Typography,
} from "antd";
import type { TableColumnsType, TableProps } from "antd";
import type { Dayjs } from "dayjs";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { formatDateTime } from "../../app/formatting";
import { useLocalePreferences } from "../../app/localePreferences";
import { getTableColumnSettingsStorageKey } from "../../app/preferenceStorage";
import { resolveTableSort } from "../../app/tableSorting";
import type { ResponsiveTableColumnConfig } from "../../app/tableColumnVisibility";
import {
	TableActionButton,
	TableActionMenu,
} from "../../app/TableActionButton";
import { useTableActions } from "../../app/tableActions";
import {
	useQueryFilterLayout,
	useQuerySubmission,
} from "../../app/queryFilterLayout";
import {
	defaultLogPageSize,
	LogDetailsDrawer,
	LogQueryPanel,
	LogTablePanel,
} from "./LogTablePanel";
import {
	auditLogsQueryKey,
	listPlatformAuditLogs,
	type AuditLogFilters,
	type PlatformAuditLog,
} from "#src/api/operations";

const { Text } = Typography;
type AuditLogSort = "action" | "created_at" | "result";
type SortOrder = "asc" | "desc";
const auditTableSortToContractSort: Record<string, AuditLogSort> = {
	action: "action",
	created_at: "created_at",
	result: "result",
};
const auditLogColumnVisibility: readonly ResponsiveTableColumnConfig<string>[] =
	[
		{ key: "actorUsername", priority: "compact", required: true },
		{ key: "action", priority: "compact" },
		{ key: "target", priority: "regular" },
		{ key: "result", priority: "compact" },
		{ key: "requestIp", priority: "regular" },
		{ key: "created_at", priority: "compact" },
		{ key: "actions", priority: "compact", required: true },
	];

interface AuditFilterFormValues {
	action?: string;
	dateRange?: [Dayjs, Dayjs];
	result: "all" | NonNullable<AuditLogFilters["result"]>;
}

function formatTarget(log: PlatformAuditLog) {
	return log.targetId ? `${log.targetType}:${log.targetId}` : log.targetType;
}

export function AuditLogPage() {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const { copyTableValue, messageContextHolder } = useTableActions();
	const [form] = Form.useForm<AuditFilterFormValues>();
	const [filters, setFilters] = useState<AuditLogFilters>({});
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(defaultLogPageSize);
	const [sort, setSort] = useState<AuditLogSort | undefined>("created_at");
	const [order, setOrder] = useState<SortOrder | undefined>("desc");
	const [selectedLog, setSelectedLog] = useState<PlatformAuditLog | null>(null);
	const [filtersExpanded, setFiltersExpanded] = useState(false);
	const querySubmission = useQuerySubmission();
	const {
		canExpand: canExpandFilters,
		collapsedFieldCount,
		columnSpan,
		containerRef: queryFilterContainerRef,
		formLayout: queryFilterLayout,
		submitterOffset,
	} = useQueryFilterLayout({ expanded: filtersExpanded, fieldCount: 3 });
	const showResultFilter = filtersExpanded || collapsedFieldCount >= 2;
	const showDateRangeFilter = filtersExpanded || collapsedFieldCount >= 3;
	const formatPreferences = useLocalePreferences();
	const query = useQuery({
		placeholderData: keepPreviousData,
		queryKey: [
			auditLogsQueryKey,
			filters,
			order,
			page,
			pageSize,
			sort,
			querySubmission.revision,
		],
		queryFn: ({ signal }) =>
			listPlatformAuditLogs(
				{
					...filters,
					page,
					pageSize,
					...(order && sort ? { order, sort } : {}),
				},
				signal,
			),
	});
	const sortOrder = (column: AuditLogSort) =>
		sort === column && order ? (order === "asc" ? "ascend" : "descend") : null;
	const columns: TableColumnsType<PlatformAuditLog> = [
		{
			dataIndex: "actorUsername",
			key: "actorUsername",
			title: t("adminShell.logs.audit.columns.actor"),
			width: token.controlHeight * 4,
		},
		{
			dataIndex: "action",
			key: "action",
			render: (value: string) => <Text code>{value}</Text>,
			sortDirections: ["ascend", "descend"],
			sorter: true,
			sortOrder: sortOrder("action"),
			title: t("adminShell.logs.audit.columns.action"),
			width: token.controlHeight * 4,
		},
		{
			key: "target",
			render: (_, row) => <Text code>{formatTarget(row)}</Text>,
			title: t("adminShell.logs.audit.columns.target"),
			width: token.controlHeight * 7,
		},
		{
			dataIndex: "result",
			key: "result",
			render: (value: PlatformAuditLog["result"]) => (
				<Badge
					status={value === "success" ? "success" : "error"}
					text={t(`adminShell.logs.common.results.${value}`)}
				/>
			),
			sortDirections: ["ascend", "descend"],
			sorter: true,
			sortOrder: sortOrder("result"),
			title: t("adminShell.logs.audit.columns.result"),
			width: token.controlHeight * 3,
		},
		{
			dataIndex: "requestIp",
			key: "requestIp",
			title: t("adminShell.logs.audit.columns.ipAddress"),
			width: token.controlHeight * 4,
		},
		{
			dataIndex: "createdAt",
			key: "created_at",
			render: (value: string) => formatDateTime(value, formatPreferences),
			sortDirections: ["ascend", "descend"],
			sorter: true,
			sortOrder: sortOrder("created_at"),
			title: t("adminShell.logs.audit.columns.occurredAt"),
			width: token.controlHeight * 5,
		},
		{
			key: "actions",
			render: (_, row) => (
				<Space size="medium">
					<TableActionButton
						aria-label={t("adminShell.logs.common.viewRecord", { id: row.id })}
						onClick={() => setSelectedLog(row)}
					>
						{t("adminShell.logs.common.view")}
					</TableActionButton>
					<TableActionMenu
						items={[
							{
								key: "copyId",
								label: t("adminShell.tableActions.copyRecordId"),
								onClick: () => void copyTableValue(row.id),
							},
							{
								key: "copyTarget",
								label: t("adminShell.tableActions.copyTarget"),
								onClick: () => void copyTableValue(formatTarget(row)),
							},
						]}
						label={t("adminShell.tableActions.more")}
					/>
				</Space>
			),
			title: t("adminShell.logs.audit.columns.actions"),
			width: token.controlHeight * 4,
		},
	];

	const applyFilters = (values: AuditFilterFormValues) => {
		setFilters({
			...(values.action?.trim() ? { action: values.action.trim() } : {}),
			...(values.dateRange
				? {
						from: values.dateRange[0].toISOString(),
						to: values.dateRange[1].toISOString(),
					}
				: {}),
			...(values.result !== "all" ? { result: values.result } : {}),
		});
		setPage(1);
		querySubmission.submit();
	};

	const resetFilters = () => {
		form.resetFields();
		setFilters({});
		setPage(1);
		querySubmission.submit();
	};

	const handleTableChange: NonNullable<
		TableProps<PlatformAuditLog>["onChange"]
	> = (_, __, sorter, extra) => {
		if (extra.action !== "sort") {
			return;
		}

		const currentSorter = Array.isArray(sorter) ? sorter[0] : sorter;
		const nextSorting = resolveTableSort(
			currentSorter?.columnKey,
			currentSorter?.order,
			auditTableSortToContractSort,
		);

		setSort(nextSorting.sort);
		setOrder(nextSorting.order);
		setPage(1);
	};

	return (
		<Flex gap={token.marginLG} vertical>
			{messageContextHolder}
			<LogTablePanel<PlatformAuditLog>
				columnSettingsStorageKey={getTableColumnSettingsStorageKey(
					"audit-logs",
				)}
				columnVisibility={auditLogColumnVisibility}
				columns={columns}
				dataSource={query.data?.items ?? []}
				emptyText={t("adminShell.logs.audit.empty")}
				error={query.error}
				initialLoading={query.isPending}
				minimumWidth={token.controlHeight * 29}
				onPageChange={(nextPage, nextPageSize) => {
					setPage(nextPageSize === pageSize ? nextPage : 1);
					setPageSize(nextPageSize);
				}}
				onReload={() => void query.refetch()}
				onTableChange={handleTableChange}
				page={page}
				pageSize={pageSize}
				queryPanel={
					<LogQueryPanel<AuditFilterFormValues>
						actionsTestId="audit-log-query-actions"
						canExpand={canExpandFilters}
						columnSpan={columnSpan}
						containerRef={queryFilterContainerRef}
						expanded={filtersExpanded}
						form={form}
						formLayout={queryFilterLayout}
						initialValues={{ result: "all" }}
						loading={query.isFetching && !query.isPending}
						onFinish={applyFilters}
						onReset={resetFilters}
						onToggle={() => setFiltersExpanded((expanded) => !expanded)}
						submitterOffset={submitterOffset}
						testId="audit-log-query-form"
					>
						<Col span={columnSpan}>
							<Form.Item
								label={t("adminShell.logs.audit.filters.action")}
								name="action"
								style={{ marginBottom: 0 }}
							>
								<Input
									allowClear
									maxLength={128}
									placeholder={t("adminShell.logs.audit.placeholders.action")}
								/>
							</Form.Item>
						</Col>
						{showResultFilter ? (
							<Col span={columnSpan}>
								<Form.Item
									label={t("adminShell.logs.audit.filters.result")}
									name="result"
									style={{ marginBottom: 0 }}
								>
									<Select
										options={[
											{
												label: t("adminShell.logs.common.allResults"),
												value: "all",
											},
											{
												label: t("adminShell.logs.common.results.success"),
												value: "success",
											},
											{
												label: t("adminShell.logs.common.results.failure"),
												value: "failure",
											},
										]}
									/>
								</Form.Item>
							</Col>
						) : null}
						{showDateRangeFilter ? (
							<Col span={columnSpan}>
								<Form.Item
									label={t("adminShell.logs.common.timeRange")}
									name="dateRange"
									style={{ marginBottom: 0 }}
								>
									<DatePicker.RangePicker
										format="YYYY-MM-DD HH:mm"
										placeholder={[
											t("adminShell.logs.common.timeRangeStart"),
											t("adminShell.logs.common.timeRangeEnd"),
										]}
										showTime
										style={{ width: "100%" }}
									/>
								</Form.Item>
							</Col>
						) : null}
					</LogQueryPanel>
				}
				refreshing={query.isFetching && !query.isPending}
				testId="audit-log-table-card"
				title={t("adminShell.logs.audit.tableTitle")}
				total={query.data?.total ?? 0}
				workspaceTestId="audit-log-table-workspace"
			/>

			<LogDetailsDrawer
				items={
					selectedLog
						? [
								{
									key: "id",
									label: t("adminShell.logs.common.recordId"),
									children: selectedLog.id,
								},
								{
									key: "actor",
									label: t("adminShell.logs.audit.columns.actor"),
									children: selectedLog.actorUsername,
								},
								{
									key: "action",
									label: t("adminShell.logs.audit.columns.action"),
									children: selectedLog.action,
								},
								{
									key: "target",
									label: t("adminShell.logs.audit.columns.target"),
									children: formatTarget(selectedLog),
								},
								{
									key: "result",
									label: t("adminShell.logs.audit.columns.result"),
									children: t(
										`adminShell.logs.common.results.${selectedLog.result}`,
									),
								},
								{
									key: "ipAddress",
									label: t("adminShell.logs.audit.columns.ipAddress"),
									children: selectedLog.requestIp,
								},
								{
									key: "occurredAt",
									label: t("adminShell.logs.audit.columns.occurredAt"),
									children: formatDateTime(
										selectedLog.createdAt,
										formatPreferences,
									),
								},
							]
						: undefined
				}
				onClose={() => setSelectedLog(null)}
				open={selectedLog !== null}
				title={t("adminShell.logs.audit.detailsTitle")}
			/>
		</Flex>
	);
}
