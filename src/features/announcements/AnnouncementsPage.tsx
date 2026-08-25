import {
	DeleteOutlined,
	EditOutlined,
	PlusOutlined,
	ReloadOutlined,
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
	Col,
	Flex,
	Form,
	Input,
	Modal,
	Row,
	Select,
	Space,
	Table,
	Tag,
	theme,
	Tooltip,
} from "antd";
import type { TableColumnsType, TableProps } from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { formatDateTime } from "../../app/formatting";
import { useLocalePreferences } from "../../app/localePreferences";
import { platformPermissions, usePermission } from "../../app/permissions";
import {
	useQueryFilterLayout,
	useQuerySubmission,
} from "../../app/queryFilterLayout";
import { QueryFilterSubmitter } from "../../app/QueryFilterSubmitter";
import { resolveTableSort } from "../../app/tableSorting";
import { TableActionButton } from "../../app/TableActionButton";
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

type AnnouncementSort = NonNullable<ListPlatformAnnouncementsInput["sort"]>;
type SortOrder = NonNullable<ListPlatformAnnouncementsInput["order"]>;

interface AnnouncementFilterValues {
	q?: string;
	status: "all" | PlatformAnnouncementStatus;
}

const tableSortToContractSort: Record<string, AnnouncementSort> = {
	status: "status",
	title: "title",
	updated_at: "updated_at",
};

export function AnnouncementsPage() {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const queryClient = useQueryClient();
	const formatPreferences = useLocalePreferences();
	const canManage = usePermission(platformPermissions.announcementsManage);
	const [filterForm] = Form.useForm<AnnouncementFilterValues>();
	const [filters, setFilters] = useState<
		Omit<ListPlatformAnnouncementsInput, "page" | "pageSize">
	>({});
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);
	const [sort, setSort] = useState<AnnouncementSort | undefined>("updated_at");
	const [order, setOrder] = useState<SortOrder | undefined>("desc");
	const [formOpen, setFormOpen] = useState(false);
	const [editingAnnouncement, setEditingAnnouncement] =
		useState<PlatformAnnouncement | null>(null);
	const [deletingAnnouncement, setDeletingAnnouncement] =
		useState<PlatformAnnouncement | null>(null);
	const querySubmission = useQuerySubmission();
	const {
		columnSpan,
		containerRef: queryFilterContainerRef,
		formLayout: queryFilterLayout,
		submitterOffset,
	} = useQueryFilterLayout({ expanded: true, fieldCount: 2 });
	const query = useQuery({
		placeholderData: keepPreviousData,
		queryFn: ({ signal }) =>
			listPlatformAnnouncements(
				{
					...filters,
					page,
					pageSize,
					...(order && sort ? { order, sort } : {}),
				},
				signal,
			),
		queryKey: [
			...platformAnnouncementsQueryKey,
			filters,
			order,
			page,
			pageSize,
			querySubmission.revision,
			sort,
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
	const sortOrder = (column: AnnouncementSort) =>
		sort === column && order ? (order === "asc" ? "ascend" : "descend") : null;
	const columns: TableColumnsType<PlatformAnnouncement> = [
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
			key: "updated_at",
			render: (value: string) => formatDateTime(value, formatPreferences),
			sortDirections: ["ascend", "descend"],
			sorter: true,
			sortOrder: sortOrder("updated_at"),
			title: t("adminShell.announcements.columns.updatedAt"),
			width: token.controlHeight * 5,
		},
		...(canManage
			? [
					{
						key: "actions",
						render: (_: unknown, announcement: PlatformAnnouncement) => (
							<Space>
								<TableActionButton
									icon={<EditOutlined aria-hidden />}
									onClick={() => {
										saveMutation.reset();
										setEditingAnnouncement(announcement);
										setFormOpen(true);
									}}
								>
									{t("adminShell.announcements.edit")}
								</TableActionButton>
								<TableActionButton
									danger
									icon={<DeleteOutlined aria-hidden />}
									onClick={() => {
										deleteMutation.reset();
										setDeletingAnnouncement(announcement);
									}}
								>
									{t("adminShell.announcements.delete")}
								</TableActionButton>
							</Space>
						),
						title: t("adminShell.announcements.columns.actions"),
						width: token.controlHeight * 4,
					},
				]
			: []),
	];

	const applyFilters = (values: AnnouncementFilterValues) => {
		setFilters({
			...(values.q?.trim() ? { q: values.q.trim() } : {}),
			...(values.status !== "all" ? { status: values.status } : {}),
		});
		setPage(1);
		querySubmission.submit();
	};
	const resetFilters = () => {
		filterForm.resetFields();
		setFilters({});
		setPage(1);
		querySubmission.submit();
	};
	const handleTableChange: NonNullable<
		TableProps<PlatformAnnouncement>["onChange"]
	> = (_, __, sorterState, extra) => {
		if (extra.action !== "sort") {
			return;
		}

		const currentSorter = Array.isArray(sorterState)
			? sorterState[0]
			: sorterState;
		const nextSorting = resolveTableSort(
			currentSorter?.columnKey,
			currentSorter?.order,
			tableSortToContractSort,
		);
		setSort(nextSorting.sort);
		setOrder(nextSorting.order);
		setPage(1);
	};

	return (
		<Flex gap={token.marginLG} vertical>
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
			<Card>
				<div ref={queryFilterContainerRef}>
					<Form<AnnouncementFilterValues>
						form={filterForm}
						initialValues={{ status: "all" }}
						{...(queryFilterLayout === "horizontal"
							? {
									labelCol: {
										flex: `0 0 ${token.controlHeightLG * 2}px`,
									},
									wrapperCol: {
										style: {
											maxWidth: `calc(100% - ${token.controlHeightLG * 2}px)`,
										},
									},
								}
							: {})}
						layout={queryFilterLayout}
						onFinish={applyFilters}
					>
						<Row gutter={token.marginLG}>
							<Col span={columnSpan}>
								<Form.Item
									label={t("adminShell.announcements.filters.q")}
									name="q"
									style={{ marginBottom: 0 }}
								>
									<Input
										allowClear
										maxLength={100}
										placeholder={t(
											"adminShell.announcements.placeholders.query",
										)}
									/>
								</Form.Item>
							</Col>
							<Col span={columnSpan}>
								<Form.Item
									label={t("adminShell.announcements.filters.status")}
									name="status"
									style={{ marginBottom: 0 }}
								>
									<Select
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
									/>
								</Form.Item>
							</Col>
							<Col
								offset={submitterOffset}
								span={columnSpan}
								style={{ textAlign: "end" }}
							>
								<Form.Item colon={false} label=" " style={{ marginBottom: 0 }}>
									<QueryFilterSubmitter
										loading={query.isFetching && !query.isPending}
										onReset={resetFilters}
										queryText={t("adminShell.announcements.query")}
										resetText={t("adminShell.announcements.reset")}
									/>
								</Form.Item>
							</Col>
						</Row>
					</Form>
				</div>
			</Card>

			<Card
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
								icon={<ReloadOutlined aria-hidden />}
								loading={query.isFetching && !query.isPending}
								onClick={() => void query.refetch()}
								type="text"
							/>
						</Tooltip>
					</Space>
				}
				title={t("adminShell.announcements.tableTitle")}
			>
				<Table<PlatformAnnouncement>
					columns={columns}
					dataSource={query.data?.items ?? []}
					loading={query.isFetching}
					locale={{ emptyText: t("adminShell.announcements.empty") }}
					onChange={handleTableChange}
					pagination={{
						current: query.data?.page ?? page,
						onChange: (nextPage, nextPageSize) => {
							setPage(nextPageSize === pageSize ? nextPage : 1);
							setPageSize(nextPageSize);
						},
						pageSize: query.data?.pageSize ?? pageSize,
						pageSizeOptions: [10, 20, 50],
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
					scroll={{ x: token.controlHeight * 20 }}
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
