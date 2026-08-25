import {
	ColumnHeightOutlined,
	CopyOutlined,
	FullscreenExitOutlined,
	FullscreenOutlined,
	PlusOutlined,
	ReloadOutlined,
	SettingOutlined,
} from "@ant-design/icons";
import { ApiProblemError } from "#src/api/client";
import {
	keepPreviousData,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import {
	Alert,
	Badge,
	Button,
	Card,
	Checkbox,
	Col,
	ConfigProvider,
	Drawer,
	Dropdown,
	Flex,
	Form,
	Input,
	type MenuProps,
	Modal,
	Popover,
	Row,
	Select,
	Space,
	Switch,
	Table,
	type TableProps,
	Tag,
	theme,
	Tooltip,
	Tree,
	Typography,
} from "antd";
import {
	useEffect,
	useMemo,
	useRef,
	useState,
	useSyncExternalStore,
} from "react";
import { useTranslation } from "react-i18next";

import { formatDateTime } from "../../app/formatting";
import {
	DangerConfirmationContent,
	DangerConfirmationModal,
} from "../../app/DangerConfirmation";
import { useLocalePreferences } from "../../app/localePreferences";
import { platformPermissions, usePermission } from "../../app/permissions";
import { PlatformUserAvatar } from "../../app/PlatformUserAvatar";
import { QueryFilterSubmitter } from "../../app/QueryFilterSubmitter";
import { TableActionButton } from "../../app/TableActionButton";
import { resolveTableSort } from "../../app/tableSorting";
import {
	listPlatformRoles,
	platformRolesQueryKey,
	setPlatformUserRole,
} from "#src/api/roles";
import { getPlatformSession, platformSessionQueryKey } from "#src/api/auth";
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
import { CreateUserDrawer } from "./CreateUserDrawer";
import {
	forceLogoutPlatformUser,
	getPlatformUser,
	listPlatformUsers,
	platformUserDetailQueryKey,
	platformUsersQueryKey,
	resetPlatformUserPassword,
	updatePlatformUser,
	type ListPlatformUsersInput,
	type PlatformUser,
	type ResetPlatformUserPasswordInput,
	type ResetPlatformUserPasswordResult,
	type UpdatePlatformUserInput,
} from "#src/api/users";

const { Link, Text } = Typography;
const defaultUserFilterValues: UserFilterValues = { status: "all" };
const userQueryFilterFieldCount = 2;
const userColumnKeys = [
	"username",
	"displayName",
	"email",
	"status",
	"createdAt",
	"actions",
] as const;
const userStatusBadgeByStatus: Record<
	PlatformUser["status"],
	"default" | "error" | "success"
> = {
	active: "success",
	disabled: "default",
	locked: "error",
};
const tableSortToContractSort: Record<
	string,
	NonNullable<ListPlatformUsersInput["sort"]>
> = {
	createdAt: "created_at",
	email: "email",
	status: "status",
	username: "username",
};

type UserColumnKey = (typeof userColumnKeys)[number];

interface UserFilterValues {
	q?: string;
	status: "all" | PlatformUser["status"];
}

interface UserTableState {
	order: ListPlatformUsersInput["order"];
	page: number;
	pageSize: number;
	sort: ListPlatformUsersInput["sort"];
}

interface EditUserFormValues {
	displayName: string;
	status: UpdatePlatformUserInput["status"];
}

type ResetPasswordFormValues = ResetPlatformUserPasswordInput;

interface ResetPasswordResultView extends ResetPlatformUserPasswordResult {
	password: string;
	username: string;
}

interface ResetPasswordMutationInput {
	input: ResetPlatformUserPasswordInput;
	userId: string;
	username: string;
}

function getProblemDetail(error: unknown) {
	return error instanceof ApiProblemError ? error.problem?.detail : undefined;
}

function getMutationErrorTitleKey(
	error: unknown,
	invalidTitleKey = "adminShell.users.errors.invalid",
	conflictTitleKey = "adminShell.users.errors.conflict",
) {
	if (!(error instanceof ApiProblemError)) {
		return "adminShell.users.errors.request";
	}

	switch (error.status) {
		case 400:
			return invalidTitleKey;
		case 403:
			return "adminShell.users.errors.forbidden";
		case 409:
			return conflictTitleKey;
		default:
			return "adminShell.users.errors.request";
	}
}

function getProblemFallback(error: unknown, fallback: string) {
	return getProblemDetail(error) ?? fallback;
}

function isApiProblemStatus(error: unknown, status: number) {
	return error instanceof ApiProblemError && error.status === status;
}

export function UsersPage() {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const queryClient = useQueryClient();
	const formatPreferences = useLocalePreferences();
	const canManageUsers = usePermission(platformPermissions.usersManage);
	const canManageRoles = usePermission(platformPermissions.rolesManage);
	const sessionQuery = useQuery({
		queryFn: ({ signal }) => getPlatformSession(signal),
		queryKey: platformSessionQueryKey,
		staleTime: Number.POSITIVE_INFINITY,
	});
	const [createUserOpen, setCreateUserOpen] = useState(false);
	const [editingUser, setEditingUser] = useState<PlatformUser | null>(null);
	const [resetPasswordUser, setResetPasswordUser] =
		useState<PlatformUser | null>(null);
	const [resetPasswordConfirmationName, setResetPasswordConfirmationName] =
		useState("");
	const [resetPasswordResult, setResetPasswordResult] =
		useState<ResetPasswordResultView | null>(null);
	const [passwordCopied, setPasswordCopied] = useState(false);
	const [forceLogoutUser, setForceLogoutUser] = useState<PlatformUser | null>(
		null,
	);
	const [roleUser, setRoleUser] = useState<PlatformUser | null>(null);
	const [editForm] = Form.useForm<EditUserFormValues>();
	const [resetPasswordForm] = Form.useForm<ResetPasswordFormValues>();
	const editingStatus = Form.useWatch("status", editForm);
	const [userDraftFilters, setUserDraftFilters] = useState<UserFilterValues>(
		defaultUserFilterValues,
	);
	const [userFilters, setUserFilters] = useState<UserFilterValues>(
		defaultUserFilterValues,
	);
	const [userTableState, setUserTableState] = useState<UserTableState>({
		order: "desc",
		page: 1,
		pageSize: 20,
		sort: "created_at",
	});
	const userQuerySubmission = useQuerySubmission();
	const {
		columnSpan: userQueryFilterSpan,
		containerRef: userQueryFilterContainerRef,
		formLayout: userQueryFilterLayout,
		submitterOffset: userQueryFilterSubmitterOffset,
	} = useQueryFilterLayout({
		expanded: false,
		fieldCount: userQueryFilterFieldCount,
	});
	const userQueryParams = useMemo<ListPlatformUsersInput>(() => {
		const q = userFilters.q?.trim();
		const params: ListPlatformUsersInput = {
			page: userTableState.page,
			pageSize: userTableState.pageSize,
			...(userTableState.order && userTableState.sort
				? {
						order: userTableState.order,
						sort: userTableState.sort,
					}
				: {}),
		};

		if (q) {
			params.q = q;
		}
		if (userFilters.status !== "all") {
			params.status = userFilters.status;
		}

		return params;
	}, [
		userFilters.q,
		userFilters.status,
		userTableState.order,
		userTableState.page,
		userTableState.pageSize,
		userTableState.sort,
	]);
	const userQuery = useQuery({
		placeholderData: keepPreviousData,
		queryFn: ({ signal }) => listPlatformUsers(userQueryParams, signal),
		queryKey: [
			...platformUsersQueryKey,
			userQueryParams,
			userQuerySubmission.revision,
		],
	});
	const userDetailQuery = useQuery({
		enabled: roleUser !== null,
		queryFn: ({ signal }) => getPlatformUser(roleUser!.id, signal),
		queryKey: roleUser
			? platformUserDetailQueryKey(roleUser.id)
			: platformUserDetailQueryKey(""),
	});
	const rolesQuery = useQuery({
		enabled: roleUser !== null && canManageRoles,
		queryFn: ({ signal }) => listPlatformRoles(signal),
		queryKey: platformRolesQueryKey,
	});
	const refreshUsers = () =>
		queryClient.invalidateQueries({ queryKey: platformUsersQueryKey });
	const refreshUserDetail = (userId: string) =>
		queryClient.invalidateQueries({
			queryKey: platformUserDetailQueryKey(userId),
		});
	const updateUserMutation = useMutation({
		mutationFn: updatePlatformUser,
		onSuccess: async () => {
			await refreshUsers();
			setEditingUser(null);
			editForm.resetFields();
		},
	});
	const resetPasswordMutation = useMutation({
		mutationFn: ({ input, userId }: ResetPasswordMutationInput) =>
			resetPlatformUserPassword({ input, userId }),
		onSuccess: async (result, variables) => {
			setResetPasswordResult({
				...result,
				password: variables.input.password,
				username: variables.username,
			});
			setPasswordCopied(false);
			setResetPasswordUser(null);
			setResetPasswordConfirmationName("");
			resetPasswordForm.resetFields();
			await refreshUsers();
		},
	});
	const forceLogoutMutation = useMutation({
		mutationFn: async (user: PlatformUser) => {
			await forceLogoutPlatformUser(user.id);
			return user;
		},
		onSuccess: () => setForceLogoutUser(null),
	});
	const roleMutation = useMutation({
		mutationFn: setPlatformUserRole,
		onSuccess: async (_data, variables) => {
			await Promise.all([refreshUsers(), refreshUserDetail(variables.userId)]);
		},
	});
	const userRows = userQuery.data?.items ?? [];
	const currentUserId = sessionQuery.data?.user.id;
	const showsDisableWarning =
		editingUser !== null &&
		editingUser.status !== "disabled" &&
		editingStatus === "disabled";
	const updateUserConflict = isApiProblemStatus(updateUserMutation.error, 409);
	const userTableSize = useSyncExternalStore(
		subscribeToPreferenceChanges,
		readUserTableDensityPreference,
		() => defaultPreferences.userTableDensity,
	);
	const [isUserTableFullscreen, setIsUserTableFullscreen] = useState(false);
	const [userColumnOrder, setUserColumnOrder] = useState<UserColumnKey[]>([
		...userColumnKeys,
	]);
	const [visibleUserColumnKeys, setVisibleUserColumnKeys] = useState<
		UserColumnKey[]
	>([...userColumnKeys]);
	const userTableWorkspaceRef = useRef<HTMLDivElement>(null);
	const userSelectionColumnWidth = token.controlHeightSM + token.marginXXS;
	const userTableMinimumWidth =
		token.controlHeight * 25 + userSelectionColumnWidth;
	const availableUserColumnKeys = useMemo<readonly UserColumnKey[]>(
		() => userColumnKeys,
		[],
	);
	const pageError = userQuery.error;

	useEffect(() => {
		const syncUserTableFullscreenState = () => {
			setIsUserTableFullscreen(
				document.fullscreenElement === userTableWorkspaceRef.current,
			);
		};

		document.addEventListener("fullscreenchange", syncUserTableFullscreenState);
		return () => {
			document.removeEventListener(
				"fullscreenchange",
				syncUserTableFullscreenState,
			);
		};
	}, []);

	const visibleAvailableUserColumnKeys = useMemo(
		() =>
			visibleUserColumnKeys.filter((columnKey) =>
				availableUserColumnKeys.includes(columnKey),
			),
		[availableUserColumnKeys, visibleUserColumnKeys],
	);

	useEffect(() => {
		if (editingUser) {
			editForm.setFieldsValue({
				displayName: editingUser.displayName,
				status:
					editingUser.status === "locked" ? "disabled" : editingUser.status,
			});
		}
	}, [editForm, editingUser]);

	const userTableColumns = useMemo<
		NonNullable<TableProps<PlatformUser>["columns"]>
	>(() => {
		const sortOrder = (column: ListPlatformUsersInput["sort"]) =>
			userTableState.sort === column && userTableState.order
				? userTableState.order === "asc"
					? "ascend"
					: "descend"
				: null;
		const dataColumns: NonNullable<TableProps<PlatformUser>["columns"]> = [
			{
				dataIndex: "username",
				key: "username",
				sortDirections: ["ascend", "descend"],
				sorter: true,
				sortOrder: sortOrder("username"),
				title: t("adminShell.users.columns.username"),
				width: token.controlHeight * 4,
			},
			{
				dataIndex: "displayName",
				key: "displayName",
				render: (displayName: string, row: PlatformUser) => (
					<Space size={token.marginXS}>
						<PlatformUserAvatar
							displayName={displayName || row.username}
							revision={row.updatedAt}
							size="small"
							userId={row.id}
						/>
						<Link>{displayName}</Link>
					</Space>
				),
				title: t("adminShell.users.columns.displayName"),
				width: token.controlHeight * 5,
			},
			{
				dataIndex: "email",
				key: "email",
				sortDirections: ["ascend", "descend"],
				sorter: true,
				sortOrder: sortOrder("email"),
				title: t("adminShell.users.columns.email"),
				width: token.controlHeight * 7,
			},
			{
				dataIndex: "status",
				key: "status",
				sortDirections: ["ascend", "descend"],
				sorter: true,
				sortOrder: sortOrder("status"),
				render: (status: PlatformUser["status"]) => (
					<Badge
						status={userStatusBadgeByStatus[status]}
						text={t(`adminShell.users.statuses.${status}`)}
					/>
				),
				title: t("adminShell.users.columns.status"),
				width: token.controlHeightLG * 2,
			},
			{
				dataIndex: "createdAt",
				key: "createdAt",
				render: (createdAt: string) =>
					formatDateTime(createdAt, formatPreferences),
				sortDirections: ["ascend", "descend"],
				sorter: true,
				sortOrder: sortOrder("created_at"),
				title: t("adminShell.users.columns.createdAt"),
				width: token.controlHeight * 5,
			},
		];

		dataColumns.push({
			key: "actions",
			render: (_: unknown, row: PlatformUser) => (
				<Space size={token.marginXS}>
					<TableActionButton
						onClick={() => {
							roleMutation.reset();
							setRoleUser(row);
						}}
					>
						{t("adminShell.users.roles.action")}
					</TableActionButton>
					{canManageUsers ? (
						<>
							<TableActionButton
								onClick={() => {
									updateUserMutation.reset();
									setEditingUser(row);
								}}
							>
								{t("adminShell.users.edit")}
							</TableActionButton>
							<TableActionButton
								onClick={() => {
									resetPasswordMutation.reset();
									resetPasswordForm.resetFields();
									setResetPasswordConfirmationName("");
									setResetPasswordResult(null);
									setPasswordCopied(false);
									setResetPasswordUser(row);
								}}
							>
								{t("adminShell.users.resetPassword")}
							</TableActionButton>
							{currentUserId && row.id !== currentUserId ? (
								<TableActionButton
									danger
									onClick={() => {
										forceLogoutMutation.reset();
										setForceLogoutUser(row);
									}}
								>
									{t("adminShell.users.forceLogout.action")}
								</TableActionButton>
							) : null}
						</>
					) : null}
				</Space>
			),
			title: t("adminShell.users.columns.actions"),
			width: token.controlHeight * 8,
		});

		const dataColumnByKey = new Map(
			dataColumns.map((column) => [column.key as UserColumnKey, column]),
		);

		return userColumnOrder.flatMap((columnKey) => {
			const column = dataColumnByKey.get(columnKey);
			return column && visibleAvailableUserColumnKeys.includes(columnKey)
				? [column]
				: [];
		});
	}, [
		canManageUsers,
		currentUserId,
		forceLogoutMutation,
		formatPreferences,
		resetPasswordForm,
		resetPasswordMutation,
		roleMutation,
		t,
		token.controlHeight,
		token.controlHeightLG,
		token.marginXS,
		updateUserMutation,
		userColumnOrder,
		userTableState.order,
		userTableState.sort,
		visibleAvailableUserColumnKeys,
	]);
	const activeUserRoles = useMemo(
		() => userDetailQuery.data?.roles ?? [],
		[userDetailQuery.data?.roles],
	);
	const activeUserRoleIds = useMemo(
		() => new Set(activeUserRoles.map((role) => role.id)),
		[activeUserRoles],
	);
	const currentRoleMutationRoleId = roleMutation.variables?.roleId;
	const roleDrawerExtra = canManageRoles ? (
		<Text type="secondary">{t("adminShell.users.roles.manageHint")}</Text>
	) : (
		<Text type="secondary">{t("adminShell.users.roles.readOnlyHint")}</Text>
	);
	const roleDrawerContent = (
		<Flex gap={token.marginLG} vertical>
			{userDetailQuery.isError ? (
				<Alert
					action={
						<Button onClick={() => void userDetailQuery.refetch()} size="small">
							{t("adminShell.users.retry")}
						</Button>
					}
					description={getProblemFallback(
						userDetailQuery.error,
						t("adminShell.users.errors.fallback"),
					)}
					showIcon
					title={t("adminShell.users.roles.loadError")}
					type="error"
				/>
			) : null}
			{roleMutation.isError ? (
				<Alert
					description={getProblemFallback(
						roleMutation.error,
						t("adminShell.users.errors.fallback"),
					)}
					showIcon
					title={t(
						getMutationErrorTitleKey(
							roleMutation.error,
							"adminShell.users.roles.errors.invalid",
							"adminShell.users.roles.errors.conflict",
						),
					)}
					type="error"
				/>
			) : null}
			<Flex gap={token.marginXS} vertical>
				<Text strong>{t("adminShell.users.roles.assignedTitle")}</Text>
				<Flex gap={token.marginXS} wrap="wrap">
					{activeUserRoles.length > 0 ? (
						activeUserRoles.map((role) => (
							<Tag key={role.id}>{role.displayName}</Tag>
						))
					) : (
						<Text type="secondary">{t("adminShell.users.roles.empty")}</Text>
					)}
				</Flex>
			</Flex>
			{canManageRoles ? (
				<Flex gap={token.marginXS} vertical>
					<Text strong>{t("adminShell.users.roles.availableTitle")}</Text>
					{rolesQuery.isError ? (
						<Alert
							action={
								<Button onClick={() => void rolesQuery.refetch()} size="small">
									{t("adminShell.users.retry")}
								</Button>
							}
							description={getProblemFallback(
								rolesQuery.error,
								t("adminShell.users.errors.fallback"),
							)}
							showIcon
							title={t("adminShell.users.roles.loadRolesError")}
							type="error"
						/>
					) : null}
					<Flex gap={token.marginXS} vertical>
						{(rolesQuery.data ?? []).map((role) => {
							const assigned = activeUserRoleIds.has(role.id);
							const isUpdating =
								roleMutation.isPending && currentRoleMutationRoleId === role.id;

							return (
								<Flex align="center" gap={token.marginXS} key={role.id}>
									<Switch
										aria-label={t("adminShell.users.roles.toggle", {
											role: role.displayName,
											user: roleUser?.displayName ?? roleUser?.username,
										})}
										checked={assigned}
										disabled={userDetailQuery.isPending}
										loading={isUpdating}
										onChange={(checked) => {
											if (!roleUser) {
												return;
											}

											roleMutation.mutate({
												assigned: checked,
												roleId: role.id,
												userId: roleUser.id,
											});
										}}
										size="small"
									/>
									<span>{role.displayName}</span>
									<Text code>{role.roleKey}</Text>
								</Flex>
							);
						})}
					</Flex>
				</Flex>
			) : null}
		</Flex>
	);
	const userColumnSettingsTitle = (
		<Flex align="center" justify="space-between">
			<Checkbox
				checked={availableUserColumnKeys.every((columnKey) =>
					visibleAvailableUserColumnKeys.includes(columnKey),
				)}
				onChange={(event) => {
					setVisibleUserColumnKeys(
						event.target.checked ? [...availableUserColumnKeys] : ["username"],
					);
				}}
			>
				{t("adminShell.users.columnSettings.title")}
			</Checkbox>
			<Button
				onClick={() => {
					setUserColumnOrder([...userColumnKeys]);
					setVisibleUserColumnKeys([...availableUserColumnKeys]);
				}}
				size="small"
				type="link"
			>
				{t("adminShell.users.columnSettings.reset")}
			</Button>
		</Flex>
	);
	const userColumnSettings = (
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
					checkedKeys={visibleAvailableUserColumnKeys}
					draggable
					onCheck={(checkedKeys) => {
						const nextCheckedKeys = Array.isArray(checkedKeys)
							? checkedKeys
							: checkedKeys.checked;
						setVisibleUserColumnKeys(
							availableUserColumnKeys.filter(
								(columnKey) =>
									columnKey === "username" ||
									nextCheckedKeys.includes(columnKey),
							),
						);
					}}
					onDrop={({ dragNode, node, dropPosition }) => {
						const dragKey = dragNode.key;
						const targetKey = node.key;
						const targetPosition = Number(node.pos.split("-").at(-1));

						setUserColumnOrder((existingOrder) => {
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
					treeData={userColumnOrder
						.filter((columnKey) => availableUserColumnKeys.includes(columnKey))
						.map((columnKey) => ({
							disabled: columnKey === "username",
							key: columnKey,
							title: t(`adminShell.users.columns.${columnKey}`),
						}))}
				/>
			</ConfigProvider>
		</Flex>
	);

	const handleUserCreated = () => {
		setUserDraftFilters(defaultUserFilterValues);
		setUserFilters(defaultUserFilterValues);
		setUserTableState((existingState) => ({ ...existingState, page: 1 }));
		setCreateUserOpen(false);
	};
	const queryUsers = () => {
		setUserFilters(userDraftFilters);
		setUserTableState((existingState) => ({ ...existingState, page: 1 }));
		userQuerySubmission.submit();
	};
	const resetUserFilters = () => {
		setUserDraftFilters(defaultUserFilterValues);
		setUserFilters(defaultUserFilterValues);
		setUserTableState((existingState) => ({ ...existingState, page: 1 }));
		userQuerySubmission.submit();
	};
	const reloadUsers = () => {
		void userQuery.refetch();
	};
	const changeUserTableSize: NonNullable<MenuProps["onClick"]> = ({ key }) => {
		if (key === "large" || key === "middle" || key === "small") {
			writeUserTableDensityPreference(key);
		}
	};
	const toggleUserTableFullscreen = () => {
		const userTableWorkspace = userTableWorkspaceRef.current;

		if (!userTableWorkspace) {
			return;
		}

		if (document.fullscreenElement === userTableWorkspace) {
			void document.exitFullscreen?.();
			return;
		}

		void userTableWorkspace.requestFullscreen?.();
	};
	const handleTableChange: TableProps<PlatformUser>["onChange"] = (
		pagination,
		_filters,
		sorter,
	) => {
		const activeSorter = Array.isArray(sorter) ? sorter[0] : sorter;
		const nextSorting = resolveTableSort(
			activeSorter?.columnKey,
			activeSorter?.order,
			tableSortToContractSort,
		);

		setUserTableState((existingState) => {
			return {
				order: nextSorting.order,
				page: pagination.current ?? existingState.page,
				pageSize: pagination.pageSize ?? existingState.pageSize,
				sort: nextSorting.sort,
			};
		});
	};
	const updateCurrentUser = (values: EditUserFormValues) => {
		if (!editingUser || editingUser.version === undefined) {
			void userQuery.refetch();
			return;
		}
		updateUserMutation.mutate({
			input: { ...values, expectedVersion: editingUser.version },
			userId: editingUser.id,
		});
	};
	const resetCurrentUserPassword = (values: ResetPasswordFormValues) => {
		if (!resetPasswordUser) {
			return;
		}
		if (resetPasswordConfirmationName !== resetPasswordUser.username) {
			return;
		}

		resetPasswordMutation.mutate({
			input: values,
			userId: resetPasswordUser.id,
			username: resetPasswordUser.username,
		});
	};
	const reloadUsersAfterConflict = () => {
		updateUserMutation.reset();
		setEditingUser(null);
		void userQuery.refetch();
	};
	const closeResetPasswordResult = () => {
		setResetPasswordResult(null);
		setPasswordCopied(false);
	};
	const copyResetPassword = async () => {
		if (!resetPasswordResult) {
			return;
		}

		try {
			await navigator.clipboard.writeText(resetPasswordResult.password);
			setPasswordCopied(true);
		} catch {
			setPasswordCopied(false);
		}
	};

	return (
		<ConfigProvider
			getPopupContainer={() =>
				isUserTableFullscreen
					? (userTableWorkspaceRef.current ?? document.body)
					: document.body
			}
		>
			{canManageUsers ? (
				<CreateUserDrawer
					onClose={() => setCreateUserOpen(false)}
					onSuccess={handleUserCreated}
					open={createUserOpen}
				/>
			) : null}

			{resetPasswordResult ? (
				<Modal
					destroyOnHidden
					footer={
						<Button onClick={closeResetPasswordResult} type="primary">
							{t("adminShell.users.resetPasswordResult.done")}
						</Button>
					}
					onCancel={closeResetPasswordResult}
					open
					title={t("adminShell.users.resetPasswordResult.title", {
						name: resetPasswordResult.username,
					})}
				>
					<Flex gap={token.margin} vertical>
						<Alert
							description={t(
								resetPasswordResult.mustChangePassword
									? "adminShell.users.resetPasswordResult.mustChangePassword"
									: "adminShell.users.resetPasswordResult.passwordChanged",
							)}
							showIcon
							title={t("adminShell.users.resetPasswordResult.success")}
							type="success"
						/>
						<Flex gap={token.marginXS} vertical>
							<Text strong>
								{t("adminShell.users.resetPasswordResult.passwordLabel")}
							</Text>
							<Flex align="center" gap={token.marginXS} wrap="wrap">
								<Text code>{resetPasswordResult.password}</Text>
								<Button
									aria-label={t(
										"adminShell.users.resetPasswordResult.copyPassword",
									)}
									icon={<CopyOutlined aria-hidden />}
									onClick={() => void copyResetPassword()}
									size="small"
								>
									{t(
										passwordCopied
											? "adminShell.users.resetPasswordResult.copied"
											: "adminShell.users.resetPasswordResult.copy",
									)}
								</Button>
							</Flex>
							<Text type="secondary">
								{t("adminShell.users.resetPasswordResult.passwordHint")}
							</Text>
						</Flex>
					</Flex>
				</Modal>
			) : null}

			{forceLogoutUser ? (
				<DangerConfirmationModal
					cancelText={t("adminShell.users.forceLogout.cancel")}
					confirmText={t("adminShell.users.forceLogout.confirm")}
					feedback={
						forceLogoutMutation.isError ? (
							<Alert
								description={getProblemFallback(
									forceLogoutMutation.error,
									t("adminShell.users.errors.fallback"),
								)}
								showIcon
								title={t("adminShell.users.forceLogout.error")}
								type="error"
							/>
						) : undefined
					}
					impact={t("adminShell.users.forceLogout.impact")}
					loading={forceLogoutMutation.isPending}
					onCancel={() => {
						forceLogoutMutation.reset();
						setForceLogoutUser(null);
					}}
					onConfirm={() => forceLogoutMutation.mutate(forceLogoutUser)}
					targetName={forceLogoutUser.username}
					title={t("adminShell.users.forceLogout.title", {
						name: forceLogoutUser.username,
					})}
				/>
			) : null}

			<Modal
				cancelText={t("adminShell.users.editForm.cancel")}
				confirmLoading={updateUserMutation.isPending}
				destroyOnHidden
				okButtonProps={{
					disabled: updateUserMutation.isPending || updateUserConflict,
				}}
				okText={t("adminShell.users.editForm.submit")}
				onCancel={() => {
					updateUserMutation.reset();
					setEditingUser(null);
				}}
				onOk={() => editForm.submit()}
				open={editingUser !== null}
				title={t("adminShell.users.editForm.title", {
					name: editingUser?.username,
				})}
			>
				<Flex gap={token.margin} vertical>
					{updateUserMutation.isError ? (
						<Alert
							action={
								updateUserConflict ? (
									<Button onClick={reloadUsersAfterConflict} size="small">
										{t("optimisticLock.reload")}
									</Button>
								) : undefined
							}
							description={
								updateUserConflict
									? t("optimisticLock.description")
									: getProblemFallback(
											updateUserMutation.error,
											t("adminShell.users.errors.fallback"),
										)
							}
							showIcon
							title={
								updateUserConflict
									? t("optimisticLock.title")
									: t(
											getMutationErrorTitleKey(
												updateUserMutation.error,
												updateUserMutation.variables?.input.status ===
													"disabled"
													? "adminShell.users.errors.selfDisable"
													: "adminShell.users.errors.invalid",
											),
										)
							}
							type="error"
						/>
					) : null}
					<Form<EditUserFormValues>
						form={editForm}
						layout="vertical"
						onFinish={updateCurrentUser}
					>
						<Form.Item
							label={t("adminShell.users.createForm.displayName")}
							name="displayName"
							rules={[
								{
									max: 128,
									message: t(
										"adminShell.users.createForm.validation.displayNameRequired",
									),
									required: true,
									whitespace: true,
								},
							]}
						>
							<Input autoComplete="name" />
						</Form.Item>
						<Form.Item
							label={t("adminShell.users.columns.status")}
							name="status"
							rules={[{ required: true }]}
						>
							<Select
								aria-label={t("adminShell.users.columns.status")}
								options={[
									{
										label: t("adminShell.users.statuses.active"),
										value: "active",
									},
									{
										label: t("adminShell.users.statuses.disabled"),
										value: "disabled",
									},
								]}
							/>
						</Form.Item>
						{showsDisableWarning ? (
							<Alert
								description={t("adminShell.users.editForm.disableImpact")}
								showIcon
								title={t("dangerConfirmation.impactTitle")}
								type="warning"
							/>
						) : null}
					</Form>
				</Flex>
			</Modal>

			<Modal
				cancelText={t("adminShell.users.resetPasswordForm.cancel")}
				confirmLoading={resetPasswordMutation.isPending}
				destroyOnHidden
				okButtonProps={{
					disabled:
						resetPasswordMutation.isPending ||
						resetPasswordConfirmationName !== resetPasswordUser?.username,
				}}
				okText={t("adminShell.users.resetPasswordForm.submit")}
				onCancel={() => {
					resetPasswordMutation.reset();
					setResetPasswordConfirmationName("");
					setResetPasswordUser(null);
				}}
				onOk={() => resetPasswordForm.submit()}
				open={resetPasswordUser !== null}
				title={t("adminShell.users.resetPasswordForm.title", {
					name: resetPasswordUser?.username,
				})}
			>
				<Flex gap={token.margin} vertical>
					{resetPasswordMutation.isError ? (
						<Alert
							description={getProblemFallback(
								resetPasswordMutation.error,
								t("adminShell.users.errors.fallback"),
							)}
							showIcon
							title={t(getMutationErrorTitleKey(resetPasswordMutation.error))}
							type="error"
						/>
					) : null}
					<Form<ResetPasswordFormValues>
						form={resetPasswordForm}
						layout="vertical"
						onFinish={resetCurrentUserPassword}
					>
						<Form.Item
							label={t("adminShell.users.resetPasswordForm.password")}
							name="password"
							rules={[
								{
									message: t(
										"adminShell.users.createForm.validation.passwordRequired",
									),
									required: true,
								},
								{
									min: 12,
									message: t(
										"adminShell.users.createForm.validation.passwordLength",
									),
								},
							]}
						>
							<Input.Password
								autoComplete="new-password"
								placeholder={t(
									"adminShell.users.resetPasswordForm.placeholder",
								)}
							/>
						</Form.Item>
						{resetPasswordUser ? (
							<DangerConfirmationContent
								impact={t("adminShell.users.resetPasswordForm.impact")}
								onChange={setResetPasswordConfirmationName}
								targetName={resetPasswordUser.username}
								value={resetPasswordConfirmationName}
							/>
						) : null}
					</Form>
				</Flex>
			</Modal>

			<Drawer
				destroyOnHidden
				extra={roleDrawerExtra}
				loading={userDetailQuery.isPending}
				onClose={() => {
					roleMutation.reset();
					setRoleUser(null);
				}}
				open={roleUser !== null}
				size="large"
				title={t("adminShell.users.roles.title", {
					name: roleUser?.username,
				})}
			>
				{roleDrawerContent}
			</Drawer>

			<Flex
				data-testid="admin-users-table-workspace"
				gap={token.marginLG}
				ref={userTableWorkspaceRef}
				style={
					isUserTableFullscreen
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
				{pageError ? (
					<Alert
						action={
							<Button onClick={() => void userQuery.refetch()} size="small">
								{t("adminShell.users.retry")}
							</Button>
						}
						description={getProblemFallback(
							pageError,
							t("adminShell.users.errors.fallback"),
						)}
						showIcon
						title={t("adminShell.users.errors.request")}
						type="error"
					/>
				) : null}
				<Card>
					<div ref={userQueryFilterContainerRef}>
						<Form
							data-testid="admin-users-query-form"
							{...(userQueryFilterLayout === "horizontal"
								? {
										labelCol: { flex: `0 0 ${token.controlHeightLG * 2}px` },
										wrapperCol: {
											style: {
												maxWidth: `calc(100% - ${token.controlHeightLG * 2}px)`,
											},
										},
									}
								: {})}
							layout={userQueryFilterLayout}
							onFinish={queryUsers}
						>
							<Row gutter={token.marginLG} justify="start">
								<Col span={userQueryFilterSpan}>
									<Form.Item
										label={t("adminShell.users.filters.q")}
										style={{ marginBottom: 0 }}
									>
										<Input
											allowClear
											onChange={(event) =>
												setUserDraftFilters((existingFilters) => ({
													...existingFilters,
													q: event.target.value,
												}))
											}
											placeholder={t("adminShell.users.placeholders.q")}
											style={{ width: "100%" }}
											value={userDraftFilters.q}
										/>
									</Form.Item>
								</Col>
								<Col span={userQueryFilterSpan}>
									<Form.Item
										label={t("adminShell.users.filters.status")}
										style={{ marginBottom: 0 }}
									>
										<Select
											aria-label={t("adminShell.users.filters.status")}
											onChange={(status: UserFilterValues["status"]) =>
												setUserDraftFilters((existingFilters) => ({
													...existingFilters,
													status,
												}))
											}
											options={[
												{
													label: t("adminShell.users.allStatuses"),
													value: "all",
												},
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
											value={userDraftFilters.status}
										/>
									</Form.Item>
								</Col>
								<Col
									data-testid="admin-users-query-actions"
									offset={userQueryFilterSubmitterOffset}
									span={userQueryFilterSpan}
									style={{ textAlign: "end" }}
								>
									<Form.Item
										colon={false}
										label=" "
										shouldUpdate={false}
										style={{ marginBottom: 0, width: "100%" }}
									>
										<QueryFilterSubmitter
											loading={userQuery.isFetching && !userQuery.isPending}
											onReset={resetUserFilters}
											queryText={t("adminShell.users.query")}
											resetText={t("adminShell.users.reset")}
										/>
									</Form.Item>
								</Col>
							</Row>
						</Form>
					</div>
				</Card>

				<Card
					data-testid="admin-users-table-card"
					extra={
						<Space>
							{canManageUsers ? (
								<Button
									icon={<PlusOutlined aria-hidden />}
									onClick={() => setCreateUserOpen(true)}
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
									loading={userQuery.isFetching && !userQuery.isPending}
									onClick={reloadUsers}
									variant="link"
								/>
							</Tooltip>
							<Dropdown
								menu={{
									items: [
										{
											key: "large",
											label: t("adminShell.users.densityOptions.large"),
										},
										{
											key: "middle",
											label: t("adminShell.users.densityOptions.middle"),
										},
										{
											key: "small",
											label: t("adminShell.users.densityOptions.small"),
										},
									],
									onClick: changeUserTableSize,
									selectedKeys: [userTableSize],
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
								content={userColumnSettings}
								placement="bottomRight"
								title={userColumnSettingsTitle}
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
									isUserTableFullscreen
										? "adminShell.users.exitFullscreen"
										: "adminShell.users.fullscreen",
								)}
							>
								<Button
									aria-label={t(
										isUserTableFullscreen
											? "adminShell.users.exitFullscreen"
											: "adminShell.users.fullscreen",
									)}
									color="default"
									icon={
										isUserTableFullscreen ? (
											<FullscreenExitOutlined aria-hidden />
										) : (
											<FullscreenOutlined aria-hidden />
										)
									}
									onClick={toggleUserTableFullscreen}
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
						columns={userTableColumns}
						dataSource={userRows}
						loading={userQuery.isFetching}
						locale={{ emptyText: t("adminShell.users.empty") }}
						onChange={handleTableChange}
						pagination={{
							current: userQuery.data?.page ?? userTableState.page,
							pageSize: userQuery.data?.pageSize ?? userTableState.pageSize,
							pageSizeOptions: [10, 20, 50, 100],
							placement: ["bottomEnd"],
							showSizeChanger: true,
							showTotal: (total, [start, end]) =>
								t("adminShell.users.paginationTotal", {
									end,
									start,
									total,
								}),
							total: userQuery.data?.total ?? 0,
						}}
						rowKey="id"
						scroll={{ x: userTableMinimumWidth }}
						size={userTableSize}
						tableLayout="fixed"
					/>
				</Card>
			</Flex>
		</ConfigProvider>
	);
}
