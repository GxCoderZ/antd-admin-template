import type { ProColumns, ProFormInstance } from "@ant-design/pro-components";
import { useRef } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
	Badge,
	DatePicker,
	Flex,
	Input,
	Select,
	Space,
	theme,
	Typography,
} from "antd";
import type { TableProps } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { formatDeviceInfo, getDeviceDetails } from "../../app/deviceInfo";
import { formatDateTime } from "../../app/formatting";
import { useLocalePreferences } from "../../app/localePreferences";
import { getTableColumnSettingsStorageKey } from "../../app/preferenceStorage";
import {
	resolveTableSort,
	tableSortStateVersion,
} from "../../app/tableSorting";
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
	LogTablePanel,
} from "./LogTablePanel";
import { AuditLogDetails } from "./LogDetailContent";
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
	{ key: "created_at", visibility: "recommended" },
	{ key: "actorUsername", visibility: "required" },
	{ key: "action", visibility: "recommended" },
	{ key: "target", visibility: "recommended" },
	{ key: "result", visibility: "recommended" },
	{ key: "requestIp", visibility: "recommended" },
	{ key: "module", visibility: "optional" },
	{ key: "targetType", visibility: "optional" },
	{ key: "requestMethod", visibility: "optional" },
	{ key: "requestPath", visibility: "optional" },
	{ key: "device", visibility: "optional" },
	{ key: "browser", visibility: "optional" },
	{ key: "operatingSystem", visibility: "optional" },
	{ key: "durationMs", visibility: "optional" },
	{ key: "actions", visibility: "required" },
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

export function AuditLogPage() {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const { copyTableValue, messageContextHolder } = useTableActions();
	const form = useRef<ProFormInstance<AuditFilterFormValues>>(undefined);
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
		initialState: undefined,
		routeKey: auditLogsRouteKey,
		stateKey: "sort",
		version: tableSortStateVersion,
	});
	const [order, setOrder] = useRouteSessionState<SortOrder | undefined>({
		initialState: undefined,
		routeKey: auditLogsRouteKey,
		stateKey: "order",
		version: tableSortStateVersion,
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
	const columns: ProColumns<PlatformAuditLog>[] = [
		{
			dataIndex: "createdAt",
			key: "created_at",
			renderText: (value: string) => formatDateTime(value, formatPreferences),
			sortDirections: ["ascend", "descend"],
			sorter: true,
			sortOrder: sortOrder("created_at"),
			title: t("adminShell.logs.audit.columns.occurredAt"),
			width: token.controlHeight * 5,
		},
		{
			dataIndex: "actorUsername",
			key: "actorUsername",
			title: t("adminShell.logs.audit.columns.actor"),
			width: token.controlHeight * 4,
		},
		{
			dataIndex: "action",
			key: "action",
			renderText: (value: string) => <Text code>{value}</Text>,
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
			renderText: (value: PlatformAuditLog["result"]) => (
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
			dataIndex: "module",
			key: "module",
			renderText: (value: string) => <Text code>{value}</Text>,
			title: t("adminShell.logs.audit.columns.module"),
			width: token.controlHeight * 3,
		},
		{
			dataIndex: "targetType",
			key: "targetType",
			renderText: (value: string) => <Text code>{value}</Text>,
			title: t("adminShell.logs.audit.columns.targetType"),
			width: token.controlHeight * 4,
		},
		{
			dataIndex: "requestMethod",
			key: "requestMethod",
			renderText: (value: string) => <Text code>{value}</Text>,
			title: t("adminShell.logs.audit.columns.requestMethod"),
			width: token.controlHeight * 3,
		},
		{
			dataIndex: "requestPath",
			key: "requestPath",
			renderText: (value: string) => <Text code>{value}</Text>,
			title: t("adminShell.logs.audit.columns.requestPath"),
			width: token.controlHeight * 7,
		},
		{
			dataIndex: "userAgent",
			key: "device",
			renderText: (value: string | undefined) =>
				formatDeviceInfo(value, unknownDevice),
			title: t("adminShell.deviceInfo.device"),
			width: token.controlHeight * 7,
		},
		{
			dataIndex: "userAgent",
			key: "browser",
			renderText: (value: string | undefined) =>
				getDeviceDetails(value).browser ?? notRecorded,
			title: t("adminShell.logs.common.browser"),
			width: token.controlHeight * 4,
		},
		{
			dataIndex: "userAgent",
			key: "operatingSystem",
			renderText: (value: string | undefined) =>
				getDeviceDetails(value).operatingSystem ?? notRecorded,
			title: t("adminShell.logs.common.operatingSystem"),
			width: token.controlHeight * 4,
		},
		{
			dataIndex: "durationMs",
			key: "durationMs",
			renderText: (value: number) => `${value} ms`,
			title: t("adminShell.logs.common.duration"),
			width: token.controlHeight * 3,
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
		querySubmission.reset();
		form.current?.resetFields();
		form.current?.setFieldsValue({
			action: "",
			dateRange: null,
			result: "all",
		});
		setFilterDraft(defaultAuditFilterDraft);
		setFilters({});
		setPage(1);
		setSort(undefined);
		setOrder(undefined);
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
			<LogTablePanel<PlatformAuditLog, AuditFilterFormValues>
				columnSettingsStorageKey={getTableColumnSettingsStorageKey(
					"audit-logs",
				)}
				columnVisibility={auditLogColumnVisibility}
				columns={columns}
				dataSource={query.data?.items ?? []}
				emptyText={t("adminShell.logs.audit.empty")}
				error={query.error}
				initialLoading={query.isPending}
				onPageChange={(nextPage, nextPageSize) => {
					setPage(nextPageSize === pageSize ? nextPage : 1);
					setPageSize(nextPageSize);
				}}
				onReload={() => void query.refetch()}
				onTableChange={handleTableChange}
				page={page}
				pageSize={pageSize}
				query={{
					expanded: filtersExpanded,
					formRef: form,
					initialValues: deserializeAuditFilterDraft(filterDraft),
					loading: query.isFetching && !query.isPending,
					onFinish: applyFilters,
					onReset: resetFilters,
					onExpandedChange: setFiltersExpanded,
					onValuesChange: (values) =>
						setFilterDraft(serializeAuditFilterDraft(values)),
					testId: "audit-log-query-form",
					columns: [
						{
							dataIndex: "action",
							title: t("adminShell.logs.audit.filters.action"),
							formItemRender: () => (
								<Input
									allowClear
									maxLength={128}
									placeholder={t("adminShell.logs.audit.placeholders.action")}
								/>
							),
						},
						{
							dataIndex: "result",
							title: t("adminShell.logs.audit.filters.result"),
							formItemRender: () => (
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
							),
						},
						{
							dataIndex: "dateRange",
							title: t("adminShell.logs.common.timeRange"),
							formItemRender: () => (
								<DatePicker.RangePicker
									format="YYYY-MM-DD HH:mm"
									placeholder={[
										t("adminShell.logs.common.timeRangeStart"),
										t("adminShell.logs.common.timeRangeEnd"),
									]}
									showTime
									style={{ width: "100%" }}
								/>
							),
						},
					],
				}}
				refreshing={query.isFetching && !query.isPending}
				testId="audit-log-table-card"
				title={t("adminShell.logs.audit.tableTitle")}
				total={query.data?.total ?? 0}
				workspaceTestId="audit-log-table-workspace"
			/>

			<LogDetailsDrawer
				onClose={() => setSelectedLog(null)}
				open={selectedLog !== null}
				title={t("adminShell.logs.audit.detailsTitle")}
			>
				{selectedLog ? <AuditLogDetails log={selectedLog} /> : null}
			</LogDetailsDrawer>
		</Flex>
	);
}
