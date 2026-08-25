import {
	Alert,
	Button,
	Drawer,
	Flex,
	Input,
	Switch,
	theme,
	Tooltip,
	Tree,
	Typography,
} from "antd";
import type { DataNode } from "antd/es/tree";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import type { PlatformPermission } from "../../../app/permissions";
import type { PlatformRole } from "#src/api/roles";
import {
	allPermissionValues,
	defaultPermissionExpandedKeys,
	permissionBranchNodeKeys,
	permissionTree,
	type PermissionTreeNode,
	permissionValueSet,
} from "../rolePermissions";
import { getRoleErrorTitleKey, getRoleProblemDetail } from "../roleProblems";

const { Text } = Typography;

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
	const [cascadeChecked, setCascadeChecked] = useState(true);
	const [expandedKeys, setExpandedKeys] = useState<string[]>(
		defaultPermissionExpandedKeys,
	);
	const [searchValue, setSearchValue] = useState("");
	const [draftPermissions, setDraftPermissions] = useState<
		PlatformPermission[]
	>(role?.permissions ?? []);
	const normalizedSearch = searchValue.trim().toLocaleLowerCase();
	const selectedCount = draftPermissions.length;
	const selectedCountText = t("adminShell.roles.permissions.selectedCount", {
		count: selectedCount,
		total: allPermissionValues.length,
	});
	const allGranted = selectedCount === allPermissionValues.length;
	const someGranted = selectedCount > 0 && !allGranted;

	const { treeData, visiblePermissionValueSet } = useMemo(() => {
		const visiblePermissionValues: PlatformPermission[] = [];
		const matchesSearch = (node: PermissionTreeNode) => {
			const title = t(node.titleKey).toLocaleLowerCase();
			const description =
				node.type === "permission"
					? t(node.descriptionKey).toLocaleLowerCase()
					: "";

			return (
				normalizedSearch.length === 0 ||
				title.includes(normalizedSearch) ||
				description.includes(normalizedSearch)
			);
		};
		const toTreeData = (node: PermissionTreeNode): DataNode | null => {
			const children =
				node.type === "permission"
					? []
					: node.children
							.map(toTreeData)
							.filter((child): child is DataNode => child !== null);

			if (normalizedSearch && !matchesSearch(node) && children.length === 0) {
				return null;
			}

			if (node.type === "permission") {
				visiblePermissionValues.push(node.permission);
			}

			return {
				children,
				key: node.key,
				title:
					node.type === "permission" ? (
						<Tooltip title={t(node.descriptionKey)}>
							<span>{t(node.titleKey)}</span>
						</Tooltip>
					) : (
						t(node.titleKey)
					),
			};
		};
		const nextTreeData = toTreeData(permissionTree);

		return {
			treeData: nextTreeData ? [nextTreeData] : [],
			visiblePermissionValueSet: new Set<string>(visiblePermissionValues),
		};
	}, [normalizedSearch, t]);
	const visibleDraftPermissions = draftPermissions.filter((permission) =>
		visiblePermissionValueSet.has(permission),
	);
	const applyTreeSelection = (nextKeys: Array<bigint | number | string>) => {
		const nextPermissions = nextKeys
			.map(String)
			.filter((key) => permissionValueSet.has(key)) as PlatformPermission[];

		if (!normalizedSearch) {
			setDraftPermissions(nextPermissions);
			return;
		}

		setDraftPermissions((currentPermissions) => [
			...currentPermissions.filter(
				(permission) => !visiblePermissionValueSet.has(permission),
			),
			...nextPermissions,
		]);
	};
	const saveSelection = () => {
		if (!role) {
			return;
		}
		const nextSet = new Set<string>(draftPermissions);
		const currentSet = new Set<string>(role.permissions);

		for (const permission of draftPermissions) {
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

	return (
		<Drawer
			destroyOnHidden
			footer={
				<Flex gap={token.marginXS} justify="end">
					<Button onClick={onClose}>{t("adminShell.roles.cancel")}</Button>
					<Button loading={loading} onClick={saveSelection} type="primary">
						{t("adminShell.roles.save")}
					</Button>
				</Flex>
			}
			onClose={onClose}
			open={open}
			size="min(560px, 100vw)"
			styles={{
				body: {
					overflowX: "hidden",
				},
			}}
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
					<Input
						allowClear
						aria-label={t("adminShell.roles.permissions.searchLabel")}
						onChange={(event) => {
							setSearchValue(event.target.value);
							if (event.target.value.trim()) {
								setExpandedKeys(permissionBranchNodeKeys);
							}
						}}
						placeholder={t("adminShell.roles.permissions.searchPlaceholder")}
						type="search"
						value={searchValue}
					/>
					<Flex
						align="center"
						gap={token.marginXS}
						justify="space-between"
						wrap
					>
						<Flex
							gap={token.marginXS}
							style={{ flex: "1 1 260px", minWidth: 0 }}
							wrap
						>
							<Button
								aria-label={t("adminShell.roles.permissions.expandAll")}
								onClick={() => setExpandedKeys(permissionBranchNodeKeys)}
							>
								{t("adminShell.roles.permissions.expandAll")}
							</Button>
							<Button
								aria-label={t("adminShell.roles.permissions.collapseAll")}
								onClick={() => setExpandedKeys([])}
							>
								{t("adminShell.roles.permissions.collapseAll")}
							</Button>
							<Button
								aria-label={t("adminShell.roles.permissions.selectAll")}
								disabled={loading || allGranted}
								onClick={() => setDraftPermissions(allPermissionValues)}
							>
								{t("adminShell.roles.permissions.selectAll")}
							</Button>
							<Button
								aria-label={t("adminShell.roles.permissions.clear")}
								disabled={loading || selectedCount === 0}
								onClick={() => setDraftPermissions([])}
							>
								{t("adminShell.roles.permissions.clear")}
							</Button>
						</Flex>
						<Flex
							align="center"
							gap={token.marginXS}
							style={{ flex: "1 1 220px", minWidth: 0 }}
							wrap
						>
							{someGranted ? (
								<Text>{selectedCountText}</Text>
							) : (
								<Text type="secondary">{selectedCountText}</Text>
							)}
							<Switch
								aria-label={t("adminShell.roles.permissions.cascade")}
								checked={cascadeChecked}
								checkedChildren={t("adminShell.roles.permissions.cascadeOn")}
								disabled={loading}
								onChange={setCascadeChecked}
								unCheckedChildren={t("adminShell.roles.permissions.cascadeOff")}
							/>
							<Text>{t("adminShell.roles.permissions.cascade")}</Text>
						</Flex>
					</Flex>
					<Tree
						checkable
						checkedKeys={
							cascadeChecked
								? visibleDraftPermissions
								: { checked: visibleDraftPermissions, halfChecked: [] }
						}
						checkStrictly={!cascadeChecked}
						disabled={loading}
						expandedKeys={expandedKeys}
						onCheck={(checked) =>
							applyTreeSelection(
								Array.isArray(checked) ? checked : checked.checked,
							)
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
