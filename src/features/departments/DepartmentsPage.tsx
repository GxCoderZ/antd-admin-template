import type { ProColumns, ProFormInstance } from "@ant-design/pro-components";
import { useRef } from "react";
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
	Drawer,
	Flex,
	Form,
	Input,
	message,
	Modal,
	Select,
	Space,
	Tag,
	theme,
} from "antd";
import {
	keepPreviousData,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { formatDateTime } from "../../app/formatting";
import { platformUsersQueryKey } from "#src/api/users";
import { platformPositionsQueryKey } from "#src/api/positions";
import { useLocalePreferences } from "../../app/localePreferences";
import { getTableColumnSettingsStorageKey } from "../../app/preferenceStorage";
import { useQuerySubmission } from "../../app/queryFilterLayout";
import { useRouteSessionState } from "../../app/routeSessionState";
import {
	TableActionButton,
	TableActionMenu,
} from "../../app/TableActionButton";
import type { TableColumnConfig } from "../../app/tableColumnVisibility";
import {
	createPlatformDepartment,
	deletePlatformDepartment,
	listPlatformDepartments,
	platformDepartmentsQueryKey,
	type CreatePlatformDepartmentInput,
	type PlatformDepartment,
	type PlatformDepartmentStatus,
	updatePlatformDepartment,
} from "#src/api/departments";
import {
	type ManagementQuery,
	LogTablePanel,
} from "../operations/LogTablePanel";
import { DepartmentDetailDrawer } from "./DepartmentDetailDrawer";
import { hasFormChanges, useDiscardChanges } from "../../app/useDiscardChanges";

interface DepartmentFilterValues {
	name?: string;
	status: "all" | PlatformDepartmentStatus;
}

interface DepartmentTableRow extends Omit<PlatformDepartment, "children"> {
	children?: DepartmentTableRow[];
}

function toDepartmentTableRows(
	departments: PlatformDepartment[],
): DepartmentTableRow[] {
	return departments.map(({ children, ...department }) => ({
		...department,
		// Table treats even an empty children array as an expandable tree node.
		...(children.length > 0
			? { children: toDepartmentTableRows(children) }
			: {}),
	}));
}

const defaultDepartmentFilterValues: DepartmentFilterValues = { status: "all" };
const formId = "department-form";
const departmentsRouteKey = "/organization/departments";
const departmentColumnVisibility: readonly TableColumnConfig<string>[] = [
	{ key: "name", visibility: "required" },
	{ key: "code", visibility: "recommended" },
	{ key: "memberCount", visibility: "recommended" },
	{ key: "positionCount", visibility: "recommended" },
	{ key: "status", visibility: "recommended" },
	{ key: "updatedAt", visibility: "optional" },
	{ key: "actions", visibility: "required" },
];

function flattenDepartments(
	departments: PlatformDepartment[],
	level = 0,
): Array<PlatformDepartment & { level: number }> {
	return departments.flatMap((department) => [
		{ ...department, level },
		...flattenDepartments(department.children, level + 1),
	]);
}

function toDepartmentInput(
	department: DepartmentTableRow,
	status = department.status,
): CreatePlatformDepartmentInput {
	return {
		code: department.code,
		name: department.name,
		parentId: department.parentId,
		status,
	};
}

export function DepartmentsPage() {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const formatPreferences = useLocalePreferences();
	const queryClient = useQueryClient();
	const [messageApi, messageContextHolder] = message.useMessage();
	const filterForm = useRef<ProFormInstance<DepartmentFilterValues>>(undefined);
	const [editorForm] = Form.useForm<CreatePlatformDepartmentInput>();
	const [draftFilters, setDraftFilters] =
		useRouteSessionState<DepartmentFilterValues>({
			initialState: defaultDepartmentFilterValues,
			routeKey: departmentsRouteKey,
			stateKey: "query-draft",
		});
	const [filters, setFilters] = useRouteSessionState<DepartmentFilterValues>({
		initialState: defaultDepartmentFilterValues,
		routeKey: departmentsRouteKey,
		stateKey: "query-applied",
	});
	const [filtersExpanded, setFiltersExpanded] = useRouteSessionState({
		initialState: false,
		routeKey: departmentsRouteKey,
		stateKey: "query-expanded",
	});
	const [editingDepartment, setEditingDepartment] =
		useState<DepartmentTableRow | null>(null);
	const [creatingRoot, setCreatingRoot] = useState(false);
	const [viewingDepartmentId, setViewingDepartmentId] = useState<string | null>(
		null,
	);
	const [parentDepartment, setParentDepartment] =
		useState<DepartmentTableRow | null>(null);
	const [deletingDepartment, setDeletingDepartment] =
		useState<DepartmentTableRow | null>(null);
	const querySubmission = useQuerySubmission();
	const queryParams = useMemo(() => {
		const name = filters.name?.trim();
		return {
			...(name ? { name } : {}),
			...(filters.status !== "all" ? { status: filters.status } : {}),
		};
	}, [filters]);
	const departmentsQuery = useQuery({
		placeholderData: keepPreviousData,
		queryFn: ({ signal }) => listPlatformDepartments(queryParams, signal),
		queryKey: [
			...platformDepartmentsQueryKey,
			queryParams,
			querySubmission.revision,
		],
	});
	const departmentOptions = useMemo(
		() =>
			flattenDepartments(departmentsQuery.data ?? []).map((department) => ({
				label: `${"　".repeat(department.level)}${department.name}`,
				value: department.id,
			})),
		[departmentsQuery.data],
	);
	const tableDepartments = useMemo(
		() => toDepartmentTableRows(departmentsQuery.data ?? []),
		[departmentsQuery.data],
	);
	const refreshDepartments = () =>
		Promise.all([
			queryClient.invalidateQueries({ queryKey: platformDepartmentsQueryKey }),
			queryClient.invalidateQueries({ queryKey: platformUsersQueryKey }),
			queryClient.invalidateQueries({ queryKey: platformPositionsQueryKey }),
		]);
	const saveMutation = useMutation({
		mutationFn: (input: CreatePlatformDepartmentInput) =>
			editingDepartment
				? updatePlatformDepartment({
						departmentId: editingDepartment.id,
						input,
					})
				: createPlatformDepartment(input),
		onSuccess: async () => {
			await refreshDepartments();
			void messageApi.success(
				t("adminShell.departments.feedback.saved", {
					defaultValue: "部门已保存",
				}),
			);
			setEditingDepartment(null);
			setCreatingRoot(false);
			setParentDepartment(null);
		},
	});
	const toggleMutation = useMutation({
		mutationFn: (department: DepartmentTableRow) =>
			updatePlatformDepartment({
				departmentId: department.id,
				input: toDepartmentInput(
					department,
					department.status === "active" ? "disabled" : "active",
				),
			}),
		onSuccess: async () => {
			await refreshDepartments();
			void messageApi.success(
				t("adminShell.departments.feedback.statusUpdated", {
					defaultValue: "部门状态已更新",
				}),
			);
		},
	});
	const deleteMutation = useMutation({
		mutationFn: deletePlatformDepartment,
		onSuccess: async () => {
			await refreshDepartments();
			void messageApi.success(
				t("adminShell.departments.feedback.deleted", {
					defaultValue: "部门已删除",
				}),
			);
			setDeletingDepartment(null);
		},
	});
	const editorOpen =
		creatingRoot || editingDepartment !== null || parentDepartment !== null;
	const initialValues = useMemo<CreatePlatformDepartmentInput>(
		() =>
			editingDepartment
				? toDepartmentInput(editingDepartment)
				: {
						code: "",
						name: "",
						parentId: parentDepartment?.id ?? null,
						status: "active",
					},
		[editingDepartment, parentDepartment],
	);
	const discard = useDiscardChanges({
		isDirty: () => hasFormChanges(editorForm, initialValues),
		onDiscard: () => {
			setEditingDepartment(null);
			setCreatingRoot(false);
			setParentDepartment(null);
		},
		saving: saveMutation.isPending,
	});

	useEffect(() => {
		if (!editorOpen) {
			return;
		}
		editorForm.setFieldsValue(initialValues);
	}, [initialValues, editorForm, editorOpen]);

	const applyFilters = (values: DepartmentFilterValues) => {
		setFilters(values);
		querySubmission.submit();
	};
	const resetFilters = () => {
		querySubmission.reset();
		filterForm.current?.setFieldsValue({ name: "", status: "all" });
		setDraftFilters(defaultDepartmentFilterValues);
		setFilters(defaultDepartmentFilterValues);
	};
	const columns = useMemo<ProColumns<DepartmentTableRow>[]>(
		() => [
			{
				dataIndex: "name",
				key: "name",
				render: (_, department) => (
					<TableActionButton
						onClick={() => setViewingDepartmentId(department.id)}
					>
						{department.name}
					</TableActionButton>
				),
				title: t("adminShell.departments.columns.name", {
					defaultValue: "部门名称",
				}),
				width: token.controlHeight * 6,
			},
			{
				dataIndex: "code",
				key: "code",
				title: t("adminShell.departments.columns.code", {
					defaultValue: "部门标识",
				}),
				width: token.controlHeight * 5,
			},
			{
				dataIndex: "memberCount",
				key: "memberCount",
				title: t("adminShell.departments.columns.memberCount", {
					defaultValue: "成员数",
				}),
				width: token.controlHeight * 3,
			},
			{
				dataIndex: "positionCount",
				key: "positionCount",
				title: t("adminShell.departments.columns.positionCount", {
					defaultValue: "岗位数",
				}),
				width: token.controlHeight * 3,
			},
			{
				dataIndex: "status",
				key: "status",
				renderText: (status: PlatformDepartmentStatus) => (
					<Tag color={status === "active" ? "success" : "default"}>
						{t(`adminShell.departments.statuses.${status}`, {
							defaultValue: status === "active" ? "启用" : "停用",
						})}
					</Tag>
				),
				title: t("adminShell.departments.columns.status", {
					defaultValue: "状态",
				}),
				width: token.controlHeight * 3,
			},
			{
				dataIndex: "updatedAt",
				key: "updatedAt",
				renderText: (value: string) => formatDateTime(value, formatPreferences),
				title: t("adminShell.departments.columns.updatedAt", {
					defaultValue: "更新时间",
				}),
				width: token.controlHeight * 5,
			},
			{
				key: "actions",
				render: (_: unknown, department) => (
					<Space size="middle">
						<TableActionButton
							icon={<EditOutlined aria-hidden />}
							onClick={() => {
								saveMutation.reset();
								setCreatingRoot(false);
								setParentDepartment(null);
								setEditingDepartment(department);
							}}
						>
							{t("adminShell.departments.edit", { defaultValue: "编辑" })}
						</TableActionButton>
						<TableActionMenu
							items={[
								{
									icon: <PlusOutlined aria-hidden />,
									key: "createChild",
									label: t("adminShell.departments.createChild"),
									onClick: () => {
										saveMutation.reset();
										setCreatingRoot(false);
										setEditingDepartment(null);
										setParentDepartment(department);
									},
								},
								{
									icon:
										department.status === "active" ? (
											<StopOutlined aria-hidden />
										) : (
											<CheckCircleOutlined aria-hidden />
										),
									key: "toggle",
									label: t(
										department.status === "active"
											? "adminShell.departments.disable"
											: "adminShell.departments.enable",
										{
											defaultValue:
												department.status === "active" ? "停用" : "启用",
										},
									),
									onClick: () => toggleMutation.mutate(department),
								},
								{
									danger: true,
									icon: <DeleteOutlined aria-hidden />,
									key: "delete",
									label: t("adminShell.departments.delete", {
										defaultValue: "删除",
									}),
									onClick: () => {
										deleteMutation.reset();
										setDeletingDepartment(department);
									},
								},
							]}
							label={t("adminShell.departments.more", {
								defaultValue: "更多",
							})}
						/>
					</Space>
				),
				title: t("adminShell.departments.columns.actions", {
					defaultValue: "操作",
				}),
				width: token.controlHeight * 5,
			},
		],
		[
			deleteMutation,
			formatPreferences,
			saveMutation,
			t,
			toggleMutation,
			token.controlHeight,
		],
	);
	const tableQuery: ManagementQuery<DepartmentFilterValues> = {
		expanded: filtersExpanded,
		formRef: filterForm,
		initialValues: draftFilters,
		loading: departmentsQuery.isFetching && !departmentsQuery.isPending,
		onFinish: applyFilters,
		onReset: resetFilters,
		onExpandedChange: setFiltersExpanded,
		onValuesChange: (values) => setDraftFilters(values),
		testId: "admin-departments-query-form",
		columns: [
			{
				dataIndex: "name",
				title: t("adminShell.departments.filters.name"),
				formItemRender: () => (
					<Input
						allowClear
						maxLength={80}
						placeholder={t("adminShell.departments.placeholders.name")}
					/>
				),
			},
			{
				dataIndex: "status",
				title: t("adminShell.departments.filters.status"),
				formItemRender: () => (
					<Select
						options={[
							{ label: t("adminShell.departments.allStatuses"), value: "all" },
							{
								label: t("adminShell.departments.statuses.active"),
								value: "active",
							},
							{
								label: t("adminShell.departments.statuses.disabled"),
								value: "disabled",
							},
						]}
					/>
				),
			},
		],
	};

	return (
		<>
			{messageContextHolder}
			<DepartmentDetailDrawer
				department={flattenDepartments(departmentsQuery.data ?? []).find(
					(department) => department.id === viewingDepartmentId,
				)}
				onClose={() => setViewingDepartmentId(null)}
			/>
			<LogTablePanel<DepartmentTableRow, DepartmentFilterValues>
				columnSettingsStorageKey={getTableColumnSettingsStorageKey(
					"departments",
				)}
				columnVisibility={departmentColumnVisibility}
				columns={columns}
				dataSource={tableDepartments}
				emptyText={t("adminShell.departments.empty", {
					defaultValue: "暂无部门",
				})}
				error={departmentsQuery.error}
				initialLoading={departmentsQuery.isPending}
				onReload={() => void departmentsQuery.refetch()}
				page={1}
				pageSize={100}
				pagination={false}
				primaryAction={
					<Button
						icon={<PlusOutlined aria-hidden />}
						onClick={() => {
							saveMutation.reset();
							setEditingDepartment(null);
							setParentDepartment(null);
							setCreatingRoot(true);
						}}
						type="primary"
					>
						{t("adminShell.departments.create", {
							defaultValue: "新建部门",
						})}
					</Button>
				}
				query={tableQuery}
				refreshing={departmentsQuery.isFetching && !departmentsQuery.isPending}
				testId="admin-departments-table-card"
				title={t("adminShell.departments.tableTitle", {
					defaultValue: "部门列表",
				})}
				total={flattenDepartments(departmentsQuery.data ?? []).length}
				workspaceTestId="admin-departments-workspace"
			/>
			<Drawer
				destroyOnHidden
				size="min(560px, 100vw)"
				footer={
					<Flex gap={token.marginXS} justify="flex-end">
						<Button
							disabled={saveMutation.isPending}
							onClick={discard.requestClose}
						>
							{t("adminShell.departments.cancel", { defaultValue: "取消" })}
						</Button>
						<Button
							form={formId}
							htmlType="submit"
							loading={saveMutation.isPending}
							type="primary"
						>
							{t("adminShell.departments.save", { defaultValue: "保存" })}
						</Button>
					</Flex>
				}
				onClose={discard.requestClose}
				closable={!saveMutation.isPending}
				keyboard={!saveMutation.isPending}
				mask={{ closable: !saveMutation.isPending }}
				open={editorOpen}
				title={t(
					editingDepartment
						? "adminShell.departments.editTitle"
						: "adminShell.departments.createTitle",
					{ defaultValue: editingDepartment ? "编辑部门" : "新建部门" },
				)}
			>
				{discard.contextHolder}
				{saveMutation.isError ? (
					<Alert
						description={t("adminShell.departments.errors.fallback", {
							defaultValue: "请稍后重试。",
						})}
						showIcon
						style={{ marginBottom: token.margin }}
						title={t("adminShell.departments.errors.save", {
							defaultValue: "保存部门失败",
						})}
						type="error"
					/>
				) : null}
				<Form<CreatePlatformDepartmentInput>
					disabled={saveMutation.isPending}
					form={editorForm}
					id={formId}
					name="departmentEditor"
					layout="vertical"
					onFinish={(values) =>
						saveMutation.mutate({
							...values,
							parentId: values.parentId ?? null,
						})
					}
				>
					<Form.Item
						label={t("adminShell.departments.fields.parent", {
							defaultValue: "上级部门",
						})}
						name="parentId"
					>
						<Select
							allowClear
							disabled={Boolean(parentDepartment?.id)}
							options={departmentOptions.filter(
								(option) => option.value !== editingDepartment?.id,
							)}
							placeholder={t("adminShell.departments.placeholders.parent", {
								defaultValue: "请选择上级部门",
							})}
						/>
					</Form.Item>
					<Form.Item
						label={t("adminShell.departments.fields.name", {
							defaultValue: "部门名称",
						})}
						name="name"
						rules={[
							{
								max: 80,
								message: t("adminShell.departments.validation.nameLength", {
									defaultValue: "部门名称不能超过 80 个字符",
								}),
								required: true,
							},
						]}
					>
						<Input
							maxLength={80}
							placeholder={t("adminShell.departments.placeholders.nameInput", {
								defaultValue: "请输入部门名称",
							})}
							showCount
						/>
					</Form.Item>
					<Form.Item
						label={t("adminShell.departments.fields.code", {
							defaultValue: "部门标识",
						})}
						name="code"
						rules={[
							{
								max: 64,
								message: t("adminShell.departments.validation.codeLength", {
									defaultValue: "部门标识不能超过 64 个字符",
								}),
								required: true,
							},
						]}
					>
						<Input
							maxLength={64}
							placeholder={t("adminShell.departments.placeholders.code", {
								defaultValue: "请输入部门标识",
							})}
							showCount
						/>
					</Form.Item>
					<Form.Item
						label={t("adminShell.departments.fields.status", {
							defaultValue: "状态",
						})}
						name="status"
						rules={[{ required: true }]}
					>
						<Select
							options={[
								{
									label: t("adminShell.departments.statuses.active", {
										defaultValue: "启用",
									}),
									value: "active",
								},
								{
									label: t("adminShell.departments.statuses.disabled", {
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
				cancelText={t("adminShell.departments.cancel", {
					defaultValue: "取消",
				})}
				confirmLoading={deleteMutation.isPending}
				destroyOnHidden
				onCancel={() => setDeletingDepartment(null)}
				onOk={() => {
					if (deletingDepartment) {
						deleteMutation.mutate(deletingDepartment.id);
					}
				}}
				okButtonProps={{ danger: true }}
				okText={t("adminShell.departments.confirmDelete", {
					defaultValue: "确认删除",
				})}
				open={deletingDepartment !== null}
				title={t("adminShell.departments.deleteTitle", {
					defaultValue: "删除部门",
				})}
			>
				{deleteMutation.isError ? (
					<Alert
						description={t("adminShell.departments.errors.deleteProtected", {
							defaultValue: "请先移除下级部门、关联岗位或成员后再删除。",
						})}
						showIcon
						title={t("adminShell.departments.errors.delete", {
							defaultValue: "删除部门失败",
						})}
						type="error"
					/>
				) : (
					t("adminShell.departments.deleteDescription", {
						defaultValue: "确认删除部门“{{name}}”？",
						name: deletingDepartment?.name,
					})
				)}
			</Modal>
		</>
	);
}
