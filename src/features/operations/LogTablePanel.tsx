import {
	ColumnHeightOutlined,
	DownOutlined,
	ReloadOutlined,
	SettingOutlined,
	UpOutlined,
} from "@ant-design/icons";
import { ApiProblemError } from "#src/api/client";
import {
	Alert,
	Button,
	Card,
	Checkbox,
	Col,
	Descriptions,
	Drawer,
	Dropdown,
	Flex,
	Form,
	Popover,
	Row,
	Space,
	Table,
	theme,
	Tooltip,
	Typography,
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
import type { ReactNode, RefObject } from "react";
import { useMemo, useRef, useSyncExternalStore } from "react";
import { useTranslation } from "react-i18next";

import {
	defaultPreferences,
	readUserTableDensityPreference,
	subscribeToPreferenceChanges,
	writeUserTableDensityPreference,
} from "../../app/preferenceStorage";
import { QueryFilterSubmitter } from "../../app/QueryFilterSubmitter";
import {
	type ResponsiveTableColumnConfig,
	useResponsiveTableColumns,
} from "../../app/tableColumnVisibility";

const { Link } = Typography;
const pageSizeOptions = [10, 20, 50, 100];

export const defaultLogPageSize = 10;

function getProblemDetail(error: unknown) {
	return error instanceof ApiProblemError ? error.problem?.detail : undefined;
}

interface LogQueryPanelProps<Values extends object> {
	actionsTestId: string;
	canExpand: boolean;
	children: ReactNode;
	columnSpan: number;
	containerRef: RefObject<HTMLDivElement | null>;
	expanded: boolean;
	form: FormInstance<Values>;
	formLayout: NonNullable<FormProps["layout"]>;
	initialValues: NonNullable<FormProps<Values>["initialValues"]>;
	loading: boolean;
	onFinish: (values: Values) => void;
	onReset: () => void;
	onToggle: () => void;
	onValuesChange?: FormProps<Values>["onValuesChange"];
	submitterOffset: number;
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

interface LogQueryActionsProps {
	canExpand: boolean;
	expanded: boolean;
	loading: boolean;
	onReset: () => void;
	onToggle: () => void;
}

function LogQueryActions({
	canExpand,
	expanded,
	loading,
	onReset,
	onToggle,
}: LogQueryActionsProps) {
	const { t } = useTranslation();
	const { token } = theme.useToken();

	return (
		<Space size={token.margin}>
			<QueryFilterSubmitter
				loading={loading}
				onReset={onReset}
				queryText={t("adminShell.logs.common.query")}
				resetText={t("adminShell.logs.common.reset")}
			/>
			{canExpand ? (
				<Link
					aria-expanded={expanded}
					href="#"
					onClick={(event) => {
						event.preventDefault();
						onToggle();
					}}
				>
					{t(`adminShell.logs.common.${expanded ? "collapse" : "expand"}`)}
					{expanded ? (
						<UpOutlined
							aria-hidden
							style={{ marginInlineStart: token.marginXXS }}
						/>
					) : (
						<DownOutlined
							aria-hidden
							style={{ marginInlineStart: token.marginXXS }}
						/>
					)}
				</Link>
			) : null}
		</Space>
	);
}

export function LogQueryPanel<Values extends object>({
	actionsTestId,
	canExpand,
	children,
	columnSpan,
	containerRef,
	expanded,
	form,
	formLayout,
	initialValues,
	loading,
	onFinish,
	onReset,
	onToggle,
	onValuesChange,
	submitterOffset,
	testId,
}: LogQueryPanelProps<Values>) {
	const { token } = theme.useToken();

	return (
		<Card>
			<div ref={containerRef}>
				<Form<Values>
					data-testid={testId}
					form={form}
					initialValues={initialValues}
					{...(formLayout === "horizontal"
						? {
								labelCol: { flex: `0 0 ${token.controlHeightLG * 2}px` },
								wrapperCol: {
									style: {
										maxWidth: `calc(100% - ${token.controlHeightLG * 2}px)`,
									},
								},
							}
						: {})}
					layout={formLayout}
					onFinish={onFinish}
					onValuesChange={onValuesChange}
				>
					<Row gutter={token.marginLG} justify="start">
						{children}
						<Col
							data-testid={actionsTestId}
							offset={submitterOffset}
							span={columnSpan}
							style={{ textAlign: "end" }}
						>
							<Form.Item
								colon={false}
								label=" "
								shouldUpdate={false}
								style={{ marginBottom: 0, width: "100%" }}
							>
								<LogQueryActions
									canExpand={canExpand}
									expanded={expanded}
									loading={loading}
									onReset={onReset}
									onToggle={onToggle}
								/>
							</Form.Item>
						</Col>
					</Row>
				</Form>
			</div>
		</Card>
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

	return (
		<Flex
			data-testid={workspaceTestId}
			gap={token.marginLG}
			ref={workspaceRef}
			vertical
		>
			{queryPanel}
			<Card
				data-testid={testId}
				title={
					<Flex
						align="center"
						gap={token.marginXS}
						justify="space-between"
						wrap
					>
						<span>{title}</span>
						<Space>
							{primaryAction}
							<Tooltip title={t("adminShell.logs.common.reload")}>
								<Button
									aria-label={t("adminShell.logs.common.reload")}
									color="default"
									icon={<ReloadOutlined aria-hidden />}
									loading={refreshing}
									onClick={onReload}
									variant="link"
								/>
							</Tooltip>
							<Dropdown
								menu={{
									items: densityItems,
									onClick: ({ key }) => {
										if (
											key === "large" ||
											key === "middle" ||
											key === "small"
										) {
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
							</Dropdown>
							<Popover
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
							</Popover>
						</Space>
					</Flex>
				}
				styles={{
					body: {
						paddingBlockEnd: token.padding,
						paddingBlockStart: 0,
					},
					title: { overflow: "visible" },
				}}
			>
				{hasLeadingContent ? (
					<Flex
						gap={token.margin}
						style={{
							marginBlockEnd: token.margin,
							marginBlockStart: token.marginLG,
						}}
						vertical
					>
						{description}
						{tableExtra}
					</Flex>
				) : null}
				{error ? (
					<div style={{ marginBlockStart: hasLeadingContent ? 0 : token.marginLG }}>
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
