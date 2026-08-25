import {
	Alert,
	Button,
	Drawer,
	Flex,
	Switch,
	Tag,
	theme,
	Typography,
} from "antd";
import { useTranslation } from "react-i18next";

import type { PlatformRole } from "#src/api/roles";
import type { PlatformUser } from "#src/api/users";
import {
	getProblemFallback,
	getUserMutationErrorTitleKey,
} from "../userProblems";

const { Text } = Typography;

interface UserRolesDrawerProps {
	availableRoles: PlatformRole[];
	canManageRoles: boolean;
	detailError: unknown;
	detailLoading: boolean;
	mutationError: unknown;
	onClose: () => void;
	onRetryDetail: () => void;
	onRetryRoles: () => void;
	onToggleRole: (roleId: string, assigned: boolean) => void;
	rolesError: unknown;
	user: PlatformUser | null;
	userRoles: PlatformUser["roles"];
	updatingRoleId: string | undefined;
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
	onToggleRole,
	rolesError,
	user,
	userRoles,
	updatingRoleId,
}: UserRolesDrawerProps) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const assignedRoleIds = new Set(userRoles.map((role) => role.id));

	return (
		<Drawer
			destroyOnHidden
			extra={
				<Text type="secondary">
					{t(
						canManageRoles
							? "adminShell.users.roles.manageHint"
							: "adminShell.users.roles.readOnlyHint",
					)}
				</Text>
			}
			loading={detailLoading}
			onClose={onClose}
			open={user !== null}
			title={t("adminShell.users.roles.title", { name: user?.username })}
		>
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
					<Flex gap={token.marginXS} wrap="wrap">
						{userRoles.length > 0 ? (
							userRoles.map((role) => (
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
						<Flex gap={token.marginXS} vertical>
							{availableRoles.map((role) => (
								<Flex align="center" gap={token.marginXS} key={role.id}>
									<Switch
										aria-label={t("adminShell.users.roles.toggle", {
											role: role.displayName,
											user: user?.displayName ?? user?.username,
										})}
										checked={assignedRoleIds.has(role.id)}
										disabled={detailLoading}
										loading={updatingRoleId === role.id}
										onChange={(checked) => onToggleRole(role.id, checked)}
										size="small"
									/>
									<span>{role.displayName}</span>
									<Text code>{role.roleKey}</Text>
								</Flex>
							))}
						</Flex>
					</Flex>
				) : null}
			</Flex>
		</Drawer>
	);
}
