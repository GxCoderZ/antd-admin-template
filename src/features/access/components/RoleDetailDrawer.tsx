import { Descriptions, Drawer, Space, Tag, Typography } from "antd";
import type { DescriptionsProps } from "antd";
import { useTranslation } from "react-i18next";

import { formatDateTime } from "../../../app/formatting";
import { useLocalePreferences } from "../../../app/localePreferences";
import type { PlatformRole } from "#src/api/roles";
import { permissionGroups } from "../rolePermissions";

const { Text } = Typography;

interface RoleDetailDrawerProps {
	onClose: () => void;
	role: PlatformRole | null;
}

export function RoleDetailDrawer({ onClose, role }: RoleDetailDrawerProps) {
	const { t } = useTranslation();
	const formatPreferences = useLocalePreferences();
	const permissionByKey = new Map(
		permissionGroups.flatMap((group) =>
			group.permissions.map((permission) => [
				permission.permission,
				permission,
			]),
		),
	);
	const items: DescriptionsProps["items"] = role
		? [
				{
					children: <Text code>{role.id}</Text>,
					label: t("adminShell.roles.columns.id"),
				},
				{
					children: role.displayName,
					label: t("adminShell.roles.columns.displayName"),
				},
				{
					children: <Text code>{role.roleKey}</Text>,
					label: t("adminShell.roles.columns.roleKey"),
				},
				{
					children: role.memberCount ?? 0,
					label: t("adminShell.roles.columns.memberCount"),
				},
				{
					children: (
						<Tag {...(role.builtIn ? { color: "processing" } : {})}>
							{t(
								`adminShell.roles.types.${role.builtIn ? "builtIn" : "custom"}`,
							)}
						</Tag>
					),
					label: t("adminShell.roles.columns.builtIn"),
				},
				{
					children:
						role.permissions.length > 0 ? (
							<Space wrap>
								{role.permissions.map((permission) => {
									const definition = permissionByKey.get(permission);
									return (
										<Tag key={permission}>
											{definition
												? t(
														`adminShell.roles.permissions.items.${definition.i18nKey}.name`,
													)
												: permission}
										</Tag>
									);
								})}
							</Space>
						) : (
							<Text type="secondary">
								{t("adminShell.roles.permissions.notConfigured")}
							</Text>
						),
					label: t("adminShell.roles.columns.permissions"),
				},
				{
					children: formatDateTime(role.createdAt, formatPreferences),
					label: t("adminShell.roles.columns.createdAt"),
				},
				{
					children: formatDateTime(role.updatedAt, formatPreferences),
					label: t("adminShell.roles.columns.updatedAt"),
				},
			]
		: [];

	return (
		<Drawer
			destroyOnHidden
			onClose={onClose}
			open={role !== null}
			title={t("adminShell.roles.detailTitle", {
				name: role?.displayName ?? "",
			})}
		>
			<Descriptions bordered column={1} items={items} size="small" />
		</Drawer>
	);
}
