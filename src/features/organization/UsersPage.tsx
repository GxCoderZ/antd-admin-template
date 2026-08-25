import {
	ColumnHeightOutlined,
	CopyOutlined,
	DeleteOutlined,
	FullscreenExitOutlined,
	FullscreenOutlined,
	KeyOutlined,
	LogoutOutlined,
	PlusOutlined,
	ReloadOutlined,
	SettingOutlined,
	TeamOutlined,
} from "@ant-design/icons";
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
import {
	TableActionButton,
	TableActionMenu,
} from "../../app/TableActionButton";
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
import { LogQueryPanel } from "../operations/LogTablePanel";
import { CreateUserDrawer } from "./CreateUserDrawer";
import {
	UserEditModal,
	type UserEditFormValues,
} from "./components/UserEditModal";
import {
	getProblemFallback,
	getUserMutationErrorTitleKey as getMutationErrorTitleKey,
} from "./userProblems";
import {
	deletePlatformUser,
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
} from "#src/api/users";

const { Link, Text } = Typography;
const defaultUserFilterValues: UserFilterValues = { status: "all" };
const userQueryFilterFieldCount = 2;
const userColumnKeys = [
	"id",
	"username",
	"displayName",
	"department",
	"jobTitle",
	"roles",
	"phone",
	"email",
	"status",
	"authSource",
	"mfaEnabled",
	"mustChangePassword",
	"lastLoginAt",
	"lastLoginIp",
	"createdAt",
	"updatedAt",
	"actions",
] as const;
type UserColumnKey = (typeof userColumnKeys)[number];
const requiredUserColumnKeys = ["username", "status", "actions"] as const;
const defaultVisibleUserColumnKeys = [
	"username",
	"displayName",
	"department",
	"roles",
	"phone",
	"email",
	"status",
	"lastLoginAt",
	"createdAt",
	"actions",
] satisfies readonly UserColumnKey[];
const userColumnWidthMultipliers: Record<UserColumnKey, number> = {
	actions: 4,
	authSource: 3,
	createdAt: 5,
	department: 4,
	displayName: 5,
	email: 7,
	id: 5,
	jobTitle: 4,
	lastLoginAt: 5,
	lastLoginIp: 4,
	mfaEnabled: 3,
	mustChangePassword: 3,
	phone: 4,
	roles: 6,
	status: 3,
	updatedAt: 5,
	username: 4,
};
const userStatusBadgeByStatus: Record<
	PlatformUser["status"],
	"default" | "error" | "success"
> = {
	active: "success",
	disabled: "default",
	locked: "error",
};
const userAuthSourceTagColor: Record<
	PlatformUser["authSource"],
	"blue" | "cyan" | "default"
> = {
	ldap: "cyan",
	local: "default",
	sso: "blue",
};
const tableSortToContractSort: Record<
	string,
	NonNullable<ListPlatformUsersInput["sort"]>
> = {
	authSource: "auth_source",
	createdAt: "created_at",
	department: "department",
	displayName: "display_name",
	email: "email",
	lastLoginAt: "last_login_at",
	phone: "phone",
	status: "status",
	updatedAt: "updated_at",
	username: "username",
};

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
	const [deletingUser, setDeletingUser] = useState<PlatformUser | null>(null);
	const [roleUser, setRoleUser] = useState<PlatformUser | null>(null);
	const [resetPasswordForm] = Form.useForm<ResetPasswordFormValues>();
	const [userFilterForm] = Form.useForm<UserFilterValues>();
	const [userDraftFilters, setUserDraftFilters] = useState<UserFilterValues>(
		defaultUserFilterValues,
	);
	const [userFilters, setUserFilters] = useState<UserFilterValues>(
		defaultUserFilterValues,
	);
	const [userFiltersExpanded, setUserFiltersExpanded] = useState(false);
	const [userTableState, setUserTableState] = useState<UserTableState>({
		order: "desc",
		page: 1,
		pageSize: 20,
		sort: "created_at",
	});
	const userQuerySubmission = useQuerySubmission();
	const {
		canExpand: canExpandUserFilters,
		collapsedFieldCount: collapsedUserFilterCount,
		columnSpan: userQueryFilterSpan,
		containerRef: userQueryFilterContainerRef,
		formLayout: userQueryFilterLayout,
		submitterOffset: userQueryFilterSubmitterOffset,
	} = useQueryFilterLayout({
		expanded: userFiltersExpanded,
		fieldCount: userQueryFilterFieldCount,
	});
	const showUserStatusFilter =
		userFiltersExpanded || collapsedUserFilterCount >= 2;
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
	const deleteUserMutation = useMutation({
		mutationFn: async (user: PlatformUser) => {
			await deletePlatformUser(user.id);
			return user;
		},
		onSuccess: async () => {
			setDeletingUser(null);
			await refreshUsers();
		},
	});
	const roleMutation = useMutation({
		mutationFn: setPlatformUserRole,
		onSuccess: async (_data, variables) => {
			await Promise.all([refreshUsers(), refreshUserDetail(variables.userId)]);
		},
	});
	const userRows = userQuery.data?.items ?? [];
	const currentUserId = sessionQuery.data?.user.id;
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
	>([...defaultVisibleUserColumnKeys]);
	const userTableWorkspaceRef = useRef<HTMLDivElement>(null);
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
	const userTableMinimumWidth = visibleAvailableUserColumnKeys.reduce(
		(totalWidth, columnKey) =>
			totalWidth + token.controlHeight * userColumnWidthMultipliers[columnKey],
		token.controlHeight * 2,
	);

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
				dataIndex: "id",
				key: "id",
				render: (id: string) => <Text code>{id}</Text>,
				title: t("adminShell.users.columns.id"),
				width: token.controlHeight * userColumnWidthMultipliers.id,
			},
			{
				dataIndex: "username",
				key: "username",
				sortDirections: ["ascend", "descend"],
				sorter: true,
				sortOrder: sortOrder("username"),
				title: t("adminShell.users.columns.username"),
				width: token.controlHeight * userColumnWidthMultipliers.username,
			},
			{
				dataIndex: "displayName",
				key: "displayName",
				sortDirections: ["ascend", "descend"],
				sorter: true,
				sortOrder: sortOrder("display_name"),
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
				width: token.controlHeight * userColumnWidthMultipliers.displayName,
			},
			{
				dataIndex: "department",
				key: "department",
				sortDirections: ["ascend", "descend"],
				sorter: true,
				sortOrder: sortOrder("department"),
				title: t("adminShell.users.columns.department"),
				width: token.controlHeight * userColumnWidthMultipliers.department,
				render: (department: PlatformUser["department"]) =>
					t(`adminShell.users.departments.${department}`),
			},
			{
				dataIndex: "jobTitle",
				key: "jobTitle",
				render: (jobTitle: string) =>
					jobTitle || <Text type="secondary">-</Text>,
				title: t("adminShell.users.columns.jobTitle"),
				width: token.controlHeight * userColumnWidthMultipliers.jobTitle,
			},
			{
				dataIndex: "roles",
				key: "roles",
				render: (roles: PlatformUser["roles"]) =>
					roles.length > 0 ? (
						<Space size={[token.marginXXS, token.marginXXS]} wrap>
							{roles.slice(0, 2).map((role) => (
								<Tag key={role.id}>{role.displayName}</Tag>
							))}
							{roles.length > 2 ? (
								<Tooltip
									title={roles
										.slice(2)
										.map((role) => role.displayName)
										.join("、")}
								>
									<Tag>+{roles.length - 2}</Tag>
								</Tooltip>
							) : null}
						</Space>
					) : (
						<Text type="secondary">-</Text>
					),
				title: t("adminShell.users.columns.roles"),
				width: token.controlHeight * userColumnWidthMultipliers.roles,
			},
			{
				dataIndex: "phone",
				key: "phone",
				render: (phone: string) => phone || <Text type="secondary">-</Text>,
				sortDirections: ["ascend", "descend"],
				sorter: true,
				sortOrder: sortOrder("phone"),
				title: t("adminShell.users.columns.phone"),
				width: token.controlHeight * userColumnWidthMultipliers.phone,
			},
			{
				dataIndex: "email",
				key: "email",
				sortDirections: ["ascend", "descend"],
				sorter: true,
				sortOrder: sortOrder("email"),
				title: t("adminShell.users.columns.email"),
				width: token.controlHeight * userColumnWidthMultipliers.email,
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
				width: token.controlHeight * userColumnWidthMultipliers.status,
			},
			{
				dataIndex: "authSource",
				key: "authSource",
				render: (authSource: PlatformUser["authSource"]) => (
					<Tag color={userAuthSourceTagColor[authSource]}>
						{t(`adminShell.users.authSources.${authSource}`)}
					</Tag>
				),
				sortDirections: ["ascend", "descend"],
				sorter: true,
				sortOrder: sortOrder("auth_source"),
				title: t("adminShell.users.columns.authSource"),
				width: token.controlHeight * userColumnWidthMultipliers.authSource,
			},
			{
				dataIndex: "mfaEnabled",
				key: "mfaEnabled",
				render: (enabled: boolean) => (
					<Badge
						status={enabled ? "success" : "default"}
						text={t(
							enabled
								? "adminShell.users.columnValues.enabled"
								: "adminShell.users.columnValues.disabled",
						)}
					/>
				),
				title: t("adminShell.users.columns.mfaEnabled"),
				width: token.controlHeight * userColumnWidthMultipliers.mfaEnabled,
			},
			{
				dataIndex: "mustChangePassword",
				key: "mustChangePassword",
				render: (mustChangePassword?: boolean) => (
					<Badge
						status={mustChangePassword ? "warning" : "success"}
						text={t(
							mustChangePassword
								? "adminShell.users.columnValues.changeRequired"
								: "adminShell.users.columnValues.normal",
						)}
					/>
				),
				title: t("adminShell.users.columns.mustChangePassword"),
				width:
					token.controlHeight * userColumnWidthMultipliers.mustChangePassword,
			},
			{
				dataIndex: "lastLoginAt",
				key: "lastLoginAt",
				render: (lastLoginAt: string | null) =>
					lastLoginAt ? (
						formatDateTime(lastLoginAt, formatPreferences)
					) : (
						<Text type="secondary">
							{t("adminShell.users.columnValues.never")}
						</Text>
					),
				sortDirections: ["ascend", "descend"],
				sorter: true,
				sortOrder: sortOrder("last_login_at"),
				title: t("adminShell.users.columns.lastLoginAt"),
				width: token.controlHeight * userColumnWidthMultipliers.lastLoginAt,
			},
			{
				dataIndex: "lastLoginIp",
				key: "lastLoginIp",
				render: (lastLoginIp: string | null) =>
					lastLoginIp ? (
						<Text code>{lastLoginIp}</Text>
					) : (
						<Text type="secondary">-</Text>
					),
				title: t("adminShell.users.columns.lastLoginIp"),
				width: token.controlHeight * userColumnWidthMultipliers.lastLoginIp,
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
				width: token.controlHeight * userColumnWidthMultipliers.createdAt,
			},
			{
				dataIndex: "updatedAt",
				key: "updatedAt",
				render: (updatedAt: string) =>
					formatDateTime(updatedAt, formatPreferences),
				sortDirections: ["ascend", "descend"],
				sorter: true,
				sortOrder: sortOrder("updated_at"),
				title: t("adminShell.users.columns.updatedAt"),
				width: token.controlHeight * userColumnWidthMultipliers.updatedAt,
			},
		];

		dataColumns.push({
			key: "actions",
			render: (_: unknown, row: PlatformUser) => (
				<Space size="medium">
					{canManageUsers ? (
						<TableActionButton
							onClick={() => {
								updateUserMutation.reset();
								setEditingUser(row);
							}}
						>
							{t("adminShell.users.edit")}
						</TableActionButton>
					) : null}
					<TableActionMenu
						items={[
							{
								icon: <TeamOutlined aria-hidden />,
								key: "roles",
								label: t("adminShell.users.roles.action"),
								onClick: () => {
									roleMutation.reset();
									setRoleUser(row);
								},
							},
							...(canManageUsers
								? [
										{
											icon: <KeyOutlined aria-hidden />,
											key: "resetPassword",
											label: t("adminShell.users.resetPassword"),
											onClick: () => {
												resetPasswordMutation.reset();
												resetPasswordForm.resetFields();
												setResetPasswordConfirmationName("");
												setResetPasswordResult(null);
												setPasswordCopied(false);
												setResetPasswordUser(row);
											},
										},
									]
								: []),
							...(canManageUsers && currentUserId && row.id !== currentUserId
								? [
										{
											danger: true,
											icon: <LogoutOutlined aria-hidden />,
											key: "forceLogout",
											label: t("adminShell.users.forceLogout.action"),
											onClick: () => {
												forceLogoutMutation.reset();
												setForceLogoutUser(row);
											},
										},
									]
								: []),
							...(canManageUsers && currentUserId && row.id !== currentUserId
								? [
										{
											danger: true,
											icon: <DeleteOutlined aria-hidden />,
											key: "delete",
											label: t("adminShell.users.delete"),
											onClick: () => {
												deleteUserMutation.reset();
												setDeletingUser(row);
											},
										},
									]
								: []),
						]}
						label={t("adminShell.tableActions.more")}
					/>
				</Space>
			),
			title: t("adminShell.users.columns.actions"),
			width: token.controlHeight * userColumnWidthMultipliers.actions,
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
		deleteUserMutation,
		forceLogoutMutation,
		formatPreferences,
		resetPasswordForm,
		resetPasswordMutation,
		roleMutation,
		t,
		token.controlHeight,
		token.marginXXS,
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
				indeterminate={
					visibleAvailableUserColumnKeys.length > 0 &&
					visibleAvailableUserColumnKeys.length < availableUserColumnKeys.length
				}
				onChange={(event) => {
					setVisibleUserColumnKeys(
						event.target.checked
							? [...availableUserColumnKeys]
							: [...requiredUserColumnKeys],
					);
				}}
			>
				{t("adminShell.users.columnSettings.title")}
			</Checkbox>
			<Button
				onClick={() => {
					setUserColumnOrder([...userColumnKeys]);
					setVisibleUserColumnKeys([...defaultVisibleUserColumnKeys]);
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
						availableUserColumnKeys.filter((columnKey) => {
							const isRequired = requiredUserColumnKeys.some(
								(requiredColumnKey) => requiredColumnKey === columnKey,
							);
							return isRequired || nextCheckedKeys.includes(columnKey);
						}),
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
						disabled: requiredUserColumnKeys.some(
							(requiredColumnKey) => requiredColumnKey === columnKey,
						),
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
	const updateCurrentUser = (values: UserEditFormValues) => {
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

			{deletingUser ? (
				<DangerConfirmationModal
					cancelText={t("adminShell.users.deleteForm.cancel")}
					confirmText={t("adminShell.users.deleteForm.confirm")}
					feedback={
						deleteUserMutation.isError ? (
							<Alert
								description={getProblemFallback(
									deleteUserMutation.error,
									t("adminShell.users.errors.fallback"),
								)}
								showIcon
								title={t("adminShell.users.deleteForm.error")}
								type="error"
							/>
						) : undefined
					}
					impact={t("adminShell.users.deleteForm.impact")}
					loading={deleteUserMutation.isPending}
					onCancel={() => {
						deleteUserMutation.reset();
						setDeletingUser(null);
					}}
					onConfirm={() => deleteUserMutation.mutate(deletingUser)}
					targetName={deletingUser.username}
					title={t("adminShell.users.deleteForm.title")}
				/>
			) : null}

			<UserEditModal
				error={updateUserMutation.error}
				loading={updateUserMutation.isPending}
				onCancel={() => {
					updateUserMutation.reset();
					setEditingUser(null);
				}}
				onReloadConflict={reloadUsersAfterConflict}
				onSubmit={updateCurrentUser}
				requestedStatus={updateUserMutation.variables?.input.status}
				user={editingUser}
			/>

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
				<LogQueryPanel<UserFilterValues>
					actionsTestId="admin-users-query-actions"
					canExpand={canExpandUserFilters}
					columnSpan={userQueryFilterSpan}
					containerRef={userQueryFilterContainerRef}
					expanded={userFiltersExpanded}
					form={userFilterForm}
					formLayout={userQueryFilterLayout}
					initialValues={defaultUserFilterValues}
					loading={userQuery.isFetching && !userQuery.isPending}
					onFinish={queryUsers}
					onReset={resetUserFilters}
					onToggle={() => setUserFiltersExpanded((expanded) => !expanded)}
					submitterOffset={userQueryFilterSubmitterOffset}
					testId="admin-users-query-form"
				>
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
					{showUserStatusFilter ? (
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
					) : null}
				</LogQueryPanel>

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
