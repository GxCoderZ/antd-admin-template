import {
	ProTable,
	type ColumnsState,
	type ProColumns,
	type ProTableProps,
} from "@ant-design/pro-components";
import {
	ConfigProvider,
	theme,
	type TablePaginationConfig,
	type TableProps,
} from "antd";
import type { ReactNode } from "react";
import { useMemo, useSyncExternalStore } from "react";
import { useTranslation } from "react-i18next";

import { managementQueryLayout } from "./queryFilterLayout";
import type { TableColumnConfig } from "./tableColumnVisibility";

import {
	defaultPreferences,
	readUserTableDensityPreference,
	subscribeToPreferenceChanges,
	type UserTableDensity,
	writeUserTableDensityPreference,
} from "./preferenceStorage";

const pageSizeOptions = [10, 20, 50, 100];
const tableDensities: readonly UserTableDensity[] = [
	"large",
	"middle",
	"small",
];

function isUserTableDensity(value: unknown): value is UserTableDensity {
	return tableDensities.some((density) => density === value);
}

function getProTableColumnSettingsStorageKey(storageKey: string) {
	return `${storageKey}:pro-table`;
}

export interface ManagementProTableProps<
	Row extends { id: string },
	SearchValues extends object,
> {
	columnSettingsStorageKey: string;
	columnVisibility: readonly TableColumnConfig[];
	columns: ProColumns<Row>[];
	dataSource: Row[];
	emptyText: string;
	initialLoading: boolean;
	onPageChange?: (page: number, pageSize: number) => void;
	onReload: () => void;
	onReset?: () => void;
	onSubmit?: (values: SearchValues) => void;
	onTableChange?: TableProps<Row>["onChange"];
	page: number;
	pageSize: number;
	primaryAction?: ReactNode;
	refreshing: boolean;
	searchForm?: ProTableProps<Row, SearchValues>["form"];
	search?: ProTableProps<Row, SearchValues>["search"];
	testId: string;
	title: string;
	total: number;
}

export function ManagementProTable<
	Row extends { id: string },
	SearchValues extends object,
>({
	columnSettingsStorageKey,
	columnVisibility,
	columns,
	dataSource,
	emptyText,
	initialLoading,
	onPageChange,
	onReload,
	onReset,
	onSubmit,
	onTableChange,
	page,
	pageSize,
	primaryAction,
	refreshing,
	search,
	searchForm,
	testId,
	title,
	total,
}: ManagementProTableProps<Row, SearchValues>) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const defaultColumnsState = useMemo<Record<string, ColumnsState>>(
		() =>
			Object.fromEntries(
				columnVisibility.map((config, order) => [
					config.key,
					{
						show: config.visibility !== "optional",
						order,
						...(config.key === "actions" ? { fixed: "right" as const } : {}),
					},
				]),
			),
		[columnVisibility],
	);
	const configuredColumns = useMemo(
		() =>
			columns.map((column) => {
				const config = columnVisibility.find((item) => item.key === column.key);
				return {
					...column,
					disable: config?.visibility === "required",
					hideInSetting:
						column.hideInTable || config?.visibility === "required",
					...(column.key === "actions" ? { fixed: "right" as const } : {}),
				};
			}),
		[columns, columnVisibility],
	);
	const tableSize = useSyncExternalStore(
		subscribeToPreferenceChanges,
		readUserTableDensityPreference,
		() => defaultPreferences.userTableDensity,
	);
	const tablePagination: false | TablePaginationConfig = {
		current: page,
		...(onPageChange ? { onChange: onPageChange } : {}),
		pageSize,
		pageSizeOptions,
		placement: ["bottomEnd"],
		showSizeChanger: true,
		showTotal: (nextTotal: number, range: [number, number]) =>
			t("adminShell.logs.common.paginationTotal", {
				end: range[1],
				start: range[0],
				total: nextTotal,
			}),
		total,
	};
	const tableSearch: ProTableProps<Row, SearchValues>["search"] =
		search === false
			? false
			: {
					...managementQueryLayout,
					...(search ?? {}),
				};

	// Filter shadows let scrolled virtual rows intercept the popup title in Chromium.
	// Use the public Popover styles API for Chromium issue 333067182.
	return (
		<ConfigProvider
			popover={{
				styles: {
					root: { filter: "none" },
					container: { boxShadow: token.boxShadowSecondary },
				},
			}}
		>
			<div data-testid={testId}>
				<ProTable<Row, SearchValues>
					cardBordered={false}
					columns={configuredColumns}
					columnsState={{
						defaultValue: defaultColumnsState,
						persistenceKey: getProTableColumnSettingsStorageKey(
							columnSettingsStorageKey,
						),
						persistenceType: "localStorage",
					}}
					dataSource={dataSource}
					dateFormatter={false}
					headerTitle={title}
					loading={initialLoading || refreshing}
					manualRequest
					{...(onTableChange ? { onChange: onTableChange } : {})}
					{...(onReset ? { onReset } : {})}
					onSizeChange={(nextSize) => {
						if (isUserTableDensity(nextSize)) {
							writeUserTableDensityPreference(nextSize);
						}
					}}
					{...(onSubmit ? { onSubmit } : {})}
					options={{
						density: true,
						fullScreen: true,
						reload: onReload,
						setting: {
							draggable: true,
						},
					}}
					pagination={tablePagination}
					rowKey="id"
					search={tableSearch}
					size={tableSize}
					tableAlertRender={false}
					tableLayout="fixed"
					toolBarRender={() => (primaryAction ? [primaryAction] : [])}
					locale={{ emptyText }}
					scroll={{ x: "max-content" }}
					{...(searchForm ? { form: searchForm } : {})}
				/>
			</div>
		</ConfigProvider>
	);
}

export type ManagementProTableColumn<Row> = ProColumns<Row>;
