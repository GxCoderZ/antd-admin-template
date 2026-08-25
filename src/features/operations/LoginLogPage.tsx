import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
	Badge,
	Button,
	Col,
	DatePicker,
	Flex,
	Form,
	Select,
	theme,
	Typography,
} from "antd";
import type { TableColumnsType, TableProps } from "antd";
import type { Dayjs } from "dayjs";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import {
	formatDeviceInfo,
	getDeviceDetails,
	getPrimaryLanguage,
} from "../../app/deviceInfo";
import { formatDateTime } from "../../app/formatting";
import { useLocalePreferences } from "../../app/localePreferences";
import { resolveTableSort } from "../../app/tableSorting";
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
	listPlatformLoginLogs,
	loginLogsQueryKey,
	type LoginLogFilters,
	type PlatformLoginLog,
} from "#src/api/operations";

const { Text } = Typography;
type LoginLogSort = "created_at" | "identifier" | "result";
type SortOrder = "asc" | "desc";
const loginDefaultVisibleColumnKeys = [
	"identifier",
	"result",
	"userAgent",
	"requestIp",
	"acceptLanguage",
	"timeZone",
	"created_at",
	"actions",
] as const;
const loginRequiredColumnKeys = [
	"identifier",
	"result",
	"requestIp",
	"created_at",
	"actions",
] as const;
const loginTableSortToContractSort: Record<string, LoginLogSort> = {
	created_at: "created_at",
	identifier: "identifier",
	result: "result",
};

const loginResultStatus = {
	invalid: "error",
	limited: "warning",
	success: "success",
} as const;

interface LoginFilterFormValues {
	dateRange?: [Dayjs, Dayjs];
	result: "all" | NonNullable<LoginLogFilters["result"]>;
}

export function LoginLogPage() {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const [form] = Form.useForm<LoginFilterFormValues>();
	const [filters, setFilters] = useState<LoginLogFilters>({});
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(defaultLogPageSize);
	const [sort, setSort] = useState<LoginLogSort | undefined>("created_at");
	const [order, setOrder] = useState<SortOrder | undefined>("desc");
	const [selectedLog, setSelectedLog] = useState<PlatformLoginLog | null>(null);
	const [filtersExpanded, setFiltersExpanded] = useState(false);
	const querySubmission = useQuerySubmission();
	const {
		canExpand: canExpandFilters,
		collapsedFieldCount,
		columnSpan,
		containerRef: queryFilterContainerRef,
		formLayout: queryFilterLayout,
		submitterOffset,
	} = useQueryFilterLayout({ expanded: filtersExpanded, fieldCount: 2 });
	const showDateRangeFilter = filtersExpanded || collapsedFieldCount >= 2;
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
				<Button
					aria-label={t("adminShell.logs.common.viewRecord", { id: row.id })}
					onClick={() => setSelectedLog(row)}
					size="small"
					type="link"
				>
					{t("adminShell.logs.common.view")}
				</Button>
			),
			title: t("adminShell.logs.login.columns.actions"),
			width: token.controlHeight * 2,
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
		setFilters({
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
			<LogTablePanel<PlatformLoginLog>
				columns={columns}
				dataSource={query.data?.items ?? []}
				defaultVisibleColumnKeys={loginDefaultVisibleColumnKeys}
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
						actionsTestId="login-log-query-actions"
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
						testId="login-log-query-form"
					>
						<Col span={columnSpan}>
							<Form.Item
								label={t("adminShell.logs.login.filters.result")}
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
											label: t("adminShell.logs.common.results.invalid"),
											value: "invalid",
										},
										{
											label: t("adminShell.logs.common.results.limited"),
											value: "limited",
										},
									]}
								/>
							</Form.Item>
						</Col>
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
				requiredColumnKeys={loginRequiredColumnKeys}
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
