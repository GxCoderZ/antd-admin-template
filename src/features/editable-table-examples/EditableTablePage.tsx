import { PlusOutlined } from "@ant-design/icons";
import {
	Alert,
	Button,
	Col,
	Form,
	Input,
	InputNumber,
	Popconfirm,
	Progress,
	Select,
	Space,
	Tag,
	theme,
} from "antd";
import type { TableColumnsType, TableProps } from "antd";
import {
	keepPreviousData,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import type { HTMLAttributes, ReactNode } from "react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { formatDateTime } from "../../app/formatting";
import { useLocalePreferences } from "../../app/localePreferences";
import { getTableColumnSettingsStorageKey } from "../../app/preferenceStorage";
import {
	useQueryFilterLayout,
	useQuerySubmission,
} from "../../app/queryFilterLayout";
import { useRouteSessionState } from "../../app/routeSessionState";
import type { ResponsiveTableColumnConfig } from "../../app/tableColumnVisibility";
import { resolveTableSort } from "../../app/tableSorting";
import {
	createEditableTableRow,
	deleteEditableTableRow,
	editableTableRowsQueryKey,
	type EditableTableRow,
	type EditableTableRowStatus,
	listEditableTableRows,
	type ListEditableTableRowsInput,
	type SaveEditableTableRowInput,
	updateEditableTableRow,
} from "#src/api/editable-table-examples";
import { LogQueryPanel, LogTablePanel } from "../operations/LogTablePanel";

type EditableTableSort = NonNullable<ListEditableTableRowsInput["sort"]>;
interface EditableTableFilterValues {
	q?: string;
	status: "all" | EditableTableRowStatus;
}

interface EditableTableState {
	order: ListEditableTableRowsInput["order"];
	page: number;
	pageSize: number;
	sort: ListEditableTableRowsInput["sort"];
}

type EditableTableFormValues = SaveEditableTableRowInput;

interface EditableCellProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
	children: ReactNode;
	dataIndex: keyof EditableTableFormValues;
	editing: boolean;
	inputType: "number" | "select" | "text";
	title: ReactNode;
}

const newRowId = "__editable-table-new-row__";
const editableTableRouteKey = "/examples/lists/editable-table";
const defaultEditableFilters: EditableTableFilterValues = { status: "all" };
const defaultEditableTableState: EditableTableState = {
	order: "desc",
	page: 1,
	pageSize: 20,
	sort: "updated_at",
};
const columnVisibility: readonly ResponsiveTableColumnConfig<string>[] = [
	{ key: "name", priority: "compact", required: true },
	{ key: "owner", priority: "compact" },
	{ key: "status", priority: "compact" },
	{ key: "priority", priority: "regular" },
	{ key: "progress", priority: "regular" },
	{ key: "updatedAt", priority: "spacious" },
	{ key: "actions", priority: "compact", required: true },
];
const tableSortToContractSort: Record<string, EditableTableSort> = {
	name: "name",
	owner: "owner",
	priority: "priority",
	progress: "progress",
	status: "status",
	updatedAt: "updated_at",
};

function EditableCell({
	children,
	dataIndex,
	editing,
	inputType,
	title,
	...restProps
}: EditableCellProps) {
	const { t } = useTranslation();
	const inputNode =
		inputType === "number" ? (
			<InputNumber style={{ width: "100%" }} />
		) : inputType === "select" ? (
			<Select
				options={[
					{
						label: t("adminShell.editableTable.statuses.draft"),
						value: "draft",
					},
					{
						label: t("adminShell.editableTable.statuses.active"),
						value: "active",
					},
					{
						label: t("adminShell.editableTable.statuses.paused"),
						value: "paused",
					},
				]}
			/>
		) : (
			<Input />
		);
	const rules =
		dataIndex === "priority"
			? [
					{
						required: true,
						type: "integer" as const,
						min: 1,
						max: 999,
						message: t("adminShell.editableTable.validation.priority"),
					},
				]
			: dataIndex === "progress"
				? [
						{
							required: true,
							type: "integer" as const,
							min: 0,
							max: 100,
							message: t("adminShell.editableTable.validation.progress"),
						},
					]
				: [
						{
							required: true,
							whitespace: true,
							message: t("adminShell.editableTable.validation.required", {
								field: title,
							}),
						},
					];

	return (
		<td {...restProps}>
			{editing ? (
				<Form.Item name={dataIndex} rules={rules} style={{ margin: 0 }}>
					{inputNode}
				</Form.Item>
			) : (
				children
			)}
		</td>
	);
}

function statusColor(status: EditableTableRowStatus) {
	if (status === "active") {
		return "success";
	}
	if (status === "paused") {
		return "warning";
	}
	return "default";
}

function EditableTableQueryPanel({
	draftFilters,
	expanded,
	initialFilters,
	loading,
	onApply,
	onDraftFiltersChange,
	onExpandedChange,
	onReset,
}: {
	draftFilters: EditableTableFilterValues;
	expanded: boolean;
	initialFilters: EditableTableFilterValues;
	loading: boolean;
	onApply: (filters: EditableTableFilterValues) => void;
	onDraftFiltersChange: (filters: EditableTableFilterValues) => void;
	onExpandedChange: (expanded: boolean) => void;
	onReset: () => void;
}) {
	const { t } = useTranslation();
	const [form] = Form.useForm<EditableTableFilterValues>();
	const {
		canExpand,
		collapsedFieldCount,
		columnSpan,
		containerRef,
		formLayout,
		submitterOffset,
	} = useQueryFilterLayout({ expanded, fieldCount: 2 });
	const showStatusFilter = expanded || collapsedFieldCount >= 2;

	return (
		<LogQueryPanel<EditableTableFilterValues>
			actionsTestId="editable-table-query-actions"
			canExpand={canExpand}
			columnSpan={columnSpan}
			containerRef={containerRef}
			expanded={expanded}
			form={form}
			formLayout={formLayout}
			initialValues={initialFilters}
			loading={loading}
			onFinish={() => onApply(draftFilters)}
			onReset={() => {
				onDraftFiltersChange(initialFilters);
				form.setFieldsValue(initialFilters);
				onReset();
			}}
			onToggle={() => onExpandedChange(!expanded)}
			submitterOffset={submitterOffset}
			testId="editable-table-query-form"
		>
			<Col span={columnSpan}>
				<Form.Item
					label={t("adminShell.editableTable.filters.q")}
					name="q"
					style={{ marginBottom: 0 }}
				>
					<Input
						allowClear
						maxLength={100}
						onChange={(event) =>
							onDraftFiltersChange({
								...draftFilters,
								q: event.target.value,
							})
						}
						placeholder={t("adminShell.editableTable.placeholders.query")}
						style={{ width: "100%" }}
						value={draftFilters.q}
					/>
				</Form.Item>
			</Col>
			{showStatusFilter ? (
				<Col span={columnSpan}>
					<Form.Item
						label={t("adminShell.editableTable.filters.status")}
						name="status"
						style={{ marginBottom: 0 }}
					>
						<Select
							aria-label={t("adminShell.editableTable.filters.status")}
							onChange={(status: EditableTableFilterValues["status"]) =>
								onDraftFiltersChange({
									...draftFilters,
									status,
								})
							}
							options={[
								{
									label: t("adminShell.editableTable.allStatuses"),
									value: "all",
								},
								{
									label: t("adminShell.editableTable.statuses.draft"),
									value: "draft",
								},
								{
									label: t("adminShell.editableTable.statuses.active"),
									value: "active",
								},
								{
									label: t("adminShell.editableTable.statuses.paused"),
									value: "paused",
								},
							]}
							style={{ width: "100%" }}
							value={draftFilters.status}
						/>
					</Form.Item>
				</Col>
			) : null}
		</LogQueryPanel>
	);
}

export function EditableTablePage() {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const [form] = Form.useForm<EditableTableFormValues>();
	const queryClient = useQueryClient();
	const formatPreferences = useLocalePreferences();
	const [draftFilters, setDraftFilters] =
		useRouteSessionState<EditableTableFilterValues>({
			initialState: defaultEditableFilters,
			routeKey: editableTableRouteKey,
			stateKey: "query-draft",
		});
	const [filters, setFilters] = useRouteSessionState<EditableTableFilterValues>(
		{
			initialState: defaultEditableFilters,
			routeKey: editableTableRouteKey,
			stateKey: "query-applied",
		},
	);
	const [filtersExpanded, setFiltersExpanded] = useRouteSessionState({
		initialState: false,
		routeKey: editableTableRouteKey,
		stateKey: "query-expanded",
	});
	const [tableState, setTableState] = useRouteSessionState<EditableTableState>({
		initialState: defaultEditableTableState,
		routeKey: editableTableRouteKey,
		stateKey: "table",
	});
	const [editingKey, setEditingKey] = useState<string>("");
	const [draftRow, setDraftRow] = useState<EditableTableRow | null>(null);
	const querySubmission = useQuerySubmission();
	const queryParams = useMemo<ListEditableTableRowsInput>(() => {
		const q = filters.q?.trim();
		const params: ListEditableTableRowsInput = {
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
	}, [filters, tableState]);
	const query = useQuery({
		placeholderData: keepPreviousData,
		queryFn: ({ signal }) => listEditableTableRows(queryParams, signal),
		queryKey: [
			...editableTableRowsQueryKey,
			queryParams,
			querySubmission.revision,
		],
	});
	const dataSource = useMemo(
		() =>
			draftRow
				? [draftRow, ...(query.data?.items ?? [])]
				: (query.data?.items ?? []),
		[draftRow, query.data?.items],
	);
	const refreshRows = () =>
		queryClient.invalidateQueries({ queryKey: editableTableRowsQueryKey });
	const saveMutation = useMutation({
		mutationFn: ({
			input,
			rowId,
		}: {
			input: SaveEditableTableRowInput;
			rowId: string;
		}) =>
			rowId === newRowId
				? createEditableTableRow(input)
				: updateEditableTableRow({ input, rowId }),
		onSuccess: async () => {
			await refreshRows();
			setDraftRow(null);
			setEditingKey("");
			form.resetFields();
		},
	});
	const deleteMutation = useMutation({
		mutationFn: (rowId: string) => deleteEditableTableRow(rowId),
		onSuccess: async () => {
			await refreshRows();
		},
	});
	const isEditing = (row: EditableTableRow) => row.id === editingKey;
	const hasEditingRow = editingKey !== "";
	const editRow = (row: EditableTableRow) => {
		form.setFieldsValue({
			name: row.name,
			owner: row.owner,
			priority: row.priority,
			progress: row.progress,
			status: row.status,
		});
		setEditingKey(row.id);
	};
	const cancelEdit = () => {
		if (editingKey === newRowId) {
			setDraftRow(null);
		}
		setEditingKey("");
		form.resetFields();
		saveMutation.reset();
	};
	const saveRow = async (rowId: string) => {
		let values: EditableTableFormValues;
		try {
			values = await form.validateFields();
		} catch {
			return;
		}

		saveMutation.mutate({
			input: {
				name: values.name.trim(),
				owner: values.owner.trim(),
				priority: values.priority,
				progress: values.progress,
				status: values.status,
			},
			rowId,
		});
	};
	const addRow = () => {
		if (hasEditingRow) {
			return;
		}

		const nextDraftRow: EditableTableRow = {
			id: newRowId,
			name: "",
			owner: "",
			priority: 10,
			progress: 0,
			status: "draft",
			updatedAt: new Date().toISOString(),
		};
		setDraftRow(nextDraftRow);
		form.setFieldsValue(nextDraftRow);
		setEditingKey(newRowId);
	};

	const resetTablePage = () => {
		setTableState((currentState) => ({ ...currentState, page: 1 }));
		querySubmission.submit();
	};
	const handleTableChange: NonNullable<
		TableProps<EditableTableRow>["onChange"]
	> = (pagination, _filters, sorterState) => {
		const currentSorter = Array.isArray(sorterState)
			? sorterState[0]
			: sorterState;
		const nextSorting = resolveTableSort(
			currentSorter?.columnKey,
			currentSorter?.order,
			tableSortToContractSort,
		);
		setTableState({
			order: nextSorting.order,
			page: pagination.current ?? tableState.page,
			pageSize: pagination.pageSize ?? tableState.pageSize,
			sort: nextSorting.sort,
		});
	};
	const sortOrder = (column: EditableTableSort) =>
		tableState.sort === column && tableState.order
			? tableState.order === "asc"
				? "ascend"
				: "descend"
			: null;
	const rawColumns: Array<
		TableColumnsType<EditableTableRow>[number] & {
			editable?: boolean;
			inputType?: EditableCellProps["inputType"];
			dataIndex?: keyof EditableTableFormValues | "updatedAt" | "actions";
		}
	> = [
		{
			dataIndex: "name",
			editable: true,
			inputType: "text",
			key: "name",
			sortDirections: ["ascend", "descend"],
			sorter: true,
			sortOrder: sortOrder("name"),
			title: t("adminShell.editableTable.columns.name"),
			width: token.controlHeight * 7,
		},
		{
			dataIndex: "owner",
			editable: true,
			inputType: "text",
			key: "owner",
			sortDirections: ["ascend", "descend"],
			sorter: true,
			sortOrder: sortOrder("owner"),
			title: t("adminShell.editableTable.columns.owner"),
			width: token.controlHeight * 5,
		},
		{
			dataIndex: "status",
			editable: true,
			inputType: "select",
			key: "status",
			render: (status: EditableTableRowStatus) => (
				<Tag color={statusColor(status)}>
					{t(`adminShell.editableTable.statuses.${status}`)}
				</Tag>
			),
			sortDirections: ["ascend", "descend"],
			sorter: true,
			sortOrder: sortOrder("status"),
			title: t("adminShell.editableTable.columns.status"),
			width: token.controlHeight * 3,
		},
		{
			dataIndex: "priority",
			editable: true,
			inputType: "number",
			key: "priority",
			sortDirections: ["ascend", "descend"],
			sorter: true,
			sortOrder: sortOrder("priority"),
			title: t("adminShell.editableTable.columns.priority"),
			width: token.controlHeight * 3,
		},
		{
			dataIndex: "progress",
			editable: true,
			inputType: "number",
			key: "progress",
			render: (progress: number) => (
				<Progress percent={progress} size="small" status="active" />
			),
			sortDirections: ["ascend", "descend"],
			sorter: true,
			sortOrder: sortOrder("progress"),
			title: t("adminShell.editableTable.columns.progress"),
			width: token.controlHeight * 5,
		},
		{
			dataIndex: "updatedAt",
			key: "updatedAt",
			render: (value: string) => formatDateTime(value, formatPreferences),
			sortDirections: ["ascend", "descend"],
			sorter: true,
			sortOrder: sortOrder("updated_at"),
			title: t("adminShell.editableTable.columns.updatedAt"),
			width: token.controlHeight * 5,
		},
		{
			dataIndex: "actions",
			key: "actions",
			render: (_: unknown, row: EditableTableRow) => {
				const editing = isEditing(row);
				return editing ? (
					<Space size="middle">
						<Button
							loading={saveMutation.isPending}
							onClick={() => void saveRow(row.id)}
							size="small"
							type="link"
						>
							{t("adminShell.editableTable.save")}
						</Button>
						<Button onClick={cancelEdit} size="small" type="link">
							{t("adminShell.editableTable.cancel")}
						</Button>
					</Space>
				) : (
					<Space size="middle">
						<Button
							disabled={hasEditingRow}
							onClick={() => editRow(row)}
							size="small"
							type="link"
						>
							{t("adminShell.editableTable.edit")}
						</Button>
						<Popconfirm
							cancelText={t("adminShell.editableTable.cancel")}
							disabled={hasEditingRow}
							okButtonProps={{ danger: true }}
							okText={t("adminShell.editableTable.confirmDelete")}
							onConfirm={() => deleteMutation.mutate(row.id)}
							title={t("adminShell.editableTable.deleteDescription", {
								name: row.name,
							})}
						>
							<Button danger disabled={hasEditingRow} size="small" type="link">
								{t("adminShell.editableTable.delete")}
							</Button>
						</Popconfirm>
					</Space>
				);
			},
			title: t("adminShell.editableTable.columns.actions"),
			width: token.controlHeight * 4,
		},
	];
	const columns = rawColumns.map((column) => {
		if (!column.editable) {
			return column;
		}

		return {
			...column,
			onCell: (row: EditableTableRow) => ({
				dataIndex: column.dataIndex as keyof EditableTableFormValues,
				editing: isEditing(row),
				inputType: column.inputType ?? "text",
				title: column.title,
			}),
		};
	}) as TableColumnsType<EditableTableRow>;
	const tableExtra =
		saveMutation.isError || deleteMutation.isError ? (
			<Space direction="vertical" style={{ width: "100%" }}>
				{saveMutation.isError ? (
					<Alert
						description={t("adminShell.editableTable.errors.save")}
						showIcon
						type="error"
					/>
				) : null}
				{deleteMutation.isError ? (
					<Alert
						description={t("adminShell.editableTable.errors.delete")}
						showIcon
						type="error"
					/>
				) : null}
			</Space>
		) : undefined;

	return (
		<LogTablePanel<EditableTableRow>
			columnSettingsStorageKey={getTableColumnSettingsStorageKey(
				"editable-table-examples",
			)}
			columnVisibility={columnVisibility}
			columns={columns}
			dataSource={dataSource}
			emptyText={t("adminShell.editableTable.empty")}
			error={query.error}
			errorFallback={t("adminShell.editableTable.errors.fallback")}
			errorTitle={t("adminShell.editableTable.errors.load")}
			initialLoading={query.isPending}
			onPageChange={(page, pageSize) =>
				setTableState((currentState) => ({
					...currentState,
					page,
					pageSize,
				}))
			}
			onReload={() => void query.refetch()}
			onTableChange={handleTableChange}
			page={query.data?.page ?? tableState.page}
			pageSize={query.data?.pageSize ?? tableState.pageSize}
			primaryAction={
				<Button
					disabled={hasEditingRow}
					icon={<PlusOutlined aria-hidden />}
					onClick={addRow}
					type="primary"
				>
					{t("adminShell.editableTable.addRow")}
				</Button>
			}
			queryPanel={
				<EditableTableQueryPanel
					draftFilters={draftFilters}
					expanded={filtersExpanded}
					initialFilters={defaultEditableFilters}
					loading={query.isFetching && !query.isPending}
					onApply={(nextFilters) => {
						setFilters(nextFilters);
						resetTablePage();
					}}
					onDraftFiltersChange={setDraftFilters}
					onExpandedChange={setFiltersExpanded}
					onReset={() => {
						setFilters(defaultEditableFilters);
						resetTablePage();
					}}
				/>
			}
			refreshing={
				(query.isFetching && !query.isPending) || saveMutation.isPending
			}
			rowClassName="editable-row"
			tableComponents={{ body: { cell: EditableCell } }}
			tableExtra={tableExtra}
			tableWrapper={(table) => (
				<Form<EditableTableFormValues>
					component={false}
					form={form}
					layout="vertical"
				>
					{table}
				</Form>
			)}
			testId="editable-table-card"
			title={t("adminShell.editableTable.tableTitle")}
			total={query.data?.total ?? 0}
			workspaceTestId="editable-table-workspace"
		/>
	);
}
