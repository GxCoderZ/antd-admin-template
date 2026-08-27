import {
	ColumnHeightOutlined,
	ReloadOutlined,
	SettingOutlined,
} from "@ant-design/icons";
import { ListToolBar, QueryFilter } from "@ant-design/pro-components";
import { ApiProblemError } from "#src/api/client";
import {
	Alert,
	Button,
	Card,
	Checkbox,
	Descriptions,
	Drawer,
	Dropdown,
	Flex,
	Popover,
	Table,
	theme,
	Tooltip,
} from "antd";
import type {
	DescriptionsProps,
	FormInstance,
	FormProps,
	MenuProps,
	TablePaginationConfig,
	TableColumnsType,
	TableProps,
} from "antd";
import type { ReactNode } from "react";
import { useMemo, useRef, useSyncExternalStore } from "react";
import { useTranslation } from "react-i18next";

import {
	defaultPreferences,
	readUserTableDensityPreference,
	subscribeToPreferenceChanges,
	writeUserTableDensityPreference,
} from "../../app/preferenceStorage";
import { managementQueryLayout } from "../../app/queryFilterLayout";
import {
	type ResponsiveTableColumnConfig,
	useResponsiveTableColumns,
} from "../../app/tableColumnVisibility";

const pageSizeOptions = [10, 20, 50, 100];

export const defaultLogPageSize = 10;

function getProblemDetail(error: unknown) {
	return error instanceof ApiProblemError ? error.problem?.detail : undefined;
}

interface LogQueryPanelProps<Values extends object> {
	children: ReactNode;
	expanded: boolean;
	form: FormInstance<Values>;
	initialValues: NonNullable<FormProps<Values>["initialValues"]>;
	loading: boolean;
	onExpandedChange: (expanded: boolean) => void;
	onFinish: (values: Values) => void;
	onReset: () => void;
	onValuesChange?: FormProps<Values>["onValuesChange"];
	testId: string;
}

interface LogTablePanelProps<Row extends { id: string }> {
	columnSettingsStorageKey: string;
	columnVisibility: readonly ResponsiveTableColumnConfig<string>[];
	columns: TableColumnsType<Row>;
	dataSource: Row[];
	description?: ReactNode;
	emptyText: string;
	error: unknown;
	errorFallback?: string;
	errorTitle?: string;
	initialLoading: boolean;
	minimumWidth?: number;
	onPageChange?: (page: number, pageSize: number) => void;
	onReload: () => void;
	onTableChange?: TableProps<Row>["onChange"];
	page: number;
	pageSize: number;
	pagination?: false;
	primaryAction?: ReactNode;
	queryPanel: ReactNode;
	refreshing: boolean;
	rowSelection?: TableProps<Row>["rowSelection"];
	rowClassName?: TableProps<Row>["rowClassName"];
	tableComponents?: TableProps<Row>["components"];
	tableExtra?: ReactNode;
	tableWrapper?: (table: ReactNode) => ReactNode;
	testId: string;
	title: string;
	total: number;
	workspaceTestId: string;
}

interface LogDetailsDrawerProps {
	items: DescriptionsProps["items"] | undefined;
	onClose: () => void;
	open: boolean;
	title: string;
}

export function LogQueryPanel<Values extends object>({
	children,
	expanded,
	form,
	initialValues,
	loading,
	onExpandedChange,
	onFinish,
	onReset,
	onValuesChange,
	testId,
}: LogQueryPanelProps<Values>) {
	const { t } = useTranslation();
	const { token } = theme.useToken();

	return (
		<QueryFilter<Values>
			{...managementQueryLayout}
			autoFocusFirstInput={false}
			collapsed={!expanded}
			data-testid={testId}
			dateFormatter={false}
			form={form}
			initialValues={initialValues}
			onCollapse={(collapsed) => onExpandedChange(!collapsed)}
			onFinish={onFinish}
			onReset={onReset}
			onValuesChange={onValuesChange}
			resetText={t("adminShell.logs.common.reset")}
			searchText={t("adminShell.logs.common.query")}
			style={{
				background: token.colorBgContainer,
				borderRadius: token.borderRadiusLG,
			}}
			submitter={{ submitButtonProps: { loading } }}
		>
			{children}
		</QueryFilter>
	);
}

export function LogTablePanel<Row extends { id: string }>({
	columnSettingsStorageKey,
	columnVisibility,
	columns,
	dataSource,
	description,
	emptyText,
	error,
	errorFallback,
	errorTitle,
	initialLoading,
	minimumWidth,
	onPageChange,
	onReload,
	onTableChange,
	page,
	pageSize,
	pagination,
	primaryAction,
	queryPanel,
	refreshing,
	rowClassName,
	rowSelection,
	tableComponents,
	tableExtra,
	tableWrapper,
	testId,
	title,
	total,
	workspaceTestId,
}: LogTablePanelProps<Row>) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const workspaceRef = useRef<HTMLDivElement>(null);
	const orderedColumns = useMemo(() => {
		const actionColumns = columns.filter((column) => column.key === "actions");

		return actionColumns.length === 0
			? columns
			: [
					...columns.filter((column) => column.key !== "actions"),
					...actionColumns,
				];
	}, [columns]);
	const allColumnKeys = useMemo(
		() => orderedColumns.map((column) => String(column.key)),
		[orderedColumns],
	);
	const tableColumns = useResponsiveTableColumns<Row, string>({
		columnKeys: allColumnKeys,
		columns: orderedColumns,
		configs: columnVisibility,
		containerRef: workspaceRef,
		storageKey: columnSettingsStorageKey,
	});
	const tableSize = useSyncExternalStore(
		subscribeToPreferenceChanges,
		readUserTableDensityPreference,
		() => defaultPreferences.userTableDensity,
	);
	const tableScrollX =
		tableColumns.minimumWidth || minimumWidth || "max-content";
	const tablePagination: false | TablePaginationConfig =
		pagination === false
			? false
			: {
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
					style: { marginBottom: 0 },
					total,
				};
	const hasLeadingContent = Boolean(description || tableExtra);

	const densityItems: MenuProps["items"] = [
		{ key: "large", label: t("adminShell.logs.common.densityOptions.large") },
		{ key: "middle", label: t("adminShell.logs.common.densityOptions.middle") },
		{ key: "small", label: t("adminShell.logs.common.densityOptions.small") },
	];
	const columnSettings = (
		<Flex
			gap={token.marginXS}
			style={{ minWidth: token.controlHeight * 6 }}
			vertical
		>
			<Flex align="center" justify="space-between">
				<Checkbox
					checked={tableColumns.isAllColumnsVisible}
					indeterminate={tableColumns.isSomeColumnsVisible}
					onChange={(event) => {
						tableColumns.setVisibleColumnKeys(
							event.target.checked
								? tableColumns.availableColumnKeys
								: tableColumns.requiredColumnKeys,
						);
					}}
				>
					{t("adminShell.logs.common.columnDisplay")}
				</Checkbox>
				<Button
					onClick={tableColumns.resetColumnSettings}
					size="small"
					type="link"
				>
					{t("adminShell.logs.common.resetColumns")}
				</Button>
			</Flex>
			<Checkbox.Group
				onChange={(keys) => tableColumns.setVisibleColumnKeys(keys.map(String))}
				value={tableColumns.visibleColumnKeys}
			>
				<Flex gap={token.marginXS} vertical>
					{orderedColumns.map((column) => (
						<Checkbox
							disabled={tableColumns.requiredColumnKeys.includes(
								String(column.key),
							)}
							key={String(column.key)}
							value={String(column.key)}
						>
							{column.title as ReactNode}
						</Checkbox>
					))}
				</Flex>
			</Checkbox.Group>
		</Flex>
	);
	const toolbarSettings = [
		<Tooltip key="reload" title={t("adminShell.logs.common.reload")}>
			<Button
				aria-label={t("adminShell.logs.common.reload")}
				color="default"
				icon={<ReloadOutlined aria-hidden />}
				loading={refreshing}
				onClick={onReload}
				variant="link"
			/>
		</Tooltip>,
		<Dropdown
			key="density"
			menu={{
				items: densityItems,
				onClick: ({ key }) => {
					if (key === "large" || key === "middle" || key === "small") {
						writeUserTableDensityPreference(key);
					}
				},
				selectedKeys: [tableSize ?? "middle"],
			}}
			placement="bottomRight"
			trigger={["click"]}
		>
			<Tooltip title={t("adminShell.logs.common.density")}>
				<Button
					aria-label={t("adminShell.logs.common.density")}
					color="default"
					icon={<ColumnHeightOutlined aria-hidden />}
					variant="link"
				/>
			</Tooltip>
		</Dropdown>,
		<Popover
			key="columns"
			arrow={false}
			content={columnSettings}
			placement="bottomRight"
			trigger="click"
		>
			<Tooltip title={t("adminShell.logs.common.tableSettings")}>
				<Button
					aria-label={t("adminShell.logs.common.tableSettings")}
					color="default"
					icon={<SettingOutlined aria-hidden />}
					variant="link"
				/>
			</Tooltip>
		</Popover>,
	];

	return (
		<Flex
			data-testid={workspaceTestId}
			gap={token.margin}
			ref={workspaceRef}
			vertical
		>
			{queryPanel}
			<Card
				data-testid={testId}
				styles={{
					root: { boxShadow: "none" },
					body: {
						paddingBlockEnd: token.padding,
						paddingBlockStart: 0,
					},
				}}
				variant="borderless"
			>
				<ListToolBar
					actions={primaryAction ? [primaryAction] : []}
					settings={toolbarSettings}
					title={title}
				/>
				{hasLeadingContent ? (
					<Flex
						gap={token.margin}
						style={{
							marginBlockEnd: token.margin,
						}}
						vertical
					>
						{description}
						{tableExtra}
					</Flex>
				) : null}
				{error ? (
					<div
						style={{ marginBlockStart: hasLeadingContent ? 0 : token.marginLG }}
					>
						<Alert
							action={
								<Button onClick={onReload}>
									{t("adminShell.logs.common.retry")}
								</Button>
							}
							description={
								getProblemDetail(error) ??
								errorFallback ??
								t("adminShell.logs.common.errorFallback")
							}
							title={errorTitle ?? t("adminShell.logs.common.loadError")}
							showIcon
							type="error"
						/>
					</div>
				) : tableWrapper ? (
					tableWrapper(
						<Table<Row>
							columns={tableColumns.visibleColumns}
							dataSource={dataSource}
							loading={initialLoading || refreshing}
							locale={{ emptyText }}
							pagination={tablePagination}
							rowKey="id"
							{...(onTableChange ? { onChange: onTableChange } : {})}
							{...(rowClassName ? { rowClassName } : {})}
							{...(rowSelection ? { rowSelection } : {})}
							{...(tableComponents ? { components: tableComponents } : {})}
							scroll={{ x: tableScrollX }}
							size={tableSize}
							tableLayout="fixed"
						/>,
					)
				) : (
					<Table<Row>
						columns={tableColumns.visibleColumns}
						dataSource={dataSource}
						loading={initialLoading || refreshing}
						locale={{ emptyText }}
						pagination={tablePagination}
						rowKey="id"
						{...(onTableChange ? { onChange: onTableChange } : {})}
						{...(rowClassName ? { rowClassName } : {})}
						{...(rowSelection ? { rowSelection } : {})}
						{...(tableComponents ? { components: tableComponents } : {})}
						scroll={{ x: tableScrollX }}
						size={tableSize}
						tableLayout="fixed"
					/>
				)}
			</Card>
		</Flex>
	);
}

export function LogDetailsDrawer({
	items,
	onClose,
	open,
	title,
}: LogDetailsDrawerProps) {
	return (
		<Drawer destroyOnHidden onClose={onClose} open={open} title={title}>
			{items ? (
				<Descriptions bordered column={1} items={items} size="small" />
			) : null}
		</Drawer>
	);
}
