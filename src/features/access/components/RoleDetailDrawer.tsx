import { Descriptions, Drawer, Flex, Space, Tag, Typography } from "antd";
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
	const sections: (DescriptionsProps & { key: string })[] = role
		? [
				{
					key: "basic",
					title: t("adminShell.recordDetails.sections.basic"),
					items: [
						{
							children: role.displayName,
							label: t("adminShell.roles.columns.displayName"),
						},
						{
							children: <Text code>{role.roleKey}</Text>,
							label: t("adminShell.roles.columns.roleKey"),
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
							children: role.memberCount ?? 0,
							label: t("adminShell.roles.columns.memberCount"),
						},
					],
				},
				{
					key: "access",
					title: t("adminShell.recordDetails.sections.access"),
					items: [
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
					],
				},
				{
					key: "activity",
					title: t("adminShell.recordDetails.sections.activity"),
					items: [
						{
							children: formatDateTime(role.createdAt, formatPreferences),
							label: t("adminShell.roles.columns.createdAt"),
						},
						{
							children: formatDateTime(role.updatedAt, formatPreferences),
							label: t("adminShell.roles.columns.updatedAt"),
						},
						{
							children: <Text code>{role.id}</Text>,
							label: t("adminShell.roles.columns.id"),
						},
						{
							children: role.version ?? "-",
							label: t("adminShell.recordDetails.version"),
						},
					],
				},
			]
		: [];

	return (
		<Drawer
			destroyOnHidden
			onClose={onClose}
			open={role !== null}
			size="min(560px, 100vw)"
			title={t("adminShell.roles.detailTitle", {
				name: role?.displayName ?? "",
			})}
		>
			<Flex vertical gap="large">
				{sections.map(({ key, ...section }) => (
					<Descriptions
						key={key}
						{...section}
						bordered
						column={1}
						size="small"
						styles={{ content: { overflowWrap: "anywhere" } }}
					/>
				))}
			</Flex>
		</Drawer>
	);
}
