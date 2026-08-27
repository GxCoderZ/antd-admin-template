import {
	Alert,
	Button,
	Drawer,
	Flex,
	Select,
	Tag,
	theme,
	Typography,
} from "antd";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import type { PlatformRole } from "#src/api/roles";
import type { PlatformUser } from "#src/api/users";
import { useDiscardChanges } from "../../../app/useDiscardChanges";
import {
	getProblemFallback,
	getUserMutationErrorTitleKey,
} from "../userProblems";

const { Text } = Typography;

type RoleOption = PlatformUser["roles"][number] &
	Partial<Pick<PlatformRole, "memberCount" | "permissions" | "version">> & {
		description?: string;
		disabled?: boolean;
		status?: string;
	};

interface UserRolesDrawerProps {
	availableRoles: RoleOption[];
	canManageRoles: boolean;
	detailError: unknown;
	detailLoading: boolean;
	mutationError: unknown;
	onClose: () => void;
	onRetryDetail: () => void;
	onRetryRoles: () => void;
	onSaveRoles: (roleIds: string[]) => void;
	rolesError: unknown;
	saving: boolean;
	user: PlatformUser | null;
	userRoles: RoleOption[];
}

export function UserRolesDrawer({
	availableRoles,
	canManageRoles,
	detailError,
	detailLoading,
	mutationError,
	onClose,
	onRetryDetail,
	onRetryRoles,
	onSaveRoles,
	rolesError,
	saving,
	user,
	userRoles,
}: UserRolesDrawerProps) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const initialRoleIds = useMemo(
		() => userRoles.map((role) => role.id),
		[userRoles],
	);
	const [draftRoleIdsOverride, setDraftRoleIdsOverride] = useState<{
		roleIds: string[];
		userId: string;
	} | null>(null);
	const matchingDraftRoleIds =
		draftRoleIdsOverride && draftRoleIdsOverride.userId === user?.id
			? draftRoleIdsOverride.roleIds
			: null;
	const draftRoleIds = matchingDraftRoleIds ?? initialRoleIds;
	const draftRoleIdSet = useMemo(() => new Set(draftRoleIds), [draftRoleIds]);
	const roleOptions = useMemo(() => {
		const rolesById = new Map<string, RoleOption>();
		for (const role of userRoles) rolesById.set(role.id, role);
		for (const role of availableRoles) rolesById.set(role.id, role);
		return [...rolesById.values()];
	}, [availableRoles, userRoles]);
	const rolesById = useMemo(
		() => new Map(roleOptions.map((role) => [role.id, role])),
		[roleOptions],
	);
	const addedRoles = draftRoleIds
		.filter((roleId) => !initialRoleIds.includes(roleId))
		.map((roleId) => rolesById.get(roleId))
		.filter((role): role is RoleOption => role !== undefined);
	const removedRoles = initialRoleIds
		.filter((roleId) => !draftRoleIdSet.has(roleId))
		.map((roleId) => rolesById.get(roleId))
		.filter((role): role is RoleOption => role !== undefined);
	const hasDraftChanges = addedRoles.length > 0 || removedRoles.length > 0;
	const discard = useDiscardChanges({
		isDirty: () => hasDraftChanges,
		onDiscard: () => {
			setDraftRoleIdsOverride(null);
			onClose();
		},
		saving,
	});

	const isHighPrivilegeRole = (role: RoleOption) =>
		role.roleKey.includes("admin") ||
		(role.permissions ?? []).some((permission) =>
			[
				"platform.roles.manage",
				"platform.settings.manage",
				"platform.users.manage",
			].includes(permission),
		);
	const isDisabledRole = (role: RoleOption) =>
		role.disabled === true || role.status === "disabled";
	const getRoleDescription = (role: RoleOption) =>
		role.description ??
		(role.permissions && role.permissions.length > 0
			? t("adminShell.users.roles.permissionSummary", {
					count: role.permissions.length,
				})
			: t("adminShell.users.roles.noPermissionSummary"));
	const renderRoleTags = (roles: RoleOption[]) =>
		roles.length > 0 ? (
			<Flex gap={token.marginXS} wrap="wrap">
				{roles.map((role) => (
					<Tag key={role.id}>{role.displayName}</Tag>
				))}
			</Flex>
		) : (
			<Text type="secondary">{t("adminShell.users.roles.noChange")}</Text>
		);

	return (
		<Drawer
			destroyOnHidden
			size="min(560px, 100vw)"
			extra={
				<Text type="secondary">
					{t(
						canManageRoles
							? "adminShell.users.roles.manageHint"
							: "adminShell.users.roles.readOnlyHint",
					)}
				</Text>
			}
			footer={
				canManageRoles ? (
					<Flex
						align="center"
						gap={token.marginXS}
						justify="space-between"
						wrap="wrap"
					>
						<Text type={hasDraftChanges ? "warning" : "secondary"}>
							{hasDraftChanges
								? t("adminShell.users.roles.unsaved")
								: t("adminShell.users.roles.noUnsaved")}
						</Text>
						<Flex gap={token.marginXS}>
							<Button disabled={saving} onClick={discard.requestClose}>
								{t("adminShell.users.editForm.cancel")}
							</Button>
							<Button
								disabled={saving}
								onClick={() => setDraftRoleIdsOverride(null)}
							>
								{t("adminShell.users.roles.reset")}
							</Button>
							<Button
								disabled={
									!hasDraftChanges || detailLoading || Boolean(rolesError)
								}
								loading={saving}
								onClick={() => onSaveRoles(draftRoleIds)}
								type="primary"
							>
								{t("adminShell.users.roles.save")}
							</Button>
						</Flex>
					</Flex>
				) : null
			}
			loading={detailLoading}
			onClose={discard.requestClose}
			closable={!saving}
			keyboard={!saving}
			mask={{ closable: !saving }}
			open={user !== null}
			title={t("adminShell.users.roles.title", { name: user?.username })}
		>
			{discard.contextHolder}
			<Flex gap={token.marginLG} vertical>
				{detailError ? (
					<Alert
						action={
							<Button onClick={onRetryDetail} size="small">
								{t("adminShell.users.retry")}
							</Button>
						}
						description={getProblemFallback(
							detailError,
							t("adminShell.users.errors.fallback"),
						)}
						showIcon
						title={t("adminShell.users.roles.loadError")}
						type="error"
					/>
				) : null}
				{mutationError ? (
					<Alert
						description={getProblemFallback(
							mutationError,
							t("adminShell.users.errors.fallback"),
						)}
						showIcon
						title={t(
							getUserMutationErrorTitleKey(
								mutationError,
								"adminShell.users.roles.errors.invalid",
								"adminShell.users.roles.errors.conflict",
							),
						)}
						type="error"
					/>
				) : null}
				<Flex gap={token.marginXS} vertical>
					<Text strong>{t("adminShell.users.roles.assignedTitle")}</Text>
					{renderRoleTags(userRoles)}
				</Flex>
				{canManageRoles ? (
					<Flex gap={token.marginXS} vertical>
						<Text strong>{t("adminShell.users.roles.availableTitle")}</Text>
						{rolesError ? (
							<Alert
								action={
									<Button onClick={onRetryRoles} size="small">
										{t("adminShell.users.retry")}
									</Button>
								}
								description={getProblemFallback(
									rolesError,
									t("adminShell.users.errors.fallback"),
								)}
								showIcon
								title={t("adminShell.users.roles.loadRolesError")}
								type="error"
							/>
						) : null}
						<Select
							aria-label={t("adminShell.users.roles.selectorLabel")}
							disabled={saving || detailLoading || Boolean(rolesError)}
							maxTagCount="responsive"
							mode="multiple"
							onChange={(nextRoleIds) =>
								setDraftRoleIdsOverride({
									roleIds: nextRoleIds,
									userId: user?.id ?? "",
								})
							}
							optionFilterProp="label"
							optionLabelProp="displayName"
							optionRender={(option) => {
								const role = rolesById.get(String(option.value));
								if (!role) return option.label;
								return (
									<Flex gap={token.marginXXS} vertical>
										<Flex align="center" gap={token.marginXS} wrap="wrap">
											<Text strong>{role.displayName}</Text>
											<Text code>{role.roleKey}</Text>
											{isHighPrivilegeRole(role) ? (
												<Tag color="red" icon={<ExclamationCircleOutlined />}>
													{t("adminShell.users.roles.highPrivilege")}
												</Tag>
											) : null}
											{isDisabledRole(role) ? (
												<Tag>{t("adminShell.users.roles.disabled")}</Tag>
											) : null}
										</Flex>
										<Text
											type={isHighPrivilegeRole(role) ? "danger" : "secondary"}
										>
											{isHighPrivilegeRole(role)
												? t("adminShell.users.roles.highPrivilegeRisk")
												: getRoleDescription(role)}
										</Text>
									</Flex>
								);
							}}
							options={roleOptions.map((role) => ({
								displayName: role.displayName,
								disabled: isDisabledRole(role) && !draftRoleIdSet.has(role.id),
								label: `${role.displayName} ${role.roleKey}`,
								value: role.id,
							}))}
							placeholder={t("adminShell.users.roles.selectorPlaceholder")}
							showSearch
							value={draftRoleIds}
							virtual={false}
						/>
						<Alert
							description={t("adminShell.users.roles.saveHint")}
							showIcon
							type="info"
						/>
						<Flex gap={token.marginXS} vertical>
							<Text strong>{t("adminShell.users.roles.diffTitle")}</Text>
							<Flex gap={token.marginXS} vertical>
								<Text>{t("adminShell.users.roles.addedTitle")}</Text>
								{renderRoleTags(addedRoles)}
								<Text>{t("adminShell.users.roles.removedTitle")}</Text>
								{renderRoleTags(removedRoles)}
							</Flex>
						</Flex>
					</Flex>
				) : null}
			</Flex>
		</Drawer>
	);
}
