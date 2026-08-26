import {
	ProTable,
	type ProColumns,
	type ProTableProps,
} from "@ant-design/pro-components";
import type { TablePaginationConfig, TableProps } from "antd";
import type { ReactNode } from "react";
import { useSyncExternalStore } from "react";
import { useTranslation } from "react-i18next";

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
	columns: ProColumns<Row>[];
	dataSource: Row[];
	emptyText: string;
	initialLoading: boolean;
	minimumWidth?: number;
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
	columns,
	dataSource,
	emptyText,
	initialLoading,
	minimumWidth,
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
					labelWidth: 120,
					...(search ?? {}),
				};

	return (
		<div data-testid={testId}>
			<ProTable<Row, SearchValues>
				cardBordered={false}
				columns={columns}
				columnsState={{
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
						listsHeight: 520,
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
				scroll={{ x: minimumWidth ?? "max-content" }}
				{...(searchForm ? { form: searchForm } : {})}
			/>
		</div>
	);
}

export type ManagementProTableColumn<Row> = ProColumns<Row>;
