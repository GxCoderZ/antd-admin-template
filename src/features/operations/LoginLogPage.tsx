import type { ProColumns, ProFormInstance } from "@ant-design/pro-components";
import { useRef } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
	Badge,
	DatePicker,
	Flex,
	Select,
	Space,
	theme,
	Typography,
} from "antd";
import type { TableProps } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import {
	formatDeviceInfo,
	getDeviceDetails,
	getPrimaryLanguage,
} from "../../app/deviceInfo";
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
import {
	listPlatformLoginLogs,
	loginLogsQueryKey,
	type LoginLogFilters,
	type PlatformLoginLog,
} from "#src/api/operations";

const { Text } = Typography;
type LoginLogSort = "created_at" | "identifier" | "result";
type SortOrder = "asc" | "desc";
const loginLogsRouteKey = "/operations/login-logs";
const loginTableSortToContractSort: Record<string, LoginLogSort> = {
	created_at: "created_at",
	identifier: "identifier",
	result: "result",
};
const loginLogColumnVisibility: readonly TableColumnConfig<string>[] = [
	{ key: "identifier", visibility: "required" },
	{ key: "result", visibility: "recommended" },
	{ key: "userAgent", visibility: "recommended" },
	{ key: "requestIp", visibility: "recommended" },
	{ key: "acceptLanguage", visibility: "optional" },
	{ key: "timeZone", visibility: "optional" },
	{ key: "created_at", visibility: "recommended" },
	{ key: "actions", visibility: "required" },
	{ key: "id", visibility: "optional" },
	{ key: "userId", visibility: "optional" },
	{ key: "requestId", visibility: "optional" },
	{ key: "authMethod", visibility: "optional" },
	{ key: "mfaUsed", visibility: "optional" },
	{ key: "location", visibility: "optional" },
	{ key: "browser", visibility: "optional" },
	{ key: "operatingSystem", visibility: "optional" },
	{ key: "durationMs", visibility: "optional" },
	{ key: "failureReason", visibility: "optional" },
	{ key: "sessionId", visibility: "optional" },
	{ key: "rawAcceptLanguage", visibility: "optional" },
	{ key: "rawUserAgent", visibility: "optional" },
];

const loginResultStatus = {
	invalid: "error",
	limited: "warning",
	success: "success",
} as const;

interface LoginFilterFormValues {
	dateRange?: [Dayjs | null, Dayjs | null] | null;
	result: "all" | NonNullable<LoginLogFilters["result"]>;
}

interface LoginFilterDraft {
	dateRange?: [string, string];
	result: LoginFilterFormValues["result"];
}

const defaultLoginFilterDraft: LoginFilterDraft = { result: "all" };

function deserializeLoginFilterDraft(
	draft: LoginFilterDraft,
): LoginFilterFormValues {
	return {
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

function serializeLoginFilterDraft(
	values: LoginFilterFormValues,
): LoginFilterDraft {
	const [rangeStart, rangeEnd] = values.dateRange ?? [];
	return {
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

export function LoginLogPage() {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const { copyTableValue, messageContextHolder } = useTableActions();
	const form = useRef<ProFormInstance<LoginFilterFormValues>>(undefined);
	const [filterDraft, setFilterDraft] = useRouteSessionState<LoginFilterDraft>({
		initialState: defaultLoginFilterDraft,
		routeKey: loginLogsRouteKey,
		stateKey: "query-draft",
	});
	const [filters, setFilters] = useRouteSessionState<LoginLogFilters>({
		initialState: {},
		routeKey: loginLogsRouteKey,
		stateKey: "query-applied",
	});
	const [page, setPage] = useRouteSessionState({
		initialState: 1,
		routeKey: loginLogsRouteKey,
		stateKey: "page",
	});
	const [pageSize, setPageSize] = useRouteSessionState({
		initialState: defaultLogPageSize,
		routeKey: loginLogsRouteKey,
		stateKey: "page-size",
	});
	const [sort, setSort] = useRouteSessionState<LoginLogSort | undefined>({
		initialState: undefined,
		routeKey: loginLogsRouteKey,
		stateKey: "sort",
		version: tableSortStateVersion,
	});
	const [order, setOrder] = useRouteSessionState<SortOrder | undefined>({
		initialState: undefined,
		routeKey: loginLogsRouteKey,
		stateKey: "order",
		version: tableSortStateVersion,
	});
	const [selectedLog, setSelectedLog] = useState<PlatformLoginLog | null>(null);
	const [filtersExpanded, setFiltersExpanded] = useRouteSessionState({
		initialState: false,
		routeKey: loginLogsRouteKey,
		stateKey: "query-expanded",
	});
	const querySubmission = useQuerySubmission();
	const formatPreferences = useLocalePreferences();
	const query = useQuery({
		placeholderData: keepPreviousData,
		queryKey: [
			loginLogsQueryKey,
			filters,
			order,
			page,
			pageSize,
			sort,
			querySubmission.revision,
		],
		queryFn: ({ signal }) =>
			listPlatformLoginLogs(
				{
					...filters,
					page,
					pageSize,
					...(order && sort ? { order, sort } : {}),
				},
				signal,
			),
	});
	const sortOrder = (column: LoginLogSort) =>
		sort === column && order ? (order === "asc" ? "ascend" : "descend") : null;
	const missingDeviceValue = t("adminShell.deviceInfo.notRecorded");
	const unknownDevice = t("adminShell.deviceInfo.unknownDevice");
	const renderCodeValue = (value: string | undefined) => {
		const displayValue = value?.trim() || missingDeviceValue;
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
	const columns: ProColumns<PlatformLoginLog>[] = [
		{
			dataIndex: "identifier",
			key: "identifier",
			sortDirections: ["ascend", "descend"],
			sorter: true,
			sortOrder: sortOrder("identifier"),
			title: t("adminShell.logs.login.columns.identifier"),
			width: token.controlHeight * 5,
		},
		{
			dataIndex: "result",
			key: "result",
			renderText: (value: PlatformLoginLog["result"]) => (
				<Badge
					status={loginResultStatus[value]}
					text={t(`adminShell.logs.common.results.${value}`)}
				/>
			),
			sortDirections: ["ascend", "descend"],
			sorter: true,
			sortOrder: sortOrder("result"),
			title: t("adminShell.logs.login.columns.result"),
			width: token.controlHeight * 3,
		},
		{
			dataIndex: "userAgent",
			key: "userAgent",
			renderText: (value: string | undefined) =>
				formatDeviceInfo(value, unknownDevice),
			title: t("adminShell.deviceInfo.device"),
			width: token.controlHeight * 7,
		},
		{
			dataIndex: "requestIp",
			key: "requestIp",
			title: t("adminShell.logs.login.columns.ipAddress"),
			width: token.controlHeight * 4,
		},
		{
			dataIndex: "acceptLanguage",
			key: "acceptLanguage",
			renderText: (value: string | undefined) =>
				getPrimaryLanguage(value) ?? missingDeviceValue,
			title: t("adminShell.deviceInfo.language"),
			width: token.controlHeight * 3,
		},
		{
			dataIndex: "timeZone",
			key: "timeZone",
			renderText: (value: string | undefined) =>
				value?.trim() || missingDeviceValue,
			title: t("adminShell.deviceInfo.timeZone"),
			width: token.controlHeight * 5,
		},
		{
			dataIndex: "createdAt",
			key: "created_at",
			renderText: (value: string) => formatDateTime(value, formatPreferences),
			sortDirections: ["ascend", "descend"],
			sorter: true,
			sortOrder: sortOrder("created_at"),
			title: t("adminShell.logs.login.columns.occurredAt"),
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
								key: "copyIp",
								label: t("adminShell.tableActions.copyIpAddress"),
								onClick: () => void copyTableValue(row.requestIp),
							},
						]}
						label={t("adminShell.tableActions.more")}
					/>
				</Space>
			),
			title: t("adminShell.logs.login.columns.actions"),
			width: token.controlHeight * 4,
		},
		{
			dataIndex: "id",
			key: "id",
			renderText: renderCodeValue,
			title: t("adminShell.logs.common.recordId"),
			width: token.controlHeight * 4,
		},
		{
			dataIndex: "userId",
			key: "userId",
			renderText: renderCodeValue,
			title: t("adminShell.logs.login.columns.userId"),
			width: token.controlHeight * 5,
		},
		{
			dataIndex: "requestId",
			key: "requestId",
			renderText: renderCodeValue,
			title: t("adminShell.logs.common.requestId"),
			width: token.controlHeight * 5,
		},
		{
			dataIndex: "authMethod",
			key: "authMethod",
			renderText: (value: PlatformLoginLog["authMethod"]) =>
				t(`adminShell.logs.login.authMethods.${value}`),
			title: t("adminShell.logs.login.columns.authMethod"),
			width: token.controlHeight * 4,
		},
		{
			dataIndex: "mfaUsed",
			key: "mfaUsed",
			renderText: (value: boolean) =>
				t(`adminShell.logs.common.${value ? "yes" : "no"}`),
			title: t("adminShell.logs.login.columns.mfaUsed"),
			width: token.controlHeight * 4,
		},
		{
			dataIndex: "location",
			key: "location",
			renderText: (value: string | undefined) => value ?? missingDeviceValue,
			title: t("adminShell.logs.login.columns.location"),
			width: token.controlHeight * 4,
		},
		{
			dataIndex: "userAgent",
			key: "browser",
			renderText: (value: string | undefined) =>
				getDeviceDetails(value).browser ?? missingDeviceValue,
			title: t("adminShell.logs.common.browser"),
			width: token.controlHeight * 4,
		},
		{
			dataIndex: "userAgent",
			key: "operatingSystem",
			renderText: (value: string | undefined) =>
				getDeviceDetails(value).operatingSystem ?? missingDeviceValue,
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
			dataIndex: "failureReason",
			key: "failureReason",
			renderText: renderCodeValue,
			title: t("adminShell.logs.common.failureReason"),
			width: token.controlHeight * 5,
		},
		{
			dataIndex: "sessionId",
			key: "sessionId",
			renderText: renderCodeValue,
			title: t("adminShell.logs.login.columns.sessionId"),
			width: token.controlHeight * 5,
		},
		{
			dataIndex: "acceptLanguage",
			key: "rawAcceptLanguage",
			renderText: renderCodeValue,
			title: t("adminShell.logs.common.acceptLanguage"),
			width: token.controlHeight * 5,
		},
		{
			dataIndex: "userAgent",
			key: "rawUserAgent",
			renderText: renderCodeValue,
			title: t("adminShell.logs.common.userAgent"),
			width: token.controlHeight * 10,
		},
	];

	const applyFilters = (values: LoginFilterFormValues) => {
		const [rangeStart, rangeEnd] = values.dateRange ?? [];
		setFilterDraft(serializeLoginFilterDraft(values));
		setFilters({
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
		form.current?.resetFields();
		form.current?.setFieldsValue({ dateRange: null, result: "all" });
		setFilterDraft(defaultLoginFilterDraft);
		setFilters({});
		setPage(1);
		setSort(undefined);
		setOrder(undefined);
		querySubmission.submit();
	};

	const handleTableChange: NonNullable<
		TableProps<PlatformLoginLog>["onChange"]
	> = (_, __, sorter, extra) => {
		if (extra.action !== "sort") {
			return;
		}

		const currentSorter = Array.isArray(sorter) ? sorter[0] : sorter;
		const nextSorting = resolveTableSort(
			currentSorter?.columnKey,
			currentSorter?.order,
			loginTableSortToContractSort,
		);

		setSort(nextSorting.sort);
		setOrder(nextSorting.order);
		setPage(1);
	};

	return (
		<Flex gap={token.marginLG} vertical>
			{messageContextHolder}
			<LogTablePanel<PlatformLoginLog, LoginFilterFormValues>
				columnSettingsStorageKey={getTableColumnSettingsStorageKey(
					"login-logs",
				)}
				columnVisibility={loginLogColumnVisibility}
				columns={columns}
				dataSource={query.data?.items ?? []}
				emptyText={t("adminShell.logs.login.empty")}
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
					initialValues: deserializeLoginFilterDraft(filterDraft),
					loading: query.isFetching && !query.isPending,
					onFinish: applyFilters,
					onReset: resetFilters,
					onExpandedChange: setFiltersExpanded,
					onValuesChange: (values) =>
						setFilterDraft(serializeLoginFilterDraft(values)),
					testId: "login-log-query-form",
					columns: [
						{
							dataIndex: "result",
							title: t("adminShell.logs.login.filters.result"),
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
											label: t("adminShell.logs.common.results.invalid"),
											value: "invalid",
										},
										{
											label: t("adminShell.logs.common.results.limited"),
											value: "limited",
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
				testId="login-log-table-card"
				title={t("adminShell.logs.login.tableTitle")}
				total={query.data?.total ?? 0}
				workspaceTestId="login-log-table-workspace"
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
									key: "userId",
									label: t("adminShell.logs.login.columns.userId"),
									children: selectedLog.userId ?? missingDeviceValue,
								},
								{
									key: "identifier",
									label: t("adminShell.logs.login.columns.identifier"),
									children: selectedLog.identifier,
								},
								{
									key: "authMethod",
									label: t("adminShell.logs.login.columns.authMethod"),
									children: t(
										`adminShell.logs.login.authMethods.${selectedLog.authMethod}`,
									),
								},
								{
									key: "mfaUsed",
									label: t("adminShell.logs.login.columns.mfaUsed"),
									children: t(
										`adminShell.logs.common.${selectedLog.mfaUsed ? "yes" : "no"}`,
									),
								},
								{
									key: "result",
									label: t("adminShell.logs.login.columns.result"),
									children: t(
										`adminShell.logs.common.results.${selectedLog.result}`,
									),
								},
								{
									key: "ipAddress",
									label: t("adminShell.logs.login.columns.ipAddress"),
									children: selectedLog.requestIp,
								},
								{
									key: "location",
									label: t("adminShell.logs.login.columns.location"),
									children: selectedLog.location ?? missingDeviceValue,
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
										missingDeviceValue,
								},
								{
									key: "operatingSystem",
									label: t("adminShell.logs.common.operatingSystem"),
									children:
										getDeviceDetails(selectedLog.userAgent).operatingSystem ??
										missingDeviceValue,
								},
								{
									key: "language",
									label: t("adminShell.deviceInfo.language"),
									children:
										getPrimaryLanguage(selectedLog.acceptLanguage) ??
										missingDeviceValue,
								},
								{
									key: "acceptLanguage",
									label: t("adminShell.logs.common.acceptLanguage"),
									children: selectedLog.acceptLanguage ?? missingDeviceValue,
								},
								{
									key: "timeZone",
									label: t("adminShell.deviceInfo.timeZone"),
									children: selectedLog.timeZone?.trim() || missingDeviceValue,
								},
								{
									key: "durationMs",
									label: t("adminShell.logs.common.duration"),
									children: `${selectedLog.durationMs} ms`,
								},
								{
									key: "failureReason",
									label: t("adminShell.logs.common.failureReason"),
									children: selectedLog.failureReason ?? missingDeviceValue,
								},
								{
									key: "sessionId",
									label: t("adminShell.logs.login.columns.sessionId"),
									children: selectedLog.sessionId ?? missingDeviceValue,
								},
								{
									key: "userAgent",
									label: t("adminShell.logs.common.userAgent"),
									children: selectedLog.userAgent ?? missingDeviceValue,
								},
								{
									key: "occurredAt",
									label: t("adminShell.logs.login.columns.occurredAt"),
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
				title={t("adminShell.logs.login.detailsTitle")}
			/>
		</Flex>
	);
}
