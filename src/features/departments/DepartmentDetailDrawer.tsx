import { Descriptions, Drawer, Flex, Space, Tag, Typography } from "antd";
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
	const sections: (DescriptionsProps & { key: string })[] = department
		? [
				{
					key: "basic",
					title: t("adminShell.recordDetails.sections.basic"),
					items: [
						{
							label: t("adminShell.departments.fields.name"),
							children: department.name,
						},
						{
							label: t("adminShell.departments.fields.code"),
							children: department.code,
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
							label: t("adminShell.departments.fields.status"),
							children: (
								<Tag
									color={department.status === "active" ? "success" : "default"}
								>
									{t(`adminShell.departments.statuses.${department.status}`)}
								</Tag>
							),
						},
					],
				},
				{
					key: "organization",
					title: t("adminShell.recordDetails.sections.organization"),
					items: [
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
					],
				},
				{
					key: "activity",
					title: t("adminShell.recordDetails.sections.activity"),
					items: [
						{
							label: t("adminShell.recordDetails.createdAt"),
							children: formatDateTime(department.createdAt, formatPreferences),
						},
						{
							label: t("adminShell.departments.columns.updatedAt"),
							children: formatDateTime(department.updatedAt, formatPreferences),
						},
						{
							label: t("adminShell.recordDetails.id"),
							children: <Typography.Text code>{department.id}</Typography.Text>,
						},
					],
				},
			]
		: [];
	return (
		<Drawer
			destroyOnHidden
			size="min(560px, 100vw)"
			onClose={onClose}
			open={Boolean(department)}
			title={t("adminShell.departments.detailTitle")}
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
