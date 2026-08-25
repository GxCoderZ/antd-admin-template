import {
	ColumnHeightOutlined,
	DownOutlined,
	FullscreenExitOutlined,
	FullscreenOutlined,
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
	ConfigProvider,
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
	TableColumnsType,
	TableProps,
} from "antd";
import type { ReactNode, RefObject } from "react";
import {
	useEffect,
	useMemo,
	useRef,
	useState,
	useSyncExternalStore,
} from "react";
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
	onPageChange: (page: number, pageSize: number) => void;
	onReload: () => void;
	onTableChange: NonNullable<TableProps<Row>["onChange"]>;
	page: number;
	pageSize: number;
	primaryAction?: ReactNode;
	queryPanel: ReactNode;
	refreshing: boolean;
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
	primaryAction,
	queryPanel,
	refreshing,
	testId,
	title,
	total,
	workspaceTestId,
}: LogTablePanelProps<Row>) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const workspaceRef = useRef<HTMLDivElement>(null);
	const allColumnKeys = useMemo(
		() => columns.map((column) => String(column.key)),
		[columns],
	);
	const tableColumns = useResponsiveTableColumns<Row, string>({
		columnKeys: allColumnKeys,
		columns,
		configs: columnVisibility,
		containerRef: workspaceRef,
		storageKey: columnSettingsStorageKey,
	});
	const tableSize = useSyncExternalStore(
		subscribeToPreferenceChanges,
		readUserTableDensityPreference,
		() => defaultPreferences.userTableDensity,
	);
	const [isFullscreen, setIsFullscreen] = useState(false);
	const tableScrollX = tableColumns.minimumWidth || minimumWidth || "max-content";

	useEffect(() => {
		const handleFullscreenChange = () => {
			setIsFullscreen(document.fullscreenElement === workspaceRef.current);
		};

		document.addEventListener("fullscreenchange", handleFullscreenChange);
		return () =>
			document.removeEventListener("fullscreenchange", handleFullscreenChange);
	}, []);

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
					{columns.map((column) => (
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

	const toggleFullscreen = async () => {
		if (document.fullscreenElement === workspaceRef.current) {
			await document.exitFullscreen?.();
			return;
		}

		await workspaceRef.current?.requestFullscreen?.();
	};

	return (
		<ConfigProvider
			getPopupContainer={() =>
				isFullscreen ? (workspaceRef.current ?? document.body) : document.body
			}
		>
			<Flex
				data-testid={workspaceTestId}
				gap={token.marginLG}
				ref={workspaceRef}
				style={
					isFullscreen
						? {
								background: token.colorBgLayout,
								boxSizing: "border-box",
								height: "100%",
								overflow: "auto",
								padding: token.paddingLG,
							}
						: undefined
				}
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
								<Tooltip
									title={t(
										isFullscreen
											? "adminShell.logs.common.exitFullscreen"
											: "adminShell.logs.common.fullscreen",
									)}
								>
									<Button
										aria-label={t(
											isFullscreen
												? "adminShell.logs.common.exitFullscreen"
												: "adminShell.logs.common.fullscreen",
										)}
										color="default"
										icon={
											isFullscreen ? (
												<FullscreenExitOutlined aria-hidden />
											) : (
												<FullscreenOutlined aria-hidden />
											)
										}
										onClick={() => void toggleFullscreen()}
										variant="link"
									/>
								</Tooltip>
							</Space>
						</Flex>
					}
					styles={{
						header: {
							minHeight: token.controlHeightLG + token.marginLG,
						},
						title: { overflow: "visible" },
					}}
				>
					{description ? (
						<div style={{ marginBottom: token.margin }}>{description}</div>
					) : null}
					{error ? (
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
					) : (
						<Table<Row>
							columns={tableColumns.visibleColumns}
							dataSource={dataSource}
							loading={initialLoading || refreshing}
							locale={{ emptyText }}
							onChange={onTableChange}
							pagination={{
								current: page,
								onChange: onPageChange,
								pageSize,
								pageSizeOptions,
								placement: ["bottomEnd"],
								showSizeChanger: true,
								showTotal: (nextTotal, [start, end]) =>
									t("adminShell.logs.common.paginationTotal", {
										end,
										start,
										total: nextTotal,
									}),
								total,
							}}
							rowKey="id"
							scroll={{ x: tableScrollX }}
							size={tableSize}
							tableLayout="fixed"
						/>
					)}
				</Card>
			</Flex>
		</ConfigProvider>
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
