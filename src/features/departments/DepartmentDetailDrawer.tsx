import { Descriptions, Drawer, Space, Tag, Typography } from "antd";
import type { DescriptionsProps } from "antd";
import { useTranslation } from "react-i18next";

import type { PlatformDepartment } from "#src/api/departments";
import { formatDateTime } from "../../app/formatting";
import { useLocalePreferences } from "../../app/localePreferences";

interface DepartmentDetailDrawerProps {
	department: PlatformDepartment | undefined;
	onClose: () => void;
}

export function DepartmentDetailDrawer({
	department,
	onClose,
}: DepartmentDetailDrawerProps) {
	const { t } = useTranslation();
	const formatPreferences = useLocalePreferences();
	const items: DescriptionsProps["items"] = department
		? [
				{
					label: t("adminShell.recordDetails.id"),
					children: <Typography.Text code>{department.id}</Typography.Text>,
				},
				{
					label: t("adminShell.departments.fields.name"),
					children: department.name,
				},
				{
					label: t("adminShell.departments.fields.code"),
					children: department.code,
				},
				{
					label: t("adminShell.departments.parentId"),
					children: department.parentId ?? "-",
				},
				{
					label: t("adminShell.departments.children"),
					children:
						department.children.length > 0 ? (
							<Space wrap>
								{department.children.map((child) => (
									<Tag key={child.id}>
										{child.name} ({child.code})
									</Tag>
								))}
							</Space>
						) : (
							"-"
						),
				},
				{
					label: t("adminShell.departments.fields.status"),
					children: (
						<Tag color={department.status === "active" ? "success" : "default"}>
							{t(`adminShell.departments.statuses.${department.status}`)}
						</Tag>
					),
				},
				{
					label: t("adminShell.departments.columns.memberCount"),
					children: department.memberCount,
				},
				{
					label: t("adminShell.departments.columns.positionCount"),
					children: department.positionCount,
				},
				{
					label: t("adminShell.recordDetails.createdAt"),
					children: formatDateTime(department.createdAt, formatPreferences),
				},
				{
					label: t("adminShell.departments.columns.updatedAt"),
					children: formatDateTime(department.updatedAt, formatPreferences),
				},
			]
		: [];
	return (
		<Drawer
			destroyOnHidden
			onClose={onClose}
			open={Boolean(department)}
			title={t("adminShell.departments.detailTitle")}
		>
			<Descriptions bordered column={1} items={items} size="small" />
		</Drawer>
	);
}
