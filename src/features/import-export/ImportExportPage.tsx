import {
	DownloadOutlined,
	FileDoneOutlined,
	FileExcelOutlined,
	ReloadOutlined,
	UploadOutlined,
} from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	Alert,
	Button,
	Card,
	Col,
	Flex,
	Progress,
	Result,
	Row,
	Space,
	Statistic,
	Table,
	Tag,
	Typography,
	Upload,
	message,
	theme,
	type TableProps,
	type UploadProps,
} from "antd";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import {
	confirmImportBatch,
	createExportTask,
	downloadExportTask,
	downloadImportTemplate,
	exportTasksQueryKey,
	importTemplatesQueryKey,
	listExportTasks,
	listImportTemplates,
	validateImportFile,
	type ExportTask,
	type ImportPreview,
	type ImportPreviewRow,
	type ImportTemplate,
	type ImportValidationIssue,
} from "#src/api/import-export";

const { Dragger } = Upload;
const { Paragraph, Text } = Typography;
const maxImportFileSize = 5 * 1024 * 1024;
const acceptedImportExtensions = [".csv", ".xlsx"];

function saveTextFile({
	content,
	fileName,
	mimeType,
}: {
	content: string;
	fileName: string;
	mimeType: string;
}) {
	const blob = new Blob([content], { type: mimeType });
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = fileName;
	link.click();
	URL.revokeObjectURL(url);
}

function isAcceptedImportFile(file: File) {
	const fileName = file.name.toLowerCase();
	return acceptedImportExtensions.some((extension) =>
		fileName.endsWith(extension),
	);
}

function getTaskProgressStatus(
	status: ExportTask["status"],
): "active" | "exception" | "normal" | "success" {
	if (status === "failed") return "exception";
	if (status === "succeeded") return "success";
	if (status === "running") return "active";
	return "normal";
}

export function ImportExportPage() {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const [messageApi, messageContext] = message.useMessage();
	const queryClient = useQueryClient();
	const [preview, setPreview] = useState<ImportPreview | null>(null);
	const [result, setResult] = useState<Awaited<
		ReturnType<typeof confirmImportBatch>
	> | null>(null);
	const [fileError, setFileError] = useState<string | null>(null);

	const templatesQuery = useQuery({
		queryFn: ({ signal }) => listImportTemplates(signal),
		queryKey: importTemplatesQueryKey,
	});
	const exportTasksQuery = useQuery({
		queryFn: ({ signal }) => listExportTasks(signal),
		queryKey: exportTasksQueryKey,
		refetchInterval: 1_200,
	});
	const templateDownload = useMutation({
		mutationFn: downloadImportTemplate,
		onError: () =>
			void messageApi.error(t("adminShell.importExport.templateDownloadError")),
		onSuccess: (download) => {
			saveTextFile(download);
			void messageApi.success(t("adminShell.importExport.templateDownloaded"));
		},
	});
	const validateMutation = useMutation({
		mutationFn: validateImportFile,
		onError: () =>
			setFileError(t("adminShell.importExport.importValidateError")),
		onSuccess: (nextPreview) => {
			setPreview(nextPreview);
			setResult(null);
			setFileError(null);
		},
	});
	const confirmMutation = useMutation({
		mutationFn: confirmImportBatch,
		onError: () =>
			void messageApi.error(t("adminShell.importExport.importConfirmError")),
		onSuccess: (nextResult) => {
			setResult(nextResult);
			setPreview((value) => (value ? { ...value, status: "imported" } : value));
		},
	});
	const createExportMutation = useMutation({
		mutationFn: createExportTask,
		onError: () =>
			void messageApi.error(t("adminShell.importExport.exportCreateError")),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: exportTasksQueryKey });
			void messageApi.success(t("adminShell.importExport.exportCreated"));
		},
	});
	const exportDownload = useMutation({
		mutationFn: downloadExportTask,
		onError: () =>
			void messageApi.error(t("adminShell.importExport.exportDownloadError")),
		onSuccess: (download) => {
			saveTextFile(download);
			void messageApi.success(t("adminShell.importExport.exportDownloaded"));
		},
	});

	const previewColumns = useMemo<
		NonNullable<TableProps<ImportPreviewRow>["columns"]>
	>(
		() => [
			{
				dataIndex: "rowNumber",
				key: "rowNumber",
				title: t("adminShell.importExport.preview.columns.rowNumber"),
				width: token.controlHeight * 2,
			},
			{
				dataIndex: "name",
				key: "name",
				title: t("adminShell.importExport.preview.columns.name"),
				width: token.controlHeight * 4,
			},
			{
				dataIndex: "email",
				key: "email",
				title: t("adminShell.importExport.preview.columns.email"),
				width: token.controlHeight * 7,
			},
			{
				dataIndex: "department",
				key: "department",
				title: t("adminShell.importExport.preview.columns.department"),
				width: token.controlHeight * 4,
			},
			{
				dataIndex: "status",
				key: "status",
				render: (status: ImportPreviewRow["status"]) => (
					<Tag color={status === "valid" ? "success" : "error"}>
						{t(`adminShell.importExport.preview.statuses.${status}`)}
					</Tag>
				),
				title: t("adminShell.importExport.preview.columns.status"),
				width: token.controlHeight * 3,
			},
		],
		[t, token.controlHeight],
	);
	const issueColumns = useMemo<
		NonNullable<TableProps<ImportValidationIssue>["columns"]>
	>(
		() => [
			{
				dataIndex: "rowNumber",
				key: "rowNumber",
				title: t("adminShell.importExport.issues.columns.rowNumber"),
				width: token.controlHeight * 2,
			},
			{
				dataIndex: "field",
				key: "field",
				title: t("adminShell.importExport.issues.columns.field"),
				width: token.controlHeight * 3,
			},
			{
				dataIndex: "message",
				key: "message",
				title: t("adminShell.importExport.issues.columns.message"),
				width: token.controlHeight * 7,
			},
			{
				dataIndex: "severity",
				key: "severity",
				render: (severity: ImportValidationIssue["severity"]) => (
					<Tag color={severity === "error" ? "error" : "warning"}>
						{t(`adminShell.importExport.issues.severities.${severity}`)}
					</Tag>
				),
				title: t("adminShell.importExport.issues.columns.severity"),
				width: token.controlHeight * 3,
			},
		],
		[t, token.controlHeight],
	);
	const templateColumns = useMemo<
		NonNullable<TableProps<ImportTemplate>["columns"]>
	>(
		() => [
			{
				dataIndex: "name",
				key: "name",
				title: t("adminShell.importExport.templates.columns.name"),
				width: token.controlHeight * 5,
			},
			{
				dataIndex: "description",
				ellipsis: true,
				key: "description",
				title: t("adminShell.importExport.templates.columns.description"),
				width: token.controlHeight * 8,
			},
			{
				key: "actions",
				render: (_value, template) => (
					<Button
						icon={<DownloadOutlined aria-hidden />}
						loading={
							templateDownload.isPending &&
							templateDownload.variables === template.id
						}
						onClick={() => templateDownload.mutate(template.id)}
						type="link"
					>
						{t("adminShell.importExport.templates.download")}
					</Button>
				),
				title: t("adminShell.importExport.templates.columns.actions"),
				width: token.controlHeight * 4,
			},
		],
		[t, templateDownload, token.controlHeight],
	);
	const exportColumns = useMemo<NonNullable<TableProps<ExportTask>["columns"]>>(
		() => [
			{
				dataIndex: "name",
				key: "name",
				title: t("adminShell.importExport.exports.columns.name"),
				width: token.controlHeight * 5,
			},
			{
				dataIndex: "status",
				key: "status",
				render: (status: ExportTask["status"]) => (
					<Tag
						color={
							status === "succeeded"
								? "success"
								: status === "failed"
									? "error"
									: "processing"
						}
					>
						{t(`adminShell.importExport.exports.statuses.${status}`)}
					</Tag>
				),
				title: t("adminShell.importExport.exports.columns.status"),
				width: token.controlHeight * 3,
			},
			{
				dataIndex: "progress",
				key: "progress",
				render: (progress: number, task) => (
					<Progress
						percent={progress}
						size="small"
						status={getTaskProgressStatus(task.status)}
					/>
				),
				title: t("adminShell.importExport.exports.columns.progress"),
				width: token.controlHeight * 6,
			},
			{
				dataIndex: "errorMessage",
				ellipsis: true,
				key: "errorMessage",
				render: (value?: string) => value || "-",
				title: t("adminShell.importExport.exports.columns.message"),
				width: token.controlHeight * 7,
			},
			{
				key: "actions",
				render: (_value, task) =>
					task.status === "succeeded" ? (
						<Button
							icon={<DownloadOutlined aria-hidden />}
							loading={
								exportDownload.isPending && exportDownload.variables === task.id
							}
							onClick={() => exportDownload.mutate(task.id)}
							type="link"
						>
							{t("adminShell.importExport.exports.download")}
						</Button>
					) : null,
				title: t("adminShell.importExport.exports.columns.actions"),
				width: token.controlHeight * 4,
			},
		],
		[exportDownload, t, token.controlHeight],
	);
	const uploadProps: UploadProps = {
		accept: acceptedImportExtensions.join(","),
		beforeUpload: (file) => {
			if (!isAcceptedImportFile(file)) {
				setFileError(t("adminShell.importExport.fileErrors.type"));
				return Upload.LIST_IGNORE;
			}
			if (file.size > maxImportFileSize) {
				setFileError(t("adminShell.importExport.fileErrors.size"));
				return Upload.LIST_IGNORE;
			}
			validateMutation.mutate({ file });
			return Upload.LIST_IGNORE;
		},
		disabled: validateMutation.isPending,
		maxCount: 1,
		showUploadList: false,
	};

	const createNormalExport = () =>
		createExportMutation.mutate({
			name: t("adminShell.importExport.exports.defaultTaskName"),
		});
	const createFailedExport = () =>
		createExportMutation.mutate({
			name: t("adminShell.importExport.exports.failedTaskName"),
		});

	return (
		<>
			{messageContext}
			<Flex data-testid="import-export-workspace" gap={token.marginLG} vertical>
				<Card>
					<Flex
						align="flex-start"
						gap={token.margin}
						justify="space-between"
						wrap
					>
						<div>
							<Typography.Title level={3} style={{ marginTop: 0 }}>
								{t("adminShell.importExport.title")}
							</Typography.Title>
							<Paragraph type="secondary">
								{t("adminShell.importExport.description")}
							</Paragraph>
						</div>
						<Button
							icon={<ReloadOutlined aria-hidden />}
							loading={templatesQuery.isFetching || exportTasksQuery.isFetching}
							onClick={() => {
								void templatesQuery.refetch();
								void exportTasksQuery.refetch();
							}}
						>
							{t("adminShell.importExport.reload")}
						</Button>
					</Flex>
				</Card>

				<Row gutter={[token.marginLG, token.marginLG]}>
					<Col lg={12} xs={24}>
						<Card
							loading={templatesQuery.isPending}
							title={
								<Space>
									<FileExcelOutlined aria-hidden />
									{t("adminShell.importExport.templates.title")}
								</Space>
							}
						>
							{templatesQuery.isError ? (
								<Alert
									action={
										<Button onClick={() => void templatesQuery.refetch()}>
											{t("adminShell.importExport.retry")}
										</Button>
									}
									description={t(
										"adminShell.importExport.templates.errorFallback",
									)}
									title={t("adminShell.importExport.templates.loadError")}
									showIcon
									type="error"
								/>
							) : (
								<Table<ImportTemplate>
									columns={templateColumns}
									dataSource={templatesQuery.data ?? []}
									locale={{
										emptyText: t("adminShell.importExport.templates.empty"),
									}}
									pagination={false}
									rowKey="id"
									scroll={{ x: token.controlHeight * 17 }}
									size="middle"
								/>
							)}
						</Card>
					</Col>
					<Col lg={12} xs={24}>
						<Card
							title={
								<Space>
									<UploadOutlined aria-hidden />
									{t("adminShell.importExport.import.title")}
								</Space>
							}
						>
							<Dragger {...uploadProps}>
								<p className="ant-upload-drag-icon">
									<UploadOutlined aria-hidden />
								</p>
								<p className="ant-upload-text">
									{t("adminShell.importExport.import.dragTitle")}
								</p>
								<p className="ant-upload-hint">
									{t("adminShell.importExport.import.dragHint")}
								</p>
							</Dragger>
							{fileError ? (
								<Alert
									showIcon
									style={{ marginTop: token.margin }}
									title={fileError}
									type="error"
								/>
							) : null}
							{validateMutation.isPending ? (
								<Alert
									showIcon
									style={{ marginTop: token.margin }}
									title={t("adminShell.importExport.import.validating")}
									type="info"
								/>
							) : null}
						</Card>
					</Col>
				</Row>

				{preview ? (
					<Card
						title={
							<Space>
								<FileDoneOutlined aria-hidden />
								{t("adminShell.importExport.preview.title")}
							</Space>
						}
					>
						<Flex gap={token.marginLG} vertical>
							<Row gutter={[token.margin, token.margin]}>
								<Col sm={8} xs={24}>
									<Statistic
										title={t("adminShell.importExport.preview.totalRows")}
										value={preview.totalRows}
									/>
								</Col>
								<Col sm={8} xs={24}>
									<Statistic
										title={t("adminShell.importExport.preview.validRows")}
										value={preview.validRows}
									/>
								</Col>
								<Col sm={8} xs={24}>
									<Statistic
										title={t("adminShell.importExport.preview.invalidRows")}
										value={preview.invalidRows}
									/>
								</Col>
							</Row>
							<Alert
								description={t("adminShell.importExport.preview.summary", {
									fileName: preview.fileName,
								})}
								title={
									preview.invalidRows > 0
										? t("adminShell.importExport.preview.hasIssues")
										: t("adminShell.importExport.preview.ready")
								}
								showIcon
								type={preview.invalidRows > 0 ? "warning" : "success"}
							/>
							<Table<ImportPreviewRow>
								columns={previewColumns}
								dataSource={preview.rows}
								pagination={false}
								rowKey="id"
								scroll={{ x: token.controlHeight * 20 }}
								size="middle"
							/>
							{preview.issues.length > 0 ? (
								<Table<ImportValidationIssue>
									columns={issueColumns}
									dataSource={preview.issues}
									pagination={false}
									rowKey="id"
									scroll={{ x: token.controlHeight * 15 }}
									size="middle"
									title={() => t("adminShell.importExport.issues.title")}
								/>
							) : null}
							<Flex justify="flex-end">
								<Button
									disabled={
										preview.validRows === 0 || preview.status === "imported"
									}
									loading={confirmMutation.isPending}
									onClick={() =>
										confirmMutation.mutate({ batchId: preview.batchId })
									}
									type="primary"
								>
									{t("adminShell.importExport.import.confirm")}
								</Button>
							</Flex>
						</Flex>
					</Card>
				) : null}

				{result ? (
					<Result
						status="success"
						subTitle={t("adminShell.importExport.result.description", {
							failedRows: result.failedRows,
							importedRows: result.importedRows,
							skippedRows: result.skippedRows,
						})}
						title={t("adminShell.importExport.result.title")}
					/>
				) : null}

				<Card
					title={t("adminShell.importExport.exports.title")}
					extra={
						<Space wrap>
							<Button
								icon={<FileExcelOutlined aria-hidden />}
								loading={createExportMutation.isPending}
								onClick={createNormalExport}
								type="primary"
							>
								{t("adminShell.importExport.exports.create")}
							</Button>
							<Button
								loading={createExportMutation.isPending}
								onClick={createFailedExport}
							>
								{t("adminShell.importExport.exports.createFailed")}
							</Button>
						</Space>
					}
				>
					<Text type="secondary">
						{t("adminShell.importExport.exports.description")}
					</Text>
					{exportTasksQuery.isError ? (
						<Alert
							action={
								<Button onClick={() => void exportTasksQuery.refetch()}>
									{t("adminShell.importExport.retry")}
								</Button>
							}
							description={t("adminShell.importExport.exports.errorFallback")}
							title={t("adminShell.importExport.exports.loadError")}
							showIcon
							style={{ marginTop: token.margin }}
							type="error"
						/>
					) : exportTasksQuery.data?.length === 0 ? (
						<Result
							status="info"
							subTitle={t("adminShell.importExport.exports.emptyDescription")}
							title={t("adminShell.importExport.exports.empty")}
						/>
					) : (
						<Table<ExportTask>
							columns={exportColumns}
							dataSource={exportTasksQuery.data ?? []}
							loading={exportTasksQuery.isPending}
							pagination={false}
							rowKey="id"
							scroll={{ x: token.controlHeight * 25 }}
							size="middle"
							style={{ marginTop: token.margin }}
						/>
					)}
				</Card>
			</Flex>
		</>
	);
}
