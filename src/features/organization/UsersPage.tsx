import {
	keepPreviousData,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { Alert, Form, type TableProps } from "antd";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { DangerConfirmationModal } from "../../app/DangerConfirmation";
import { platformPermissions, usePermission } from "../../app/permissions";
import { useQuerySubmission } from "../../app/queryFilterLayout";
import { resolveTableSort } from "../../app/tableSorting";
import {
	listPlatformRoles,
	platformRolesQueryKey,
	setPlatformUserRole,
} from "#src/api/roles";
import { getPlatformSession, platformSessionQueryKey } from "#src/api/auth";
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
} from "#src/api/users";
import { CreateUserDrawer } from "./CreateUserDrawer";
import {
	UserEditModal,
	type UserEditFormValues,
} from "./components/UserEditModal";
import {
	ResetPasswordModal,
	ResetPasswordResultModal,
	type ResetPasswordResultView,
} from "./components/UserPasswordModals";
import { UserRolesDrawer } from "./components/UserRolesDrawer";
import { UsersTablePanel } from "./components/UsersTablePanel";
import { getProblemFallback } from "./userProblems";
import {
	defaultUserFilterValues,
	type UserFilterValues,
	type UserTableState,
	userTableSortToContractSort,
} from "./userTableTypes";

interface ResetPasswordMutationInput {
	input: ResetPlatformUserPasswordInput;
	userId: string;
	username: string;
}

export function UsersPage() {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
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
	const [resetPasswordForm] = Form.useForm<ResetPlatformUserPasswordInput>();
	const [userFilterForm] = Form.useForm<UserFilterValues>();
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
	const userQueryParams = useMemo<ListPlatformUsersInput>(() => {
		const q = userFilters.q?.trim();
		const params: ListPlatformUsersInput = {
			page: userTableState.page,
			pageSize: userTableState.pageSize,
			...(userTableState.order && userTableState.sort
				? { order: userTableState.order, sort: userTableState.sort }
				: {}),
		};
		if (q) {
			params.q = q;
		}
		if (userFilters.status !== "all") {
			params.status = userFilters.status;
		}
		return params;
	}, [userFilters, userTableState]);
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

	const handleTableChange: NonNullable<TableProps<PlatformUser>["onChange"]> = (
		pagination,
		_filters,
		sorter,
	) => {
		const activeSorter = Array.isArray(sorter) ? sorter[0] : sorter;
		const nextSorting = resolveTableSort(
			activeSorter?.columnKey,
			activeSorter?.order,
			userTableSortToContractSort,
		);
		setUserTableState((existingState) => ({
			order: nextSorting.order,
			page: pagination.current ?? existingState.page,
			pageSize: pagination.pageSize ?? existingState.pageSize,
			sort: nextSorting.sort,
		}));
	};
	const updateCurrentUser = (values: UserEditFormValues) => {
		if (!editingUser || editingUser.version === undefined) {
			void userQuery.refetch();
			return;
		}
		updateUserMutation.mutate({
			input: {
				...values,
				displayName: values.displayName.trim(),
				email: values.email.trim(),
				expectedVersion: editingUser.version,
				jobTitle: values.jobTitle.trim(),
				phone: values.phone.trim(),
			},
			userId: editingUser.id,
		});
	};
	const queryUsers = () => {
		setUserFilters(userDraftFilters);
		setUserTableState((state) => ({ ...state, page: 1 }));
		userQuerySubmission.submit();
	};
	const resetUserFilters = () => {
		setUserDraftFilters(defaultUserFilterValues);
		setUserFilters(defaultUserFilterValues);
		setUserTableState((state) => ({ ...state, page: 1 }));
		userQuerySubmission.submit();
	};

	return (
		<UsersTablePanel
			overlays={
				<>
					{canManageUsers ? (
						<CreateUserDrawer
							onClose={() => setCreateUserOpen(false)}
							onSuccess={() => {
								setUserDraftFilters(defaultUserFilterValues);
								setUserFilters(defaultUserFilterValues);
								setUserTableState((state) => ({ ...state, page: 1 }));
								setCreateUserOpen(false);
							}}
							open={createUserOpen}
						/>
					) : null}
					<ResetPasswordResultModal
						copied={passwordCopied}
						onClose={() => {
							setResetPasswordResult(null);
							setPasswordCopied(false);
						}}
						onCopy={() => {
							if (resetPasswordResult) {
								void navigator.clipboard
									.writeText(resetPasswordResult.password)
									.then(
										() => setPasswordCopied(true),
										() => setPasswordCopied(false),
									);
							}
						}}
						result={resetPasswordResult}
					/>
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
						onReloadConflict={() => {
							updateUserMutation.reset();
							setEditingUser(null);
							void userQuery.refetch();
						}}
						onSubmit={updateCurrentUser}
						requestedStatus={updateUserMutation.variables?.input.status}
						user={editingUser}
					/>
					<ResetPasswordModal
						confirmationName={resetPasswordConfirmationName}
						error={resetPasswordMutation.error}
						form={resetPasswordForm}
						loading={resetPasswordMutation.isPending}
						onCancel={() => {
							resetPasswordMutation.reset();
							setResetPasswordConfirmationName("");
							setResetPasswordUser(null);
						}}
						onConfirmationNameChange={setResetPasswordConfirmationName}
						onSubmit={(values) => {
							if (
								resetPasswordUser &&
								resetPasswordConfirmationName === resetPasswordUser.username
							) {
								resetPasswordMutation.mutate({
									input: values,
									userId: resetPasswordUser.id,
									username: resetPasswordUser.username,
								});
							}
						}}
						user={resetPasswordUser}
					/>
					<UserRolesDrawer
						availableRoles={rolesQuery.data ?? []}
						canManageRoles={canManageRoles}
						detailError={userDetailQuery.error}
						detailLoading={userDetailQuery.isPending}
						mutationError={roleMutation.error}
						onClose={() => {
							roleMutation.reset();
							setRoleUser(null);
						}}
						onRetryDetail={() => void userDetailQuery.refetch()}
						onRetryRoles={() => void rolesQuery.refetch()}
						onToggleRole={(roleId, assigned) => {
							if (roleUser) {
								roleMutation.mutate({ assigned, roleId, userId: roleUser.id });
							}
						}}
						rolesError={rolesQuery.error}
						user={roleUser}
						userRoles={userDetailQuery.data?.roles ?? []}
						updatingRoleId={
							roleMutation.isPending
								? roleMutation.variables?.roleId
								: undefined
						}
					/>
				</>
			}
			canManageUsers={canManageUsers}
			currentUserId={sessionQuery.data?.user.id}
			data={userQuery.data}
			draftFilters={userDraftFilters}
			error={userQuery.error}
			filterForm={userFilterForm}
			initialLoading={userQuery.isPending}
			onCreate={() => setCreateUserOpen(true)}
			onDelete={(user) => {
				deleteUserMutation.reset();
				setDeletingUser(user);
			}}
			onDraftFiltersChange={setUserDraftFilters}
			onEdit={(user) => {
				updateUserMutation.reset();
				setEditingUser(user);
			}}
			onForceLogout={(user) => {
				forceLogoutMutation.reset();
				setForceLogoutUser(user);
			}}
			onManageRoles={(user) => {
				roleMutation.reset();
				setRoleUser(user);
			}}
			onQuery={queryUsers}
			onReload={() => void userQuery.refetch()}
			onResetFilters={resetUserFilters}
			onResetPassword={(user) => {
				resetPasswordMutation.reset();
				resetPasswordForm.resetFields();
				setResetPasswordConfirmationName("");
				setResetPasswordResult(null);
				setPasswordCopied(false);
				setResetPasswordUser(user);
			}}
			onTableChange={handleTableChange}
			refreshing={userQuery.isFetching && !userQuery.isPending}
			tableState={userTableState}
		/>
	);
}
