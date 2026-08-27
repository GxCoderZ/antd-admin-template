import { ProForm } from "@ant-design/pro-components";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
	Badge,
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
import dayjs, { type Dayjs } from "dayjs";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { formatDeviceInfo, getDeviceDetails } from "../../app/deviceInfo";
import { formatDateTime } from "../../app/formatting";
import { useLocalePreferences } from "../../app/localePreferences";
import { getTableColumnSettingsStorageKey } from "../../app/preferenceStorage";
import { resolveTableSort } from "../../app/tableSorting";
import type { TableColumnConfig } from "../../app/tableColumnVisibility";
import {
	TableActionButton,
	TableActionMenu,
} from "../../app/TableActionButton";
import { useTableActions } from "../../app/tableActions";
import { useQuerySubmission } from "../../app/queryFilterLayout";
import { useRouteSessionState } from "../../app/routeSessionState";
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
const auditLogsRouteKey = "/operations/audit-logs";
const auditTableSortToContractSort: Record<string, AuditLogSort> = {
	action: "action",
	created_at: "created_at",
	result: "result",
};
const auditLogColumnVisibility: readonly TableColumnConfig<string>[] = [
	{ key: "actorUsername", visibility: "required" },
	{ key: "action", visibility: "recommended" },
	{ key: "target", visibility: "recommended" },
	{ key: "result", visibility: "recommended" },
	{ key: "requestIp", visibility: "recommended" },
	{ key: "created_at", visibility: "recommended" },
	{ key: "actions", visibility: "required" },
	{ key: "id", visibility: "optional" },
	{ key: "actorId", visibility: "optional" },
	{ key: "module", visibility: "optional" },
	{ key: "targetType", visibility: "optional" },
	{ key: "targetId", visibility: "optional" },
	{ key: "requestId", visibility: "optional" },
	{ key: "requestMethod", visibility: "optional" },
	{ key: "requestPath", visibility: "optional" },
	{ key: "device", visibility: "optional" },
	{ key: "browser", visibility: "optional" },
	{ key: "operatingSystem", visibility: "optional" },
	{ key: "durationMs", visibility: "optional" },
	{ key: "failureReason", visibility: "optional" },
	{ key: "before", visibility: "optional" },
	{ key: "after", visibility: "optional" },
	{ key: "userAgent", visibility: "optional" },
];

interface AuditFilterFormValues {
	action?: string;
	dateRange?: [Dayjs | null, Dayjs | null] | null;
	result: "all" | NonNullable<AuditLogFilters["result"]>;
}

interface AuditFilterDraft {
	action?: string;
	dateRange?: [string, string];
	result: AuditFilterFormValues["result"];
}

const defaultAuditFilterDraft: AuditFilterDraft = { result: "all" };

function deserializeAuditFilterDraft(
	draft: AuditFilterDraft,
): AuditFilterFormValues {
	return {
		...(draft.action !== undefined ? { action: draft.action } : {}),
		...(draft.dateRange
			? {
					dateRange: [dayjs(draft.dateRange[0]), dayjs(draft.dateRange[1])] as [
						Dayjs,
						Dayjs,
					],
				}
			: {}),
		result: draft.result,
	};
}

function serializeAuditFilterDraft(
	values: AuditFilterFormValues,
): AuditFilterDraft {
	const [rangeStart, rangeEnd] = values.dateRange ?? [];
	return {
		...(values.action !== undefined ? { action: values.action } : {}),
		...(rangeStart && rangeEnd
			? {
					dateRange: [rangeStart.toISOString(), rangeEnd.toISOString()] as [
						string,
						string,
					],
				}
			: {}),
		result: values.result,
	};
}

function formatTarget(log: PlatformAuditLog) {
	return log.targetId ? `${log.targetType}:${log.targetId}` : log.targetType;
}

function formatAuditRecordValue(
	value: Record<string, unknown> | undefined,
	emptyText: string,
) {
	return value && Object.keys(value).length > 0 ? (
		<Text code style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
			{JSON.stringify(value, null, 2)}
		</Text>
	) : (
		<Text type="secondary">{emptyText}</Text>
	);
}

export function AuditLogPage() {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const { copyTableValue, messageContextHolder } = useTableActions();
	const [form] = Form.useForm<AuditFilterFormValues>();
	const [filterDraft, setFilterDraft] = useRouteSessionState<AuditFilterDraft>({
		initialState: defaultAuditFilterDraft,
		routeKey: auditLogsRouteKey,
		stateKey: "query-draft",
	});
	const [filters, setFilters] = useRouteSessionState<AuditLogFilters>({
		initialState: {},
		routeKey: auditLogsRouteKey,
		stateKey: "query-applied",
	});
	const [page, setPage] = useRouteSessionState({
		initialState: 1,
		routeKey: auditLogsRouteKey,
		stateKey: "page",
	});
	const [pageSize, setPageSize] = useRouteSessionState({
		initialState: defaultLogPageSize,
		routeKey: auditLogsRouteKey,
		stateKey: "page-size",
	});
	const [sort, setSort] = useRouteSessionState<AuditLogSort | undefined>({
		initialState: "created_at",
		routeKey: auditLogsRouteKey,
		stateKey: "sort",
	});
	const [order, setOrder] = useRouteSessionState<SortOrder | undefined>({
		initialState: "desc",
		routeKey: auditLogsRouteKey,
		stateKey: "order",
	});
	const [selectedLog, setSelectedLog] = useState<PlatformAuditLog | null>(null);
	const [filtersExpanded, setFiltersExpanded] = useRouteSessionState({
		initialState: false,
		routeKey: auditLogsRouteKey,
		stateKey: "query-expanded",
	});
	const querySubmission = useQuerySubmission();
	const formatPreferences = useLocalePreferences();
	const notRecorded = t("adminShell.deviceInfo.notRecorded");
	const unknownDevice = t("adminShell.deviceInfo.unknownDevice");
	const renderCodeValue = (value: string | undefined) => {
		const displayValue = value?.trim() || notRecorded;
		return (
			<Text
				code
				ellipsis={{ tooltip: displayValue }}
				style={{ maxWidth: "100%" }}
			>
				{displayValue}
			</Text>
		);
	};
	const formatChange = (value: Record<string, unknown> | undefined) =>
		value ? JSON.stringify(value) : notRecorded;
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
		{
			dataIndex: "id",
			key: "id",
			render: renderCodeValue,
			title: t("adminShell.logs.common.recordId"),
			width: token.controlHeight * 4,
		},
		{
			dataIndex: "actorId",
			key: "actorId",
			render: renderCodeValue,
			title: t("adminShell.logs.audit.columns.actorId"),
			width: token.controlHeight * 5,
		},
		{
			dataIndex: "module",
			key: "module",
			render: renderCodeValue,
			title: t("adminShell.logs.audit.columns.module"),
			width: token.controlHeight * 3,
		},
		{
			dataIndex: "targetType",
			key: "targetType",
			render: renderCodeValue,
			title: t("adminShell.logs.audit.columns.targetType"),
			width: token.controlHeight * 4,
		},
		{
			dataIndex: "targetId",
			key: "targetId",
			render: renderCodeValue,
			title: t("adminShell.logs.audit.columns.targetId"),
			width: token.controlHeight * 5,
		},
		{
			dataIndex: "requestId",
			key: "requestId",
			render: renderCodeValue,
			title: t("adminShell.logs.common.requestId"),
			width: token.controlHeight * 5,
		},
		{
			dataIndex: "requestMethod",
			key: "requestMethod",
			render: renderCodeValue,
			title: t("adminShell.logs.audit.columns.requestMethod"),
			width: token.controlHeight * 3,
		},
		{
			dataIndex: "requestPath",
			key: "requestPath",
			render: renderCodeValue,
			title: t("adminShell.logs.audit.columns.requestPath"),
			width: token.controlHeight * 7,
		},
		{
			dataIndex: "userAgent",
			key: "device",
			render: (value: string | undefined) =>
				formatDeviceInfo(value, unknownDevice),
			title: t("adminShell.deviceInfo.device"),
			width: token.controlHeight * 7,
		},
		{
			dataIndex: "userAgent",
			key: "browser",
			render: (value: string | undefined) =>
				getDeviceDetails(value).browser ?? notRecorded,
			title: t("adminShell.logs.common.browser"),
			width: token.controlHeight * 4,
		},
		{
			dataIndex: "userAgent",
			key: "operatingSystem",
			render: (value: string | undefined) =>
				getDeviceDetails(value).operatingSystem ?? notRecorded,
			title: t("adminShell.logs.common.operatingSystem"),
			width: token.controlHeight * 4,
		},
		{
			dataIndex: "durationMs",
			key: "durationMs",
			render: (value: number) => `${value} ms`,
			title: t("adminShell.logs.common.duration"),
			width: token.controlHeight * 3,
		},
		{
			dataIndex: "failureReason",
			key: "failureReason",
			render: renderCodeValue,
			title: t("adminShell.logs.common.failureReason"),
			width: token.controlHeight * 5,
		},
		{
			dataIndex: "before",
			key: "before",
			render: (value: Record<string, unknown> | undefined) =>
				renderCodeValue(formatChange(value)),
			title: t("adminShell.logs.audit.columns.before"),
			width: token.controlHeight * 6,
		},
		{
			dataIndex: "after",
			key: "after",
			render: (value: Record<string, unknown> | undefined) =>
				renderCodeValue(formatChange(value)),
			title: t("adminShell.logs.audit.columns.after"),
			width: token.controlHeight * 6,
		},
		{
			dataIndex: "userAgent",
			key: "userAgent",
			render: renderCodeValue,
			title: t("adminShell.logs.common.userAgent"),
			width: token.controlHeight * 10,
		},
	];

	const applyFilters = (values: AuditFilterFormValues) => {
		const [rangeStart, rangeEnd] = values.dateRange ?? [];
		setFilterDraft(serializeAuditFilterDraft(values));
		setFilters({
			...(values.action?.trim() ? { action: values.action.trim() } : {}),
			...(rangeStart && rangeEnd
				? {
						from: rangeStart.toISOString(),
						to: rangeEnd.toISOString(),
					}
				: {}),
			...(values.result !== "all" ? { result: values.result } : {}),
		});
		setPage(1);
		querySubmission.submit();
	};

	const resetFilters = () => {
		form.resetFields();
		form.setFieldsValue({ action: "", dateRange: null, result: "all" });
		setFilterDraft(defaultAuditFilterDraft);
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
						expanded={filtersExpanded}
						form={form}
						initialValues={deserializeAuditFilterDraft(filterDraft)}
						loading={query.isFetching && !query.isPending}
						onFinish={applyFilters}
						onReset={resetFilters}
						onExpandedChange={setFiltersExpanded}
						onValuesChange={(_, values) =>
							setFilterDraft(serializeAuditFilterDraft(values))
						}
						testId="audit-log-query-form"
					>
						<ProForm.Item
							key="action"
							label={t("adminShell.logs.audit.filters.action")}
							name="action"
						>
							<Input
								allowClear
								maxLength={128}
								placeholder={t("adminShell.logs.audit.placeholders.action")}
							/>
						</ProForm.Item>
						<ProForm.Item
							key="result"
							label={t("adminShell.logs.audit.filters.result")}
							name="result"
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
						</ProForm.Item>
						<ProForm.Item
							key="dateRange"
							label={t("adminShell.logs.common.timeRange")}
							name="dateRange"
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
						</ProForm.Item>
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
									key: "requestId",
									label: t("adminShell.logs.common.requestId"),
									children: selectedLog.requestId,
								},
								{
									key: "actor",
									label: t("adminShell.logs.audit.columns.actor"),
									children: selectedLog.actorUsername,
								},
								{
									key: "actorId",
									label: t("adminShell.logs.audit.columns.actorId"),
									children: selectedLog.actorId || (
										<Text type="secondary">{notRecorded}</Text>
									),
								},
								{
									key: "action",
									label: t("adminShell.logs.audit.columns.action"),
									children: selectedLog.action,
								},
								{
									key: "module",
									label: t("adminShell.logs.audit.columns.module"),
									children: selectedLog.module,
								},
								{
									key: "target",
									label: t("adminShell.logs.audit.columns.target"),
									children: formatTarget(selectedLog),
								},
								{
									key: "targetType",
									label: t("adminShell.logs.audit.columns.targetType"),
									children: selectedLog.targetType,
								},
								{
									key: "targetId",
									label: t("adminShell.logs.audit.columns.targetId"),
									children: selectedLog.targetId || (
										<Text type="secondary">{notRecorded}</Text>
									),
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
									key: "requestMethod",
									label: t("adminShell.logs.audit.columns.requestMethod"),
									children: selectedLog.requestMethod,
								},
								{
									key: "requestPath",
									label: t("adminShell.logs.audit.columns.requestPath"),
									children: selectedLog.requestPath,
								},
								{
									key: "failureReason",
									label: t("adminShell.logs.common.failureReason"),
									children: selectedLog.failureReason ?? notRecorded,
								},
								{
									key: "device",
									label: t("adminShell.deviceInfo.device"),
									children: formatDeviceInfo(
										selectedLog.userAgent,
										unknownDevice,
									),
								},
								{
									key: "browser",
									label: t("adminShell.logs.common.browser"),
									children:
										getDeviceDetails(selectedLog.userAgent).browser ??
										notRecorded,
								},
								{
									key: "operatingSystem",
									label: t("adminShell.logs.common.operatingSystem"),
									children:
										getDeviceDetails(selectedLog.userAgent).operatingSystem ??
										notRecorded,
								},
								{
									key: "durationMs",
									label: t("adminShell.logs.common.duration"),
									children: `${selectedLog.durationMs} ms`,
								},
								{
									key: "before",
									label: t("adminShell.logs.audit.columns.before"),
									children: formatAuditRecordValue(
										selectedLog.before,
										notRecorded,
									),
								},
								{
									key: "after",
									label: t("adminShell.logs.audit.columns.after"),
									children: formatAuditRecordValue(
										selectedLog.after,
										notRecorded,
									),
								},
								{
									key: "userAgent",
									label: t("adminShell.logs.common.userAgent"),
									children: selectedLog.userAgent ?? notRecorded,
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
