import { DeleteOutlined, UploadOutlined } from "@ant-design/icons";
import {
	keepPreviousData,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import {
	Alert,
	Button,
	Col,
	Form,
	Input,
	Modal,
	Select,
	Tag,
	Upload,
	message,
	theme,
	Typography,
	type TableProps,
} from "antd";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import {
	deletePlatformFile,
	listPlatformFiles,
	platformFilesQueryKey,
	uploadPlatformFile,
	type ListPlatformFilesInput,
	type PlatformFile,
} from "#src/api/files";
import { TableActionButton } from "../../app/TableActionButton";
import {
	useQueryFilterLayout,
	useQuerySubmission,
} from "../../app/queryFilterLayout";
import { resolveTableSort } from "../../app/tableSorting";
import { LogQueryPanel, LogTablePanel } from "../operations/LogTablePanel";

const { Text } = Typography;

interface FileFilterValues {
	q?: string;
	type: string;
}
interface FileTableState {
	order: ListPlatformFilesInput["order"];
	page: number;
	pageSize: number;
	sort: ListPlatformFilesInput["sort"];
}
const defaultFilters: FileFilterValues = { type: "all" };
const fileSortMap = {
	createdAt: "created_at",
	name: "name",
	size: "size",
} as const;

function formatFileSize(size: number) {
	if (size < 1024) return `${size} B`;
	if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
	return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

export function FileManagementPage() {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const [messageApi, messageContext] = message.useMessage();
	const queryClient = useQueryClient();
	const [form] = Form.useForm<FileFilterValues>();
	const [draft, setDraft] = useState<FileFilterValues>(defaultFilters);
	const [filters, setFilters] = useState<FileFilterValues>(defaultFilters);
	const [expanded, setExpanded] = useState(false);
	const [deleting, setDeleting] = useState<PlatformFile | null>(null);
	const [tableState, setTableState] = useState<FileTableState>({
		order: "desc",
		page: 1,
		pageSize: 10,
		sort: "created_at",
	});
	const submission = useQuerySubmission();
	const layout = useQueryFilterLayout({ expanded, fieldCount: 2 });
	const showType = expanded || layout.collapsedFieldCount >= 2;
	const params = useMemo<ListPlatformFilesInput>(
		() => ({
			page: tableState.page,
			pageSize: tableState.pageSize,
			...(filters.q?.trim() ? { q: filters.q.trim() } : {}),
			...(filters.type !== "all" ? { type: filters.type } : {}),
			...(tableState.sort && tableState.order
				? { sort: tableState.sort, order: tableState.order }
				: {}),
		}),
		[filters, tableState],
	);
	const query = useQuery({
		placeholderData: keepPreviousData,
		queryFn: ({ signal }) => listPlatformFiles(params, signal),
		queryKey: [...platformFilesQueryKey, params, submission.revision],
	});
	const refresh = () =>
		queryClient.invalidateQueries({ queryKey: platformFilesQueryKey });
	const uploadMutation = useMutation({
		mutationFn: uploadPlatformFile,
		onError: () => void messageApi.error(t("adminShell.files.uploadError")),
		onSuccess: async () => {
			await refresh();
			void messageApi.success(t("adminShell.files.uploadSuccess"));
		},
	});
	const deleteMutation = useMutation({
		mutationFn: deletePlatformFile,
		onSuccess: async () => {
			await refresh();
			setDeleting(null);
		},
	});
	const columns: NonNullable<TableProps<PlatformFile>["columns"]> = [
		{
			dataIndex: "name",
			key: "name",
			sortDirections: ["ascend", "descend"],
			sorter: true,
			title: t("adminShell.files.columns.name"),
			width: token.controlHeight * 7,
		},
		{
			dataIndex: "type",
			ellipsis: { showTitle: false },
			key: "type",
			render: (value: string) => (
				<Tag style={{ maxWidth: "100%" }} title={value}>
					{value}
				</Tag>
			),
			title: t("adminShell.files.columns.type"),
			width: token.controlHeight * 6,
		},
		{
			dataIndex: "size",
			key: "size",
			render: formatFileSize,
			sortDirections: ["ascend", "descend"],
			sorter: true,
			title: t("adminShell.files.columns.size"),
			width: token.controlHeight * 3,
		},
		{
			dataIndex: "uploader",
			key: "uploader",
			title: t("adminShell.files.columns.uploader"),
			width: token.controlHeight * 4,
		},
		{
			dataIndex: "createdAt",
			key: "createdAt",
			render: (value: string) => new Date(value).toLocaleString(),
			sortDirections: ["ascend", "descend"],
			sorter: true,
			title: t("adminShell.files.columns.createdAt"),
			width: token.controlHeight * 5,
		},
		{
			key: "actions",
			render: (_value, file) => (
				<TableActionButton
					danger
					icon={<DeleteOutlined />}
					onClick={() => setDeleting(file)}
				>
					{t("adminShell.files.delete")}
				</TableActionButton>
			),
			title: t("adminShell.files.columns.actions"),
			width: token.controlHeight * 3,
		},
	];
	const applyFilters = () => {
		setFilters(draft);
		setTableState((value) => ({ ...value, page: 1 }));
		submission.submit();
	};
	const resetFilters = () => {
		form.resetFields();
		setDraft(defaultFilters);
		setFilters(defaultFilters);
		setTableState((value) => ({ ...value, page: 1 }));
		submission.submit();
	};
	const onTableChange: NonNullable<TableProps<PlatformFile>["onChange"]> = (
		pagination,
		_filters,
		sorterState,
	) => {
		const sorter = Array.isArray(sorterState) ? sorterState[0] : sorterState;
		const next = resolveTableSort(
			sorter?.columnKey,
			sorter?.order,
			fileSortMap,
		);
		setTableState((value) => ({
			order: next.order,
			page: pagination.current ?? value.page,
			pageSize: pagination.pageSize ?? value.pageSize,
			sort: next.sort,
		}));
	};
	const queryPanel = (
		<LogQueryPanel<FileFilterValues>
			actionsTestId="file-management-query-actions"
			canExpand={layout.canExpand}
			columnSpan={layout.columnSpan}
			containerRef={layout.containerRef}
			expanded={expanded}
			form={form}
			formLayout={layout.formLayout}
			initialValues={defaultFilters}
			loading={query.isFetching && !query.isPending}
			onFinish={applyFilters}
			onReset={resetFilters}
			onToggle={() => setExpanded((value) => !value)}
			submitterOffset={layout.submitterOffset}
			testId="file-management-query-form"
		>
			<Col span={layout.columnSpan}>
				<Form.Item
					label={t("adminShell.files.filters.q")}
					style={{ marginBottom: 0 }}
				>
					<Input
						allowClear
						onChange={(event) =>
							setDraft((value) => ({ ...value, q: event.target.value }))
						}
						placeholder={t("adminShell.files.searchPlaceholder")}
						value={draft.q}
					/>
				</Form.Item>
			</Col>
			{showType ? (
				<Col span={layout.columnSpan}>
					<Form.Item
						label={t("adminShell.files.filters.type")}
						style={{ marginBottom: 0 }}
					>
						<Select
							aria-label={t("adminShell.files.filters.type")}
							onChange={(type) => setDraft((value) => ({ ...value, type }))}
							options={[
								{ label: t("adminShell.files.types.all"), value: "all" },
								{ label: t("adminShell.files.types.image"), value: "image/" },
								{ label: "PDF", value: "application/pdf" },
								{ label: t("adminShell.files.types.text"), value: "text/" },
							]}
							value={draft.type}
						/>
					</Form.Item>
				</Col>
			) : null}
		</LogQueryPanel>
	);

	return (
		<>
			{messageContext}
			<LogTablePanel
				columns={columns}
				dataSource={query.data?.items ?? []}
				description={
					<Text type="secondary">
						{t("adminShell.files.fakeOnlyDescription")}
					</Text>
				}
				emptyText={t("adminShell.files.empty")}
				error={query.error}
				errorFallback={t("adminShell.files.errorFallback")}
				errorTitle={t("adminShell.files.loadError")}
				initialLoading={query.isPending}
				minimumWidth={token.controlHeight * 28}
				onPageChange={(page, pageSize) =>
					setTableState((value) => ({ ...value, page, pageSize }))
				}
				onReload={() => void query.refetch()}
				onTableChange={onTableChange}
				page={query.data?.page ?? tableState.page}
				pageSize={query.data?.pageSize ?? tableState.pageSize}
				primaryAction={
					<Upload
						accept=".pdf,.png,.jpg,.jpeg,.txt,.csv,.doc,.docx,.xls,.xlsx"
						beforeUpload={(file) => {
							uploadMutation.mutate({ file });
							return Upload.LIST_IGNORE;
						}}
						disabled={uploadMutation.isPending}
						maxCount={1}
						showUploadList={false}
					>
						<Button
							aria-label={t("adminShell.files.chooseFile")}
							icon={<UploadOutlined />}
							loading={uploadMutation.isPending}
							type="primary"
						>
							{t("adminShell.files.upload")}
						</Button>
					</Upload>
				}
				queryPanel={queryPanel}
				refreshing={query.isFetching && !query.isPending}
				testId="file-management-table"
				title={t("adminShell.files.title")}
				total={query.data?.total ?? 0}
				workspaceTestId="file-management-workspace"
			/>
			<Modal
				cancelText={t("adminShell.files.cancel")}
				confirmLoading={deleteMutation.isPending}
				onCancel={() => {
					setDeleting(null);
					deleteMutation.reset();
				}}
				onOk={() => deleting && deleteMutation.mutate(deleting.id)}
				okButtonProps={{ danger: true }}
				okText={t("adminShell.files.confirmDelete")}
				open={Boolean(deleting)}
				title={t("adminShell.files.deleteTitle")}
			>
				{deleteMutation.isError ? (
					<Alert
						title={t("adminShell.files.deleteError")}
						showIcon
						type="error"
					/>
				) : (
					t("adminShell.files.deleteDescription", { name: deleting?.name })
				)}
			</Modal>
		</>
	);
}
