import {
	CheckCircleOutlined,
	DeleteOutlined,
	EditOutlined,
	PlusOutlined,
	StopOutlined,
} from "@ant-design/icons";
import {
	Alert,
	Button,
	Col,
	Drawer,
	Form,
	Input,
	message,
	Modal,
	Select,
	Space,
	Tag,
	type TableColumnsType,
	type TableProps,
	theme,
} from "antd";
import {
	keepPreviousData,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { formatDateTime } from "../../app/formatting";
import { useLocalePreferences } from "../../app/localePreferences";
import { getTableColumnSettingsStorageKey } from "../../app/preferenceStorage";
import {
	useQueryFilterLayout,
	useQuerySubmission,
} from "../../app/queryFilterLayout";
import { useRouteSessionState } from "../../app/routeSessionState";
import { resolveTableSort } from "../../app/tableSorting";
import {
	TableActionButton,
	TableActionMenu,
} from "../../app/TableActionButton";
import type { ResponsiveTableColumnConfig } from "../../app/tableColumnVisibility";
import {
	listPlatformDepartments,
	platformDepartmentsQueryKey,
	type PlatformDepartment,
} from "#src/api/departments";
import {
	createPlatformPosition,
	deletePlatformPosition,
	listPlatformPositions,
	platformPositionsQueryKey,
	type CreatePlatformPositionInput,
	type ListPlatformPositionsInput,
	type PlatformPosition,
	type PlatformPositionStatus,
	updatePlatformPosition,
} from "#src/api/positions";
import { LogQueryPanel, LogTablePanel } from "../operations/LogTablePanel";

interface PositionFilterValues {
	code?: string;
	departmentId?: string;
	name?: string;
	status: "all" | PlatformPositionStatus;
}

interface PositionTableState {
	order: ListPlatformPositionsInput["order"];
	page: number;
	pageSize: number;
	sort: ListPlatformPositionsInput["sort"];
}

const defaultPositionFilterValues: PositionFilterValues = { status: "all" };
const positionsRouteKey = "/organization/positions";
const defaultPositionTableState: PositionTableState = {
	order: "desc",
	page: 1,
	pageSize: 20,
	sort: "updated_at",
};
const formId = "position-form";
const positionColumnVisibility: readonly ResponsiveTableColumnConfig<string>[] = [
	{ key: "name", priority: "compact", required: true },
	{ key: "code", priority: "regular" },
	{ key: "departmentName", priority: "regular" },
	{ key: "status", priority: "compact" },
	{ key: "memberCount", priority: "spacious" },
	{ key: "updatedAt", priority: "optional" },
	{ key: "actions", priority: "compact", required: true },
];
const tableSortToContractSort: Record<
	string,
	NonNullable<ListPlatformPositionsInput["sort"]>
> = {
	code: "code",
	departmentName: "department",
	memberCount: "member_count",
	name: "name",
	status: "status",
	updatedAt: "updated_at",
};

function flattenDepartments(
	departments: PlatformDepartment[],
	level = 0,
): Array<PlatformDepartment & { level: number }> {
	return departments.flatMap((department) => [
		{ ...department, level },
		...flattenDepartments(department.children, level + 1),
	]);
}

function toPositionInput(
	position: PlatformPosition,
	status = position.status,
): CreatePlatformPositionInput {
	return {
		code: position.code,
		departmentId: position.departmentId,
		name: position.name,
		status,
	};
}

export function PositionsPage() {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const formatPreferences = useLocalePreferences();
	const queryClient = useQueryClient();
	const [messageApi, messageContextHolder] = message.useMessage();
	const [filterForm] = Form.useForm<PositionFilterValues>();
	const [editorForm] = Form.useForm<CreatePlatformPositionInput>();
	const [draftFilters, setDraftFilters] =
		useRouteSessionState<PositionFilterValues>({
			initialState: defaultPositionFilterValues,
			routeKey: positionsRouteKey,
			stateKey: "query-draft",
		});
	const [filters, setFilters] = useRouteSessionState<PositionFilterValues>({
		initialState: defaultPositionFilterValues,
		routeKey: positionsRouteKey,
		stateKey: "query-applied",
	});
	const [filtersExpanded, setFiltersExpanded] = useRouteSessionState({
		initialState: false,
		routeKey: positionsRouteKey,
		stateKey: "query-expanded",
	});
	const [tableState, setTableState] =
		useRouteSessionState<PositionTableState>({
			initialState: defaultPositionTableState,
			routeKey: positionsRouteKey,
			stateKey: "table",
		});
	const [creatingPosition, setCreatingPosition] = useState(false);
	const [editingPosition, setEditingPosition] =
		useState<PlatformPosition | null>(null);
	const [deletingPosition, setDeletingPosition] =
		useState<PlatformPosition | null>(null);
	const querySubmission = useQuerySubmission();
	const queryLayout = useQueryFilterLayout({
		expanded: filtersExpanded,
		fieldCount: 4,
	});
	const departmentsQuery = useQuery({
		placeholderData: keepPreviousData,
		queryFn: ({ signal }) => listPlatformDepartments({}, signal),
		queryKey: [...platformDepartmentsQueryKey, "position-options"],
	});
	const departmentOptions = useMemo(
		() =>
			flattenDepartments(departmentsQuery.data ?? []).map((department) => ({
				label: `${"　".repeat(department.level)}${department.name}`,
				value: department.id,
			})),
		[departmentsQuery.data],
	);
	const queryParams = useMemo<ListPlatformPositionsInput>(() => {
		const name = filters.name?.trim();
		const code = filters.code?.trim();
		return {
			page: tableState.page,
			pageSize: tableState.pageSize,
			...(tableState.order && tableState.sort
				? { order: tableState.order, sort: tableState.sort }
				: {}),
			...(name ? { name } : {}),
			...(code ? { code } : {}),
			...(filters.departmentId ? { departmentId: filters.departmentId } : {}),
			...(filters.status !== "all" ? { status: filters.status } : {}),
		};
	}, [filters, tableState]);
	const positionsQuery = useQuery({
		placeholderData: keepPreviousData,
		queryFn: ({ signal }) => listPlatformPositions(queryParams, signal),
		queryKey: [
			...platformPositionsQueryKey,
			queryParams,
			querySubmission.revision,
		],
	});
	const refreshPositions = () =>
		queryClient.invalidateQueries({ queryKey: platformPositionsQueryKey });
	const saveMutation = useMutation({
		mutationFn: (input: CreatePlatformPositionInput) =>
			editingPosition
				? updatePlatformPosition({
						input,
						positionId: editingPosition.id,
					})
				: createPlatformPosition(input),
		onSuccess: async () => {
			await refreshPositions();
			void messageApi.success(
				t("adminShell.positions.feedback.saved", {
					defaultValue: "岗位已保存",
				}),
			);
			setCreatingPosition(false);
			setEditingPosition(null);
		},
	});
	const toggleMutation = useMutation({
		mutationFn: (position: PlatformPosition) =>
			updatePlatformPosition({
				input: toPositionInput(
					position,
					position.status === "active" ? "disabled" : "active",
				),
				positionId: position.id,
			}),
		onSuccess: async () => {
			await refreshPositions();
			void messageApi.success(
				t("adminShell.positions.feedback.statusUpdated", {
					defaultValue: "岗位状态已更新",
				}),
			);
		},
	});
	const deleteMutation = useMutation({
		mutationFn: deletePlatformPosition,
		onSuccess: async () => {
			await refreshPositions();
			void messageApi.success(
				t("adminShell.positions.feedback.deleted", {
					defaultValue: "岗位已删除",
				}),
			);
			setDeletingPosition(null);
		},
	});
	const editorOpen = creatingPosition || editingPosition !== null;

	useEffect(() => {
		if (!editorOpen) {
			return;
		}
		editorForm.setFieldsValue(
			editingPosition
				? toPositionInput(editingPosition)
				: {
						code: "",
						departmentId: departmentOptions[0]?.value ?? "",
						name: "",
						status: "active",
					},
		);
	}, [departmentOptions, editingPosition, editorForm, editorOpen]);

	const applyFilters = () => {
		setFilters(draftFilters);
		setTableState((current) => ({ ...current, page: 1 }));
		querySubmission.submit();
	};
	const resetFilters = () => {
		setDraftFilters(defaultPositionFilterValues);
		setFilters(defaultPositionFilterValues);
		setTableState((current) => ({ ...current, page: 1 }));
		querySubmission.submit();
	};
	const handleTableChange: NonNullable<
		TableProps<PlatformPosition>["onChange"]
	> = (_pagination, _filters, sorterState, extra) => {
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
		setTableState((current) => ({
			...current,
			order: nextSorting.order,
			page: 1,
			sort: nextSorting.sort,
		}));
	};
	const sortOrder = useCallback(
		(column: NonNullable<ListPlatformPositionsInput["sort"]>) =>
			tableState.sort === column && tableState.order
				? tableState.order === "asc"
					? "ascend"
					: "descend"
				: null,
		[tableState.order, tableState.sort],
	);
	const columns = useMemo<TableColumnsType<PlatformPosition>>(
		() => [
			{
				dataIndex: "name",
				key: "name",
				sortDirections: ["ascend", "descend"],
				sortOrder: sortOrder("name"),
				sorter: true,
				title: t("adminShell.positions.columns.name", {
					defaultValue: "岗位名称",
				}),
				width: token.controlHeight * 5,
			},
			{
				dataIndex: "code",
				key: "code",
				sortDirections: ["ascend", "descend"],
				sortOrder: sortOrder("code"),
				sorter: true,
				title: t("adminShell.positions.columns.code", {
					defaultValue: "岗位标识",
				}),
				width: token.controlHeight * 5,
			},
			{
				dataIndex: "departmentName",
				key: "departmentName",
				sortDirections: ["ascend", "descend"],
				sortOrder: sortOrder("department"),
				sorter: true,
				title: t("adminShell.positions.columns.department", {
					defaultValue: "所属部门",
				}),
				width: token.controlHeight * 5,
			},
			{
				dataIndex: "status",
				key: "status",
				render: (status: PlatformPositionStatus) => (
					<Tag color={status === "active" ? "success" : "default"}>
						{t(`adminShell.positions.statuses.${status}`, {
							defaultValue: status === "active" ? "启用" : "停用",
						})}
					</Tag>
				),
				sortDirections: ["ascend", "descend"],
				sortOrder: sortOrder("status"),
				sorter: true,
				title: t("adminShell.positions.columns.status", {
					defaultValue: "状态",
				}),
				width: token.controlHeight * 3,
			},
			{
				dataIndex: "memberCount",
				key: "memberCount",
				sortDirections: ["ascend", "descend"],
				sortOrder: sortOrder("member_count"),
				sorter: true,
				title: t("adminShell.positions.columns.memberCount", {
					defaultValue: "成员数",
				}),
				width: token.controlHeight * 3,
			},
			{
				dataIndex: "updatedAt",
				key: "updatedAt",
				render: (value: string) => formatDateTime(value, formatPreferences),
				sortDirections: ["ascend", "descend"],
				sortOrder: sortOrder("updated_at"),
				sorter: true,
				title: t("adminShell.positions.columns.updatedAt", {
					defaultValue: "更新时间",
				}),
				width: token.controlHeight * 5,
			},
			{
				key: "actions",
				render: (_: unknown, position) => (
					<Space size="middle">
						<TableActionButton
							icon={<EditOutlined aria-hidden />}
							onClick={() => {
								saveMutation.reset();
								setCreatingPosition(false);
								setEditingPosition(position);
							}}
						>
							{t("adminShell.positions.edit", { defaultValue: "编辑" })}
						</TableActionButton>
						<TableActionMenu
							items={[
								{
									icon:
										position.status === "active" ? (
											<StopOutlined aria-hidden />
										) : (
											<CheckCircleOutlined aria-hidden />
										),
									key: "toggle",
									label: t(
										position.status === "active"
											? "adminShell.positions.disable"
											: "adminShell.positions.enable",
										{
											defaultValue:
												position.status === "active" ? "停用" : "启用",
										},
									),
									onClick: () => toggleMutation.mutate(position),
								},
								{
									danger: true,
									icon: <DeleteOutlined aria-hidden />,
									key: "delete",
									label: t("adminShell.positions.delete", {
										defaultValue: "删除",
									}),
									onClick: () => {
										deleteMutation.reset();
										setDeletingPosition(position);
									},
								},
							]}
							label={t("adminShell.positions.more", {
								defaultValue: "更多",
							})}
						/>
					</Space>
				),
				title: t("adminShell.positions.columns.actions", {
					defaultValue: "操作",
				}),
				width: token.controlHeight * 5,
			},
		],
		[
			deleteMutation,
			formatPreferences,
			saveMutation,
			sortOrder,
			t,
			toggleMutation,
			token.controlHeight,
		],
	);
	const queryPanel = (
		<LogQueryPanel<PositionFilterValues>
			actionsTestId="admin-positions-query-actions"
			canExpand={queryLayout.canExpand}
			columnSpan={queryLayout.columnSpan}
			containerRef={queryLayout.containerRef}
			expanded={filtersExpanded}
			form={filterForm}
			formLayout={queryLayout.formLayout}
			initialValues={defaultPositionFilterValues}
			loading={positionsQuery.isFetching && !positionsQuery.isPending}
			onFinish={applyFilters}
			onReset={resetFilters}
			onToggle={() => setFiltersExpanded((expanded) => !expanded)}
			submitterOffset={queryLayout.submitterOffset}
			testId="admin-positions-query-form"
		>
			<Col span={queryLayout.columnSpan}>
				<Form.Item
					label={t("adminShell.positions.filters.name", {
						defaultValue: "岗位名称",
					})}
					style={{ marginBottom: 0 }}
				>
					<Input
						allowClear
						maxLength={80}
						onChange={(event) =>
							setDraftFilters((current) => ({
								...current,
								name: event.target.value,
							}))
						}
						placeholder={t("adminShell.positions.placeholders.name", {
							defaultValue: "搜索岗位名称",
						})}
						value={draftFilters.name}
					/>
				</Form.Item>
			</Col>
			{filtersExpanded || queryLayout.collapsedFieldCount >= 2 ? (
				<Col span={queryLayout.columnSpan}>
					<Form.Item
						label={t("adminShell.positions.filters.code", {
							defaultValue: "岗位标识",
						})}
						style={{ marginBottom: 0 }}
					>
						<Input
							allowClear
							maxLength={64}
							onChange={(event) =>
								setDraftFilters((current) => ({
									...current,
									code: event.target.value,
								}))
							}
							placeholder={t("adminShell.positions.placeholders.codeFilter", {
								defaultValue: "搜索岗位标识",
							})}
							value={draftFilters.code}
						/>
					</Form.Item>
				</Col>
			) : null}
			{filtersExpanded || queryLayout.collapsedFieldCount >= 3 ? (
				<Col span={queryLayout.columnSpan}>
					<Form.Item
						label={t("adminShell.positions.filters.department", {
							defaultValue: "所属部门",
						})}
						style={{ marginBottom: 0 }}
					>
						<Select
							allowClear
							onChange={(departmentId?: string) =>
								setDraftFilters((current) => {
									const nextFilters = { ...current };
									if (departmentId) {
										nextFilters.departmentId = departmentId;
									} else {
										delete nextFilters.departmentId;
									}
									return nextFilters;
								})
							}
							options={departmentOptions}
							placeholder={t("adminShell.positions.placeholders.department", {
								defaultValue: "选择所属部门",
							})}
							value={draftFilters.departmentId}
						/>
					</Form.Item>
				</Col>
			) : null}
			{filtersExpanded || queryLayout.collapsedFieldCount >= 4 ? (
				<Col span={queryLayout.columnSpan}>
					<Form.Item
						label={t("adminShell.positions.filters.status", {
							defaultValue: "状态",
						})}
						style={{ marginBottom: 0 }}
					>
						<Select
							onChange={(status: PositionFilterValues["status"]) =>
								setDraftFilters((current) => ({ ...current, status }))
							}
							options={[
								{
									label: t("adminShell.positions.allStatuses", {
										defaultValue: "全部状态",
									}),
									value: "all",
								},
								{
									label: t("adminShell.positions.statuses.active", {
										defaultValue: "启用",
									}),
									value: "active",
								},
								{
									label: t("adminShell.positions.statuses.disabled", {
										defaultValue: "停用",
									}),
									value: "disabled",
								},
							]}
							value={draftFilters.status}
						/>
					</Form.Item>
				</Col>
			) : null}
		</LogQueryPanel>
	);

	return (
		<>
			{messageContextHolder}
			<LogTablePanel<PlatformPosition>
				columnSettingsStorageKey={getTableColumnSettingsStorageKey("positions")}
				columnVisibility={positionColumnVisibility}
				columns={columns}
				dataSource={positionsQuery.data?.items ?? []}
				emptyText={t("adminShell.positions.empty", {
					defaultValue: "暂无岗位",
				})}
				error={positionsQuery.error}
				initialLoading={positionsQuery.isPending}
				minimumWidth={token.controlHeight * 36}
				onPageChange={(page, pageSize) =>
					setTableState((current) => ({ ...current, page, pageSize }))
				}
				onReload={() => void positionsQuery.refetch()}
				onTableChange={handleTableChange}
				page={positionsQuery.data?.page ?? tableState.page}
				pageSize={positionsQuery.data?.pageSize ?? tableState.pageSize}
				primaryAction={
					<Button
						icon={<PlusOutlined aria-hidden />}
						onClick={() => {
							saveMutation.reset();
							setEditingPosition(null);
							setCreatingPosition(true);
						}}
						type="primary"
					>
						{t("adminShell.positions.create", {
							defaultValue: "新建岗位",
						})}
					</Button>
				}
				queryPanel={queryPanel}
				refreshing={positionsQuery.isFetching && !positionsQuery.isPending}
				testId="admin-positions-table-card"
				title={t("adminShell.positions.tableTitle", {
					defaultValue: "岗位列表",
				})}
				total={positionsQuery.data?.total ?? 0}
				workspaceTestId="admin-positions-workspace"
			/>
			<Drawer
				destroyOnHidden
				extra={
					<Space>
						<Button
							disabled={saveMutation.isPending}
							onClick={() => {
								setCreatingPosition(false);
								setEditingPosition(null);
							}}
						>
							{t("adminShell.positions.cancel", { defaultValue: "取消" })}
						</Button>
						<Button
							form={formId}
							htmlType="submit"
							loading={saveMutation.isPending}
							type="primary"
						>
							{t("adminShell.positions.save", { defaultValue: "保存" })}
						</Button>
					</Space>
				}
				onClose={() => {
					setCreatingPosition(false);
					setEditingPosition(null);
				}}
				open={editorOpen}
				title={t(
					editingPosition
						? "adminShell.positions.editTitle"
						: "adminShell.positions.createTitle",
					{ defaultValue: editingPosition ? "编辑岗位" : "新建岗位" },
				)}
			>
				{saveMutation.isError ? (
					<Alert
						description={t("adminShell.positions.errors.fallback", {
							defaultValue: "请稍后重试。",
						})}
						showIcon
						style={{ marginBottom: token.margin }}
						title={t("adminShell.positions.errors.save", {
							defaultValue: "保存岗位失败",
						})}
						type="error"
					/>
				) : null}
				<Form<CreatePlatformPositionInput>
					form={editorForm}
					id={formId}
					layout="vertical"
					onFinish={(values) => saveMutation.mutate(values)}
				>
					<Form.Item
						label={t("adminShell.positions.fields.department", {
							defaultValue: "所属部门",
						})}
						name="departmentId"
						rules={[{ required: true }]}
					>
						<Select
							options={departmentOptions}
							placeholder={t("adminShell.positions.placeholders.department", {
								defaultValue: "选择所属部门",
							})}
						/>
					</Form.Item>
					<Form.Item
						label={t("adminShell.positions.fields.name", {
							defaultValue: "岗位名称",
						})}
						name="name"
						rules={[
							{
								max: 80,
								message: t("adminShell.positions.validation.nameLength", {
									defaultValue: "岗位名称不能超过 80 个字符",
								}),
								required: true,
							},
						]}
					>
						<Input
							maxLength={80}
							placeholder={t("adminShell.positions.placeholders.nameInput", {
								defaultValue: "请输入岗位名称",
							})}
							showCount
						/>
					</Form.Item>
					<Form.Item
						label={t("adminShell.positions.fields.code", {
							defaultValue: "岗位标识",
						})}
						name="code"
						rules={[
							{
								max: 64,
								message: t("adminShell.positions.validation.codeLength", {
									defaultValue: "岗位标识不能超过 64 个字符",
								}),
								required: true,
							},
						]}
					>
						<Input
							maxLength={64}
							placeholder={t("adminShell.positions.placeholders.code", {
								defaultValue: "请输入岗位标识",
							})}
							showCount
						/>
					</Form.Item>
					<Form.Item
						label={t("adminShell.positions.fields.status", {
							defaultValue: "状态",
						})}
						name="status"
						rules={[{ required: true }]}
					>
						<Select
							options={[
								{
									label: t("adminShell.positions.statuses.active", {
										defaultValue: "启用",
									}),
									value: "active",
								},
								{
									label: t("adminShell.positions.statuses.disabled", {
										defaultValue: "停用",
									}),
									value: "disabled",
								},
							]}
						/>
					</Form.Item>
				</Form>
			</Drawer>
			<Modal
				cancelText={t("adminShell.positions.cancel", { defaultValue: "取消" })}
				confirmLoading={deleteMutation.isPending}
				destroyOnHidden
				onCancel={() => setDeletingPosition(null)}
				onOk={() => {
					if (deletingPosition) {
						deleteMutation.mutate(deletingPosition.id);
					}
				}}
				okButtonProps={{ danger: true }}
				okText={t("adminShell.positions.confirmDelete", {
					defaultValue: "确认删除",
				})}
				open={deletingPosition !== null}
				title={t("adminShell.positions.deleteTitle", {
					defaultValue: "删除岗位",
				})}
			>
				{deleteMutation.isError ? (
					<Alert
						description={t("adminShell.positions.errors.fallback", {
							defaultValue: "请稍后重试。",
						})}
						showIcon
						title={t("adminShell.positions.errors.delete", {
							defaultValue: "删除岗位失败",
						})}
						type="error"
					/>
				) : (
					t("adminShell.positions.deleteDescription", {
						defaultValue: "确认删除岗位“{{name}}”？",
						name: deletingPosition?.name,
					})
				)}
			</Modal>
		</>
	);
}
