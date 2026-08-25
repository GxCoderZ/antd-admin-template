import { Alert, Checkbox, Drawer, Flex, theme, Tooltip, Tree } from "antd";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import type { PlatformPermission } from "../../../app/permissions";
import type { PlatformRole } from "#src/api/roles";
import {
	allPermissionValues,
	permissionGroupNodeKeys,
	permissionGroups,
	permissionValueSet,
} from "../rolePermissions";
import { getRoleErrorTitleKey, getRoleProblemDetail } from "../roleProblems";

interface RolePermissionDrawerProps {
	error: unknown;
	forbidden: boolean;
	loading: boolean;
	onChange: (permission: PlatformPermission, granted: boolean) => void;
	onClose: () => void;
	onDismissError: () => void;
	open: boolean;
	role: PlatformRole | null;
}

export function RolePermissionDrawer({
	error,
	forbidden,
	loading,
	onChange,
	onClose,
	onDismissError,
	open,
	role,
}: RolePermissionDrawerProps) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const [expandedKeys, setExpandedKeys] = useState<string[]>(
		permissionGroupNodeKeys,
	);
	const treeData = useMemo(
		() =>
			permissionGroups.map((group) => ({
				children: group.permissions.map((definition) => ({
					key: definition.permission,
					title: (
						<Tooltip
							title={t(
								`adminShell.roles.permissions.items.${definition.i18nKey}.description`,
							)}
						>
							<span>
								{t(
									`adminShell.roles.permissions.items.${definition.i18nKey}.name`,
								)}
							</span>
						</Tooltip>
					),
				})),
				key: `group:${group.groupKey}`,
				title: t(`adminShell.roles.permissions.groups.${group.groupKey}`),
			})),
		[t],
	);
	const applySelection = (nextKeys: Array<bigint | number | string>) => {
		if (!role) {
			return;
		}
		const nextPermissions = nextKeys
			.map(String)
			.filter((key) => permissionValueSet.has(key)) as PlatformPermission[];
		const nextSet = new Set<string>(nextPermissions);
		const currentSet = new Set<string>(role.permissions);

		for (const permission of nextPermissions) {
			if (!currentSet.has(permission)) {
				onChange(permission, true);
			}
		}
		for (const permission of role.permissions) {
			if (!nextSet.has(permission)) {
				onChange(permission, false);
			}
		}
	};
	const grantedCount = role?.permissions.length ?? 0;
	const allGranted =
		grantedCount > 0 && grantedCount === allPermissionValues.length;
	const someGranted = grantedCount > 0 && !allGranted;

	return (
		<Drawer
			destroyOnHidden
			onClose={onClose}
			open={open}
			title={t("adminShell.roles.permissionDrawerTitle", {
				name: role?.displayName,
			})}
		>
			{role ? (
				<Flex gap={token.marginSM} vertical>
					{error ? (
						<Alert
							closable
							description={
								getRoleProblemDetail(error) ??
								t(
									forbidden
										? "adminShell.roles.errors.permissionForbiddenDescription"
										: "adminShell.roles.errors.fallback",
								)
							}
							onClose={onDismissError}
							showIcon
							title={t(
								forbidden
									? "adminShell.roles.errors.permissionForbidden"
									: getRoleErrorTitleKey(error),
							)}
							type="error"
						/>
					) : null}
					<Flex gap={token.marginSM} justify="space-between" wrap>
						<Checkbox
							checked={expandedKeys.length === permissionGroupNodeKeys.length}
							onChange={(event) =>
								setExpandedKeys(
									event.target.checked ? permissionGroupNodeKeys : [],
								)
							}
						>
							{t("adminShell.roles.permissions.expandAll")}
						</Checkbox>
						<Checkbox
							checked={allGranted}
							disabled={loading}
							indeterminate={someGranted}
							onChange={(event) =>
								applySelection(event.target.checked ? allPermissionValues : [])
							}
						>
							{t("adminShell.roles.permissions.selectAll")}
						</Checkbox>
					</Flex>
					<Tree
						checkable
						checkedKeys={role.permissions}
						disabled={loading}
						expandedKeys={expandedKeys}
						onCheck={(checked) =>
							applySelection(Array.isArray(checked) ? checked : checked.checked)
						}
						onExpand={(keys) => setExpandedKeys(keys.map(String))}
						selectable={false}
						treeData={treeData}
					/>
				</Flex>
			) : null}
		</Drawer>
	);
}
