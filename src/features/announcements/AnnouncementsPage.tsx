import {
	ColumnHeightOutlined,
	FullscreenExitOutlined,
	FullscreenOutlined,
	PlusOutlined,
	ReloadOutlined,
	SettingOutlined,
} from "@ant-design/icons";
import {
	keepPreviousData,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
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
	Modal,
	Popover,
	Select,
	Space,
	Table,
	Tag,
	theme,
	Tooltip,
	Tree,
} from "antd";
import type { TableProps } from "antd";
import {
	useEffect,
	useMemo,
	useRef,
	useState,
	useSyncExternalStore,
} from "react";
import { useTranslation } from "react-i18next";

import { formatDateTime } from "../../app/formatting";
import { useLocalePreferences } from "../../app/localePreferences";
import { platformPermissions, usePermission } from "../../app/permissions";
import {
	defaultPreferences,
	readUserTableDensityPreference,
	subscribeToPreferenceChanges,
	writeUserTableDensityPreference,
} from "../../app/preferenceStorage";
import {
	useQueryFilterLayout,
	useQuerySubmission,
} from "../../app/queryFilterLayout";
import { resolveTableSort } from "../../app/tableSorting";
import {
	TableActionButton,
	TableActionMenu,
} from "../../app/TableActionButton";
import {
	createPlatformAnnouncement,
	deletePlatformAnnouncement,
	listPlatformAnnouncements,
	platformAnnouncementsQueryKey,
	type CreatePlatformAnnouncementInput,
	type ListPlatformAnnouncementsInput,
	type PlatformAnnouncement,
	type PlatformAnnouncementStatus,
	updatePlatformAnnouncement,
} from "#src/api/announcements";
import { AnnouncementFormDrawer } from "./components/AnnouncementFormDrawer";
import { LogQueryPanel } from "../operations/LogTablePanel";

type AnnouncementSort = NonNullable<ListPlatformAnnouncementsInput["sort"]>;

interface AnnouncementFilterValues {
	q?: string;
	status: "all" | PlatformAnnouncementStatus;
}

interface AnnouncementTableState {
	order: ListPlatformAnnouncementsInput["order"];
	page: number;
	pageSize: number;
	sort: ListPlatformAnnouncementsInput["sort"];
}

const defaultAnnouncementFilterValues: AnnouncementFilterValues = {
	status: "all",
};
const announcementQueryFilterFieldCount = 2;
const announcementColumnKeys = [
	"title",
	"status",
	"updatedAt",
	"actions",
] as const;
type AnnouncementColumnKey = (typeof announcementColumnKeys)[number];

const tableSortToContractSort: Record<string, AnnouncementSort> = {
	status: "status",
	title: "title",
	updatedAt: "updated_at",
};

export function AnnouncementsPage() {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const queryClient = useQueryClient();
	const formatPreferences = useLocalePreferences();
	const canManage = usePermission(platformPermissions.announcementsManage);
	const [filterForm] = Form.useForm<AnnouncementFilterValues>();
	const [draftFilters, setDraftFilters] = useState<AnnouncementFilterValues>(
		defaultAnnouncementFilterValues,
	);
	const [filters, setFilters] = useState<AnnouncementFilterValues>(
		defaultAnnouncementFilterValues,
	);
	const [tableState, setTableState] = useState<AnnouncementTableState>({
		order: "desc",
		page: 1,
		pageSize: 20,
		sort: "updated_at",
	});
	const [formOpen, setFormOpen] = useState(false);
	const [editingAnnouncement, setEditingAnnouncement] =
		useState<PlatformAnnouncement | null>(null);
	const [deletingAnnouncement, setDeletingAnnouncement] =
		useState<PlatformAnnouncement | null>(null);
	const [filtersExpanded, setFiltersExpanded] = useState(false);
	const querySubmission = useQuerySubmission();
	const {
		canExpand: canExpandFilters,
		collapsedFieldCount,
		columnSpan: queryFilterSpan,
		containerRef: queryFilterContainerRef,
		formLayout: queryFilterLayout,
		submitterOffset: queryFilterSubmitterOffset,
	} = useQueryFilterLayout({
		expanded: filtersExpanded,
		fieldCount: announcementQueryFilterFieldCount,
	});
	const showStatusFilter = filtersExpanded || collapsedFieldCount >= 2;
	const queryParams = useMemo<ListPlatformAnnouncementsInput>(() => {
		const q = filters.q?.trim();
		const params: ListPlatformAnnouncementsInput = {
			page: tableState.page,
			pageSize: tableState.pageSize,
			...(tableState.order && tableState.sort
				? { order: tableState.order, sort: tableState.sort }
				: {}),
		};

		if (q) {
			params.q = q;
		}
		if (filters.status !== "all") {
			params.status = filters.status;
		}

		return params;
	}, [
		filters.q,
		filters.status,
		tableState.order,
		tableState.page,
		tableState.pageSize,
		tableState.sort,
	]);
	const query = useQuery({
		placeholderData: keepPreviousData,
		queryFn: ({ signal }) => listPlatformAnnouncements(queryParams, signal),
		queryKey: [
			...platformAnnouncementsQueryKey,
			queryParams,
			querySubmission.revision,
		],
	});
	const refreshAnnouncements = () =>
		queryClient.invalidateQueries({ queryKey: platformAnnouncementsQueryKey });
	const saveMutation = useMutation({
		mutationFn: (input: CreatePlatformAnnouncementInput) =>
			editingAnnouncement
				? updatePlatformAnnouncement({
						announcementId: editingAnnouncement.id,
						input,
					})
				: createPlatformAnnouncement(input),
		onSuccess: async () => {
			await refreshAnnouncements();
			setFormOpen(false);
			setEditingAnnouncement(null);
		},
	});
	const deleteMutation = useMutation({
		mutationFn: deletePlatformAnnouncement,
		onSuccess: async () => {
			await refreshAnnouncements();
			setDeletingAnnouncement(null);
		},
	});
	const tableSize = useSyncExternalStore(
		subscribeToPreferenceChanges,
		readUserTableDensityPreference,
		() => defaultPreferences.userTableDensity,
	);
	const [isTableFullscreen, setIsTableFullscreen] = useState(false);
	const [columnOrder, setColumnOrder] = useState<AnnouncementColumnKey[]>([
		...announcementColumnKeys,
	]);
	const [visibleColumnKeys, setVisibleColumnKeys] = useState<
		AnnouncementColumnKey[]
	>([...announcementColumnKeys]);
	const tableWorkspaceRef = useRef<HTMLDivElement>(null);
	const tableMinimumWidth = token.controlHeight * 20;
	const availableColumnKeys = useMemo<readonly AnnouncementColumnKey[]>(
		() =>
			canManage
				? announcementColumnKeys
				: announcementColumnKeys.filter((columnKey) => columnKey !== "actions"),
		[canManage],
	);

	useEffect(() => {
		const syncTableFullscreenState = () => {
			setIsTableFullscreen(
				document.fullscreenElement === tableWorkspaceRef.current,
			);
		};

		document.addEventListener("fullscreenchange", syncTableFullscreenState);
		return () => {
			document.removeEventListener(
				"fullscreenchange",
				syncTableFullscreenState,
			);
		};
	}, []);

	const visibleAvailableColumnKeys = useMemo(
		() =>
			visibleColumnKeys.filter((columnKey) =>
				availableColumnKeys.includes(columnKey),
			),
		[availableColumnKeys, visibleColumnKeys],
	);
	const columns = useMemo<
		NonNullable<TableProps<PlatformAnnouncement>["columns"]>
	>(() => {
		const sortOrder = (column: AnnouncementSort) =>
			tableState.sort === column && tableState.order
				? tableState.order === "asc"
					? "ascend"
					: "descend"
				: null;
		const dataColumns: NonNullable<
			TableProps<PlatformAnnouncement>["columns"]
		> = [
			{
				dataIndex: "title",
				key: "title",
				sortDirections: ["ascend", "descend"],
				sorter: true,
				sortOrder: sortOrder("title"),
				title: t("adminShell.announcements.columns.title"),
				width: token.controlHeight * 8,
			},
			{
				dataIndex: "status",
				key: "status",
				render: (status: PlatformAnnouncementStatus) => (
					<Tag color={status === "published" ? "success" : "default"}>
						{t(`adminShell.announcements.statuses.${status}`)}
					</Tag>
				),
				sortDirections: ["ascend", "descend"],
				sorter: true,
				sortOrder: sortOrder("status"),
				title: t("adminShell.announcements.columns.status"),
				width: token.controlHeight * 3,
			},
			{
				dataIndex: "updatedAt",
				key: "updatedAt",
				render: (value: string) => formatDateTime(value, formatPreferences),
				sortDirections: ["ascend", "descend"],
				sorter: true,
				sortOrder: sortOrder("updated_at"),
				title: t("adminShell.announcements.columns.updatedAt"),
				width: token.controlHeight * 5,
			},
		];

		if (canManage) {
			dataColumns.push({
				key: "actions",
				render: (_: unknown, announcement: PlatformAnnouncement) => (
					<Space size="medium">
						<TableActionButton
							onClick={() => {
								saveMutation.reset();
								setEditingAnnouncement(announcement);
								setFormOpen(true);
							}}
						>
							{t("adminShell.announcements.edit")}
						</TableActionButton>
						<TableActionMenu
							items={[
								{
									danger: true,
									key: "delete",
									label: t("adminShell.announcements.delete"),
									onClick: () => {
										deleteMutation.reset();
										setDeletingAnnouncement(announcement);
									},
								},
							]}
							label={t("adminShell.tableActions.more")}
						/>
					</Space>
				),
				title: t("adminShell.announcements.columns.actions"),
				width: token.controlHeight * 4,
			});
		}

		const dataColumnByKey = new Map(
			dataColumns.map((column) => [
				column.key as AnnouncementColumnKey,
				column,
			]),
		);

		return columnOrder.flatMap((columnKey) => {
			const column = dataColumnByKey.get(columnKey);
			return column && visibleAvailableColumnKeys.includes(columnKey)
				? [column]
				: [];
		});
	}, [
		canManage,
		columnOrder,
		deleteMutation,
		formatPreferences,
		saveMutation,
		t,
		tableState.order,
		tableState.sort,
		token.controlHeight,
		visibleAvailableColumnKeys,
	]);
	const columnSettingsTitle = (
		<Flex align="center" justify="space-between">
			<Checkbox
				checked={availableColumnKeys.every((columnKey) =>
					visibleAvailableColumnKeys.includes(columnKey),
				)}
				onChange={(event) => {
					setVisibleColumnKeys(
						event.target.checked ? [...availableColumnKeys] : ["title"],
					);
				}}
			>
				{t("adminShell.announcements.columnSettings.title")}
			</Checkbox>
			<Button
				onClick={() => {
					setColumnOrder([...announcementColumnKeys]);
					setVisibleColumnKeys([...availableColumnKeys]);
				}}
				size="small"
				type="link"
			>
				{t("adminShell.announcements.columnSettings.reset")}
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
						const nextCheckedKeys = Array.isArray(checkedKeys)
							? checkedKeys
							: checkedKeys.checked;
						setVisibleColumnKeys(
							availableColumnKeys.filter(
								(columnKey) =>
									columnKey === "title" || nextCheckedKeys.includes(columnKey),
							),
						);
					}}
					onDrop={({ dragNode, node, dropPosition }) => {
						const dragKey = dragNode.key;
						const targetKey = node.key;
						const targetPosition = Number(node.pos.split("-").at(-1));

						setColumnOrder((existingOrder) => {
							const nextOrder = existingOrder.filter(
								(columnKey) => columnKey !== dragKey,
							);
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
						.filter((columnKey) => availableColumnKeys.includes(columnKey))
						.map((columnKey) => ({
							disabled: columnKey === "title",
							key: columnKey,
							title: t(`adminShell.announcements.columns.${columnKey}`),
						}))}
				/>
			</ConfigProvider>
		</Flex>
	);
	const applyFilters = () => {
		setFilters(draftFilters);
		setTableState((existingState) => ({ ...existingState, page: 1 }));
		querySubmission.submit();
	};
	const resetFilters = () => {
		setDraftFilters(defaultAnnouncementFilterValues);
		setFilters(defaultAnnouncementFilterValues);
		setTableState((existingState) => ({ ...existingState, page: 1 }));
		querySubmission.submit();
	};
	const changeTableSize: NonNullable<MenuProps["onClick"]> = ({ key }) => {
		if (key === "large" || key === "middle" || key === "small") {
			writeUserTableDensityPreference(key);
		}
	};
	const toggleTableFullscreen = () => {
		const tableWorkspace = tableWorkspaceRef.current;

		if (!tableWorkspace) {
			return;
		}

		if (document.fullscreenElement === tableWorkspace) {
			void document.exitFullscreen?.();
			return;
		}

		void tableWorkspace.requestFullscreen?.();
	};
	const handleTableChange: NonNullable<
		TableProps<PlatformAnnouncement>["onChange"]
	> = (pagination, _filters, sorterState) => {
		const currentSorter = Array.isArray(sorterState)
			? sorterState[0]
			: sorterState;
		const nextSorting = resolveTableSort(
			currentSorter?.columnKey,
			currentSorter?.order,
			tableSortToContractSort,
		);
		setTableState((existingState) => ({
			order: nextSorting.order,
			page: pagination.current ?? existingState.page,
			pageSize: pagination.pageSize ?? existingState.pageSize,
			sort: nextSorting.sort,
		}));
	};

	return (
		<Flex
			gap={token.marginLG}
			ref={tableWorkspaceRef}
			style={
				isTableFullscreen
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
			{query.isError ? (
				<Alert
					action={
						<Button onClick={() => void query.refetch()} size="small">
							{t("adminShell.announcements.retry")}
						</Button>
					}
					description={t("adminShell.announcements.errors.fallback")}
					showIcon
					title={t("adminShell.announcements.errors.load")}
					type="error"
				/>
			) : null}
			<LogQueryPanel<AnnouncementFilterValues>
				actionsTestId="admin-announcements-query-actions"
				canExpand={canExpandFilters}
				columnSpan={queryFilterSpan}
				containerRef={queryFilterContainerRef}
				expanded={filtersExpanded}
				form={filterForm}
				formLayout={queryFilterLayout}
				initialValues={defaultAnnouncementFilterValues}
				loading={query.isFetching && !query.isPending}
				onFinish={applyFilters}
				onReset={resetFilters}
				onToggle={() => setFiltersExpanded((expanded) => !expanded)}
				submitterOffset={queryFilterSubmitterOffset}
				testId="admin-announcements-query-form"
			>
				<Col span={queryFilterSpan}>
					<Form.Item
						label={t("adminShell.announcements.filters.q")}
						style={{ marginBottom: 0 }}
					>
						<Input
							allowClear
							maxLength={100}
							onChange={(event) =>
								setDraftFilters((existingFilters) => ({
									...existingFilters,
									q: event.target.value,
								}))
							}
							placeholder={t("adminShell.announcements.placeholders.query")}
							style={{ width: "100%" }}
							value={draftFilters.q}
						/>
					</Form.Item>
				</Col>
				{showStatusFilter ? (
					<Col span={queryFilterSpan}>
						<Form.Item
							label={t("adminShell.announcements.filters.status")}
							style={{ marginBottom: 0 }}
						>
							<Select
								aria-label={t("adminShell.announcements.filters.status")}
								onChange={(status: AnnouncementFilterValues["status"]) =>
									setDraftFilters((existingFilters) => ({
										...existingFilters,
										status,
									}))
								}
								options={[
									{
										label: t("adminShell.announcements.allStatuses"),
										value: "all",
									},
									{
										label: t("adminShell.announcements.statuses.draft"),
										value: "draft",
									},
									{
										label: t("adminShell.announcements.statuses.published"),
										value: "published",
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
				data-testid="admin-announcements-table-card"
				extra={
					<Space>
						{canManage ? (
							<Button
								icon={<PlusOutlined aria-hidden />}
								onClick={() => {
									saveMutation.reset();
									setEditingAnnouncement(null);
									setFormOpen(true);
								}}
								type="primary"
							>
								{t("adminShell.announcements.create")}
							</Button>
						) : null}
						<Tooltip title={t("adminShell.announcements.reload")}>
							<Button
								aria-label={t("adminShell.announcements.reload")}
								color="default"
								icon={<ReloadOutlined aria-hidden />}
								loading={query.isFetching && !query.isPending}
								onClick={() => void query.refetch()}
								variant="link"
							/>
						</Tooltip>
						<Dropdown
							menu={{
								items: [
									{
										key: "large",
										label: t("adminShell.announcements.densityOptions.large"),
									},
									{
										key: "middle",
										label: t("adminShell.announcements.densityOptions.middle"),
									},
									{
										key: "small",
										label: t("adminShell.announcements.densityOptions.small"),
									},
								],
								onClick: changeTableSize,
								selectedKeys: [tableSize],
							}}
							placement="bottomRight"
							trigger={["click"]}
						>
							<Tooltip title={t("adminShell.announcements.density")}>
								<Button
									aria-label={t("adminShell.announcements.density")}
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
							<Tooltip title={t("adminShell.announcements.tableSettings")}>
								<Button
									aria-label={t("adminShell.announcements.tableSettings")}
									color="default"
									icon={<SettingOutlined aria-hidden />}
									variant="link"
								/>
							</Tooltip>
						</Popover>
						<Tooltip
							title={t(
								isTableFullscreen
									? "adminShell.announcements.exitFullscreen"
									: "adminShell.announcements.fullscreen",
							)}
						>
							<Button
								aria-label={t(
									isTableFullscreen
										? "adminShell.announcements.exitFullscreen"
										: "adminShell.announcements.fullscreen",
								)}
								color="default"
								icon={
									isTableFullscreen ? (
										<FullscreenExitOutlined aria-hidden />
									) : (
										<FullscreenOutlined aria-hidden />
									)
								}
								onClick={toggleTableFullscreen}
								variant="link"
							/>
						</Tooltip>
					</Space>
				}
				styles={{
					header: { minHeight: token.controlHeightLG + token.marginLG },
				}}
				title={t("adminShell.announcements.tableTitle")}
			>
				<Table<PlatformAnnouncement>
					columns={columns}
					dataSource={query.data?.items ?? []}
					loading={query.isFetching}
					locale={{ emptyText: t("adminShell.announcements.empty") }}
					onChange={handleTableChange}
					pagination={{
						current: query.data?.page ?? tableState.page,
						pageSize: query.data?.pageSize ?? tableState.pageSize,
						pageSizeOptions: [10, 20, 50, 100],
						placement: ["bottomEnd"],
						showSizeChanger: true,
						showTotal: (total, [start, end]) =>
							t("adminShell.announcements.paginationTotal", {
								end,
								start,
								total,
							}),
						total: query.data?.total ?? 0,
					}}
					rowKey="id"
					scroll={{ x: tableMinimumWidth }}
					size={tableSize}
					tableLayout="fixed"
				/>
			</Card>

			<AnnouncementFormDrawer
				announcement={editingAnnouncement}
				error={saveMutation.isError}
				loading={saveMutation.isPending}
				onClose={() => {
					saveMutation.reset();
					setFormOpen(false);
					setEditingAnnouncement(null);
				}}
				onSubmit={(values) => saveMutation.mutate(values)}
				open={formOpen}
			/>

			<Modal
				cancelText={t("adminShell.announcements.cancel")}
				confirmLoading={deleteMutation.isPending}
				destroyOnHidden
				onCancel={() => setDeletingAnnouncement(null)}
				onOk={() => {
					if (deletingAnnouncement) {
						deleteMutation.mutate(deletingAnnouncement.id);
					}
				}}
				okButtonProps={{ danger: true }}
				okText={t("adminShell.announcements.confirmDelete")}
				open={deletingAnnouncement !== null}
				title={t("adminShell.announcements.deleteTitle")}
			>
				{deleteMutation.isError ? (
					<Alert
						description={t("adminShell.announcements.errors.fallback")}
						showIcon
						title={t("adminShell.announcements.errors.delete")}
						type="error"
					/>
				) : (
					t("adminShell.announcements.deleteDescription", {
						title: deletingAnnouncement?.title,
					})
				)}
			</Modal>
		</Flex>
	);
}
