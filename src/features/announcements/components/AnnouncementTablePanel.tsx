import {
	ColumnHeightOutlined,
	FullscreenExitOutlined,
	FullscreenOutlined,
	PlusOutlined,
	ReloadOutlined,
	SettingOutlined,
} from "@ant-design/icons";
import {
	Button,
	Card,
	Checkbox,
	ConfigProvider,
	Dropdown,
	Flex,
	type MenuProps,
	Popover,
	Space,
	Table,
	Tag,
	theme,
	Tooltip,
	Tree,
} from "antd";
import type { TableProps } from "antd";
import { useMemo, useRef, useSyncExternalStore } from "react";
import { useTranslation } from "react-i18next";

import { formatDateTime } from "../../../app/formatting";
import { useLocalePreferences } from "../../../app/localePreferences";
import {
	defaultPreferences,
	getTableColumnSettingsStorageKey,
	readUserTableDensityPreference,
	subscribeToPreferenceChanges,
	writeUserTableDensityPreference,
} from "../../../app/preferenceStorage";
import { resolveTableSort } from "../../../app/tableSorting";
import {
	type ResponsiveTableColumnConfig,
	useResponsiveTableColumns,
} from "../../../app/tableColumnVisibility";
import { TableActionButton } from "../../../app/TableActionButton";
import type {
	ListPlatformAnnouncementsInput,
	PlatformAnnouncement,
	PlatformAnnouncementStatus,
} from "#src/api/announcements";

type AnnouncementSort = NonNullable<ListPlatformAnnouncementsInput["sort"]>;

export interface AnnouncementTableState {
	order: ListPlatformAnnouncementsInput["order"];
	page: number;
	pageSize: number;
	sort: ListPlatformAnnouncementsInput["sort"];
}

interface AnnouncementTableData {
	items: PlatformAnnouncement[];
	page: number;
	pageSize: number;
	total: number;
}

interface AnnouncementTablePanelProps {
	canManage: boolean;
	data: AnnouncementTableData | undefined;
	isFullscreen: boolean;
	loading: boolean;
	onChange: (state: AnnouncementTableState) => void;
	onCreate: () => void;
	onDelete: (announcement: PlatformAnnouncement) => void;
	onEdit: (announcement: PlatformAnnouncement) => void;
	onReload: () => void;
	onToggleFullscreen: () => void;
	refreshing: boolean;
	tableState: AnnouncementTableState;
}

const columnKeys = ["title", "status", "updatedAt", "actions"] as const;
type AnnouncementColumnKey = (typeof columnKeys)[number];
const announcementColumnVisibility: readonly ResponsiveTableColumnConfig<AnnouncementColumnKey>[] =
	[
		{ key: "title", priority: "compact", required: true },
		{ key: "status", priority: "compact" },
		{ key: "updatedAt", priority: "regular" },
		{ key: "actions", priority: "compact", required: true },
	];

const tableSortToContractSort: Record<string, AnnouncementSort> = {
	status: "status",
	title: "title",
	updatedAt: "updated_at",
};

export function AnnouncementTablePanel({
	canManage,
	data,
	isFullscreen,
	loading,
	onChange,
	onCreate,
	onDelete,
	onEdit,
	onReload,
	onToggleFullscreen,
	refreshing,
	tableState,
}: AnnouncementTablePanelProps) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const formatPreferences = useLocalePreferences();
	const tableSize = useSyncExternalStore(
		subscribeToPreferenceChanges,
		readUserTableDensityPreference,
		() => defaultPreferences.userTableDensity,
	);
	const tableContainerRef = useRef<HTMLDivElement>(null);
	const availableColumnKeys = useMemo<readonly AnnouncementColumnKey[]>(
		() =>
			canManage
				? columnKeys
				: columnKeys.filter((columnKey) => columnKey !== "actions"),
		[canManage],
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
						<TableActionButton onClick={() => onEdit(announcement)}>
							{t("adminShell.announcements.edit")}
						</TableActionButton>
						<TableActionButton danger onClick={() => onDelete(announcement)}>
							{t("adminShell.announcements.delete")}
						</TableActionButton>
					</Space>
				),
				title: t("adminShell.announcements.columns.actions"),
				width: token.controlHeight * 4,
			});
		}

		return dataColumns;
	}, [
		canManage,
		formatPreferences,
		onDelete,
		onEdit,
		t,
		tableState.order,
		tableState.sort,
		token.controlHeight,
	]);
	const tableColumns = useResponsiveTableColumns<
		PlatformAnnouncement,
		AnnouncementColumnKey
	>({
		availableColumnKeys,
		columnKeys,
		columns,
		configs: announcementColumnVisibility,
		containerRef: tableContainerRef,
		storageKey: getTableColumnSettingsStorageKey("announcements"),
	});
	const columnSettingsTitle = (
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
				{t("adminShell.announcements.columnSettings.title")}
			</Checkbox>
			<Button
				onClick={() => {
					tableColumns.resetColumnSettings();
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
					checkedKeys={tableColumns.visibleColumnKeys}
					draggable
					onCheck={(checkedKeys) => {
						const nextCheckedKeys = Array.isArray(checkedKeys)
							? checkedKeys
							: checkedKeys.checked;
						tableColumns.setVisibleColumnKeys(
							tableColumns.availableColumnKeys.filter((columnKey) =>
								nextCheckedKeys.includes(columnKey),
							),
						);
					}}
					onDrop={({ dragNode, node, dropPosition }) => {
						const dragKey = dragNode.key;
						const targetKey = node.key;
						const targetPosition = Number(node.pos.split("-").at(-1));

						tableColumns.setColumnOrder((existingOrder) => {
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
					treeData={tableColumns.columnOrder.map((columnKey) => ({
						disabled: tableColumns.requiredColumnKeys.some(
							(requiredKey) => requiredKey === columnKey,
						),
						key: columnKey,
						title: t(`adminShell.announcements.columns.${columnKey}`),
					}))}
				/>
			</ConfigProvider>
		</Flex>
	);
	const changeTableSize: NonNullable<MenuProps["onClick"]> = ({ key }) => {
		if (key === "large" || key === "middle" || key === "small") {
			writeUserTableDensityPreference(key);
		}
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
		onChange({
			order: nextSorting.order,
			page: pagination.current ?? tableState.page,
			pageSize: pagination.pageSize ?? tableState.pageSize,
			sort: nextSorting.sort,
		});
	};

	return (
		<div ref={tableContainerRef}>
			<Card
				data-testid="admin-announcements-table-card"
				extra={
					<Space>
						{canManage ? (
							<Button
								icon={<PlusOutlined aria-hidden />}
								onClick={onCreate}
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
								loading={refreshing}
								onClick={onReload}
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
								isFullscreen
									? "adminShell.announcements.exitFullscreen"
									: "adminShell.announcements.fullscreen",
							)}
						>
							<Button
								aria-label={t(
									isFullscreen
										? "adminShell.announcements.exitFullscreen"
										: "adminShell.announcements.fullscreen",
								)}
								color="default"
								icon={
									isFullscreen ? (
										<FullscreenExitOutlined aria-hidden />
									) : (
										<FullscreenOutlined aria-hidden />
									)
								}
								onClick={onToggleFullscreen}
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
					columns={tableColumns.visibleColumns}
					dataSource={data?.items ?? []}
					loading={loading}
					locale={{ emptyText: t("adminShell.announcements.empty") }}
					onChange={handleTableChange}
					pagination={{
						current: data?.page ?? tableState.page,
						pageSize: data?.pageSize ?? tableState.pageSize,
						pageSizeOptions: [10, 20, 50, 100],
						placement: ["bottomEnd"],
						showSizeChanger: true,
						showTotal: (total, [start, end]) =>
							t("adminShell.announcements.paginationTotal", {
								end,
								start,
								total,
							}),
						total: data?.total ?? 0,
					}}
					rowKey="id"
					scroll={{ x: tableColumns.minimumWidth }}
					size={tableSize}
					tableLayout="fixed"
				/>
			</Card>
		</div>
	);
}
