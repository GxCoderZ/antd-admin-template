import {
	ColumnHeightOutlined,
	FullscreenExitOutlined,
	FullscreenOutlined,
	PlusOutlined,
	ReloadOutlined,
	SettingOutlined,
} from "@ant-design/icons";
import {
	Alert,
	Button,
	Card,
	Checkbox,
	Col,
	ConfigProvider,
	Dropdown,
	Flex,
	Form,
	Input,
	type MenuProps,
	Popover,
	Select,
	Space,
	Table,
	type FormInstance,
	type TableProps,
	theme,
	Tooltip,
	Tree,
} from "antd";
import {
	type ReactNode,
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
} from "../../../app/preferenceStorage";
import { useQueryFilterLayout } from "../../../app/queryFilterLayout";
import { LogQueryPanel } from "../../operations/LogTablePanel";
import type { PlatformUser } from "#src/api/users";
import { getProblemFallback } from "../userProblems";
import {
	defaultUserFilterValues,
	defaultVisibleUserColumnKeys,
	requiredUserColumnKeys,
	type UserColumnKey,
	type UserFilterValues,
	type UserTableState,
	userColumnKeys,
	userColumnWidthMultipliers,
} from "../userTableTypes";
import { useUserTableColumns } from "./useUserTableColumns";

interface UserPageData {
	items: PlatformUser[];
	page: number;
	pageSize: number;
	total: number;
}

interface UsersTablePanelProps {
	canManageUsers: boolean;
	currentUserId: string | undefined;
	data: UserPageData | undefined;
	draftFilters: UserFilterValues;
	error: unknown;
	filterForm: FormInstance<UserFilterValues>;
	initialLoading: boolean;
	onCreate: () => void;
	onDelete: (user: PlatformUser) => void;
	onDraftFiltersChange: (filters: UserFilterValues) => void;
	onEdit: (user: PlatformUser) => void;
	onForceLogout: (user: PlatformUser) => void;
	onManageRoles: (user: PlatformUser) => void;
	onQuery: () => void;
	onReload: () => void;
	onResetFilters: () => void;
	onResetPassword: (user: PlatformUser) => void;
	onTableChange: NonNullable<TableProps<PlatformUser>["onChange"]>;
	overlays: ReactNode;
	refreshing: boolean;
	tableState: UserTableState;
}

export function UsersTablePanel({
	canManageUsers,
	currentUserId,
	data,
	draftFilters,
	error,
	filterForm,
	initialLoading,
	onCreate,
	onDelete,
	onDraftFiltersChange,
	onEdit,
	onForceLogout,
	onManageRoles,
	onQuery,
	onReload,
	onResetFilters,
	onResetPassword,
	onTableChange,
	overlays,
	refreshing,
	tableState,
}: UsersTablePanelProps) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const [filtersExpanded, setFiltersExpanded] = useState(false);
	const {
		canExpand,
		collapsedFieldCount,
		columnSpan,
		containerRef,
		formLayout,
		submitterOffset,
	} = useQueryFilterLayout({ expanded: filtersExpanded, fieldCount: 2 });
	const showStatusFilter = filtersExpanded || collapsedFieldCount >= 2;
	const tableSize = useSyncExternalStore(
		subscribeToPreferenceChanges,
		readUserTableDensityPreference,
		() => defaultPreferences.userTableDensity,
	);
	const [isFullscreen, setIsFullscreen] = useState(false);
	const [columnOrder, setColumnOrder] = useState<UserColumnKey[]>([
		...userColumnKeys,
	]);
	const [visibleColumnKeys, setVisibleColumnKeys] = useState<UserColumnKey[]>([
		...defaultVisibleUserColumnKeys,
	]);
	const workspaceRef = useRef<HTMLDivElement>(null);
	const availableColumnKeys = useMemo<readonly UserColumnKey[]>(
		() => userColumnKeys,
		[],
	);
	const visibleAvailableColumnKeys = useMemo(
		() =>
			visibleColumnKeys.filter((columnKey) =>
				availableColumnKeys.includes(columnKey),
			),
		[availableColumnKeys, visibleColumnKeys],
	);
	const columns = useUserTableColumns({
		canManageUsers,
		currentUserId,
		onDelete,
		onEdit,
		onForceLogout,
		onManageRoles,
		onResetPassword,
		tableState,
		userColumnOrder: columnOrder,
		visibleColumnKeys: visibleAvailableColumnKeys,
	});
	const minimumWidth = visibleAvailableColumnKeys.reduce(
		(totalWidth, columnKey) =>
			totalWidth + token.controlHeight * userColumnWidthMultipliers[columnKey],
		token.controlHeight * 2,
	);

	useEffect(() => {
		const syncFullscreenState = () => {
			setIsFullscreen(document.fullscreenElement === workspaceRef.current);
		};
		document.addEventListener("fullscreenchange", syncFullscreenState);
		return () =>
			document.removeEventListener("fullscreenchange", syncFullscreenState);
	}, []);

	const changeTableSize: NonNullable<MenuProps["onClick"]> = ({ key }) => {
		if (key === "large" || key === "middle" || key === "small") {
			writeUserTableDensityPreference(key);
		}
	};
	const toggleFullscreen = () => {
		const workspace = workspaceRef.current;
		if (!workspace) {
			return;
		}
		if (document.fullscreenElement === workspace) {
			void document.exitFullscreen?.();
			return;
		}
		void workspace.requestFullscreen?.();
	};
	const columnSettingsTitle = (
		<Flex align="center" justify="space-between">
			<Checkbox
				checked={availableColumnKeys.every((key) =>
					visibleAvailableColumnKeys.includes(key),
				)}
				indeterminate={
					visibleAvailableColumnKeys.length > 0 &&
					visibleAvailableColumnKeys.length < availableColumnKeys.length
				}
				onChange={(event) =>
					setVisibleColumnKeys(
						event.target.checked
							? [...availableColumnKeys]
							: [...requiredUserColumnKeys],
					)
				}
			>
				{t("adminShell.users.columnSettings.title")}
			</Checkbox>
			<Button
				onClick={() => {
					setColumnOrder([...userColumnKeys]);
					setVisibleColumnKeys([...defaultVisibleUserColumnKeys]);
				}}
				size="small"
				type="link"
			>
				{t("adminShell.users.columnSettings.reset")}
			</Button>
		</Flex>
	);
	const columnSettings = (
		<Flex
			gap={token.marginXS}
			style={{ width: token.controlHeightLG * 5 - token.paddingSM * 2 }}
			vertical
		>
			<ConfigProvider
				theme={{
					components: {
						Tree: { titleHeight: token.controlHeightSM - token.marginXXS },
					},
				}}
			>
				<Tree
					blockNode
					checkable
					checkedKeys={visibleAvailableColumnKeys}
					draggable
					onCheck={(checkedKeys) => {
						const nextKeys = Array.isArray(checkedKeys)
							? checkedKeys
							: checkedKeys.checked;
						setVisibleColumnKeys(
							availableColumnKeys.filter(
								(columnKey) =>
									requiredUserColumnKeys.some(
										(requiredKey) => requiredKey === columnKey,
									) || nextKeys.includes(columnKey),
							),
						);
					}}
					onDrop={({ dragNode, node, dropPosition }) => {
						const dragKey = dragNode.key;
						const targetKey = node.key;
						const targetPosition = Number(node.pos.split("-").at(-1));
						setColumnOrder((existingOrder) => {
							const nextOrder = existingOrder.filter((key) => key !== dragKey);
							const targetIndex = nextOrder.indexOf(targetKey);
							const insertIndex =
								dropPosition - targetPosition < 0
									? targetIndex
									: targetIndex + 1;
							nextOrder.splice(insertIndex, 0, dragKey);
							return nextOrder;
						});
					}}
					selectable={false}
					showLine={false}
					treeData={columnOrder
						.filter((key) => availableColumnKeys.includes(key))
						.map((key) => ({
							disabled: requiredUserColumnKeys.some(
								(requiredKey) => requiredKey === key,
							),
							key,
							title: t(`adminShell.users.columns.${key}`),
						}))}
				/>
			</ConfigProvider>
		</Flex>
	);

	return (
		<ConfigProvider
			getPopupContainer={() =>
				isFullscreen ? (workspaceRef.current ?? document.body) : document.body
			}
		>
			{overlays}
			<Flex
				data-testid="admin-users-table-workspace"
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
				{error ? (
					<Alert
						action={
							<Button onClick={onReload} size="small">
								{t("adminShell.users.retry")}
							</Button>
						}
						description={getProblemFallback(
							error,
							t("adminShell.users.errors.fallback"),
						)}
						showIcon
						title={t("adminShell.users.errors.request")}
						type="error"
					/>
				) : null}
				<LogQueryPanel<UserFilterValues>
					actionsTestId="admin-users-query-actions"
					canExpand={canExpand}
					columnSpan={columnSpan}
					containerRef={containerRef}
					expanded={filtersExpanded}
					form={filterForm}
					formLayout={formLayout}
					initialValues={defaultUserFilterValues}
					loading={refreshing}
					onFinish={onQuery}
					onReset={onResetFilters}
					onToggle={() => setFiltersExpanded((expanded) => !expanded)}
					submitterOffset={submitterOffset}
					testId="admin-users-query-form"
				>
					<Col span={columnSpan}>
						<Form.Item
							label={t("adminShell.users.filters.q")}
							style={{ marginBottom: 0 }}
						>
							<Input
								allowClear
								onChange={(event) =>
									onDraftFiltersChange({
										...draftFilters,
										q: event.target.value,
									})
								}
								placeholder={t("adminShell.users.placeholders.q")}
								style={{ width: "100%" }}
								value={draftFilters.q}
							/>
						</Form.Item>
					</Col>
					{showStatusFilter ? (
						<Col span={columnSpan}>
							<Form.Item
								label={t("adminShell.users.filters.status")}
								style={{ marginBottom: 0 }}
							>
								<Select
									aria-label={t("adminShell.users.filters.status")}
									onChange={(status: UserFilterValues["status"]) =>
										onDraftFiltersChange({ ...draftFilters, status })
									}
									options={[
										{ label: t("adminShell.users.allStatuses"), value: "all" },
										{
											label: t("adminShell.users.statuses.active"),
											value: "active",
										},
										{
											label: t("adminShell.users.statuses.locked"),
											value: "locked",
										},
										{
											label: t("adminShell.users.statuses.disabled"),
											value: "disabled",
										},
									]}
									style={{ width: "100%" }}
									value={draftFilters.status}
								/>
							</Form.Item>
						</Col>
					) : null}
				</LogQueryPanel>
				<Card
					data-testid="admin-users-table-card"
					extra={
						<Space>
							{canManageUsers ? (
								<Button
									icon={<PlusOutlined aria-hidden />}
									onClick={onCreate}
									type="primary"
								>
									{t("adminShell.users.create")}
								</Button>
							) : null}
							<Tooltip title={t("adminShell.users.reload")}>
								<Button
									aria-label={t("adminShell.users.reload")}
									color="default"
									icon={<ReloadOutlined aria-hidden />}
									loading={refreshing}
									onClick={onReload}
									variant="link"
								/>
							</Tooltip>
							<Dropdown
								menu={{
									items: ["large", "middle", "small"].map((key) => ({
										key,
										label: t(`adminShell.users.densityOptions.${key}`),
									})),
									onClick: changeTableSize,
									selectedKeys: [tableSize],
								}}
								placement="bottomRight"
								trigger={["click"]}
							>
								<Tooltip title={t("adminShell.users.density")}>
									<Button
										aria-label={t("adminShell.users.density")}
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
								title={columnSettingsTitle}
								trigger="click"
							>
								<Tooltip title={t("adminShell.users.tableSettings")}>
									<Button
										aria-label={t("adminShell.users.tableSettings")}
										color="default"
										icon={<SettingOutlined aria-hidden />}
										variant="link"
									/>
								</Tooltip>
							</Popover>
							<Tooltip
								title={t(
									isFullscreen
										? "adminShell.users.exitFullscreen"
										: "adminShell.users.fullscreen",
								)}
							>
								<Button
									aria-label={t(
										isFullscreen
											? "adminShell.users.exitFullscreen"
											: "adminShell.users.fullscreen",
									)}
									color="default"
									icon={
										isFullscreen ? (
											<FullscreenExitOutlined aria-hidden />
										) : (
											<FullscreenOutlined aria-hidden />
										)
									}
									onClick={toggleFullscreen}
									variant="link"
								/>
							</Tooltip>
						</Space>
					}
					styles={{
						header: { minHeight: token.controlHeightLG + token.marginLG },
					}}
					title={t("adminShell.users.tableTitle")}
				>
					<Table<PlatformUser>
						columns={columns}
						dataSource={data?.items ?? []}
						loading={initialLoading || refreshing}
						locale={{ emptyText: t("adminShell.users.empty") }}
						onChange={onTableChange}
						pagination={{
							current: data?.page ?? tableState.page,
							pageSize: data?.pageSize ?? tableState.pageSize,
							pageSizeOptions: [10, 20, 50, 100],
							placement: ["bottomEnd"],
							showSizeChanger: true,
							showTotal: (total, [start, end]) =>
								t("adminShell.users.paginationTotal", { end, start, total }),
							total: data?.total ?? 0,
						}}
						rowKey="id"
						scroll={{ x: minimumWidth }}
						size={tableSize}
						tableLayout="fixed"
					/>
				</Card>
			</Flex>
		</ConfigProvider>
	);
}
