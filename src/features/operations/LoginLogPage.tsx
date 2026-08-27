import { ProForm } from "@ant-design/pro-components";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
	Badge,
	DatePicker,
	Flex,
	Form,
	Select,
	Space,
	theme,
	Typography,
} from "antd";
import type { TableColumnsType, TableProps } from "antd";
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
import { resolveTableSort } from "../../app/tableSorting";
import type { ResponsiveTableColumnConfig } from "../../app/tableColumnVisibility";
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
const loginLogColumnVisibility: readonly ResponsiveTableColumnConfig<string>[] =
	[
		{ key: "identifier", priority: "compact", required: true },
		{ key: "result", priority: "compact" },
		{ key: "userAgent", priority: "regular" },
		{ key: "requestIp", priority: "regular" },
		{ key: "acceptLanguage", priority: "spacious" },
		{ key: "timeZone", priority: "spacious" },
		{ key: "created_at", priority: "compact" },
		{ key: "actions", priority: "compact", required: true },
		{ key: "id", priority: "optional" },
		{ key: "userId", priority: "optional" },
		{ key: "requestId", priority: "optional" },
		{ key: "authMethod", priority: "optional" },
		{ key: "mfaUsed", priority: "optional" },
		{ key: "location", priority: "optional" },
		{ key: "browser", priority: "optional" },
		{ key: "operatingSystem", priority: "optional" },
		{ key: "durationMs", priority: "optional" },
		{ key: "failureReason", priority: "optional" },
		{ key: "sessionId", priority: "optional" },
		{ key: "rawAcceptLanguage", priority: "optional" },
		{ key: "rawUserAgent", priority: "optional" },
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
	const [form] = Form.useForm<LoginFilterFormValues>();
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
		initialState: "created_at",
		routeKey: loginLogsRouteKey,
		stateKey: "sort",
	});
	const [order, setOrder] = useRouteSessionState<SortOrder | undefined>({
		initialState: "desc",
		routeKey: loginLogsRouteKey,
		stateKey: "order",
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
	const columns: TableColumnsType<PlatformLoginLog> = [
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
			render: (value: PlatformLoginLog["result"]) => (
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
			render: (value: string | undefined) =>
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
			render: (value: string | undefined) =>
				getPrimaryLanguage(value) ?? missingDeviceValue,
			title: t("adminShell.deviceInfo.language"),
			width: token.controlHeight * 3,
		},
		{
			dataIndex: "timeZone",
			key: "timeZone",
			render: (value: string | undefined) =>
				value?.trim() || missingDeviceValue,
			title: t("adminShell.deviceInfo.timeZone"),
			width: token.controlHeight * 5,
		},
		{
			dataIndex: "createdAt",
			key: "created_at",
			render: (value: string) => formatDateTime(value, formatPreferences),
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
			render: renderCodeValue,
			title: t("adminShell.logs.common.recordId"),
			width: token.controlHeight * 4,
		},
		{
			dataIndex: "userId",
			key: "userId",
			render: renderCodeValue,
			title: t("adminShell.logs.login.columns.userId"),
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
			dataIndex: "authMethod",
			key: "authMethod",
			render: (value: PlatformLoginLog["authMethod"]) =>
				t(`adminShell.logs.login.authMethods.${value}`),
			title: t("adminShell.logs.login.columns.authMethod"),
			width: token.controlHeight * 4,
		},
		{
			dataIndex: "mfaUsed",
			key: "mfaUsed",
			render: (value: boolean) =>
				t(`adminShell.logs.common.${value ? "yes" : "no"}`),
			title: t("adminShell.logs.login.columns.mfaUsed"),
			width: token.controlHeight * 4,
		},
		{
			dataIndex: "location",
			key: "location",
			render: (value: string | undefined) => value ?? missingDeviceValue,
			title: t("adminShell.logs.login.columns.location"),
			width: token.controlHeight * 4,
		},
		{
			dataIndex: "userAgent",
			key: "browser",
			render: (value: string | undefined) =>
				getDeviceDetails(value).browser ?? missingDeviceValue,
			title: t("adminShell.logs.common.browser"),
			width: token.controlHeight * 4,
		},
		{
			dataIndex: "userAgent",
			key: "operatingSystem",
			render: (value: string | undefined) =>
				getDeviceDetails(value).operatingSystem ?? missingDeviceValue,
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
			dataIndex: "sessionId",
			key: "sessionId",
			render: renderCodeValue,
			title: t("adminShell.logs.login.columns.sessionId"),
			width: token.controlHeight * 5,
		},
		{
			dataIndex: "acceptLanguage",
			key: "rawAcceptLanguage",
			render: renderCodeValue,
			title: t("adminShell.logs.common.acceptLanguage"),
			width: token.controlHeight * 5,
		},
		{
			dataIndex: "userAgent",
			key: "rawUserAgent",
			render: renderCodeValue,
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
		form.resetFields();
		form.setFieldsValue({ dateRange: null, result: "all" });
		setFilterDraft(defaultLoginFilterDraft);
		setFilters({});
		setPage(1);
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
			<LogTablePanel<PlatformLoginLog>
				columnSettingsStorageKey={getTableColumnSettingsStorageKey(
					"login-logs",
				)}
				columnVisibility={loginLogColumnVisibility}
				columns={columns}
				dataSource={query.data?.items ?? []}
				emptyText={t("adminShell.logs.login.empty")}
				error={query.error}
				initialLoading={query.isPending}
				minimumWidth={token.controlHeight * 34}
				onPageChange={(nextPage, nextPageSize) => {
					setPage(nextPageSize === pageSize ? nextPage : 1);
					setPageSize(nextPageSize);
				}}
				onReload={() => void query.refetch()}
				onTableChange={handleTableChange}
				page={page}
				pageSize={pageSize}
				queryPanel={
					<LogQueryPanel<LoginFilterFormValues>
						expanded={filtersExpanded}
						form={form}
						initialValues={deserializeLoginFilterDraft(filterDraft)}
						loading={query.isFetching && !query.isPending}
						onFinish={applyFilters}
						onReset={resetFilters}
						onExpandedChange={setFiltersExpanded}
						onValuesChange={(_, values) =>
							setFilterDraft(serializeLoginFilterDraft(values))
						}
						testId="login-log-query-form"
					>
						<ProForm.Item
							key="result"
							label={t("adminShell.logs.login.filters.result")}
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
										label: t("adminShell.logs.common.results.invalid"),
										value: "invalid",
									},
									{
										label: t("adminShell.logs.common.results.limited"),
										value: "limited",
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
