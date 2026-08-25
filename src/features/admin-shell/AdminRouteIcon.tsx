import {
	AuditOutlined,
	ControlOutlined,
	DashboardOutlined,
	FileTextOutlined,
	FormOutlined,
	InfoCircleOutlined,
	NotificationOutlined,
	PartitionOutlined,
	UserOutlined,
	UserSwitchOutlined,
} from "@ant-design/icons";
import type { ReactNode } from "react";

import type { AdminRouteIconKey } from "../../app/adminRoutes";

interface AdminRouteIconProps {
	iconKey: AdminRouteIconKey;
}

export function AdminRouteIcon({ iconKey }: AdminRouteIconProps) {
	const icons = {
		about: <InfoCircleOutlined aria-hidden />,
		announcements: <NotificationOutlined aria-hidden />,
		auditLogs: <AuditOutlined aria-hidden />,
		basicForm: <FormOutlined aria-hidden />,
		dashboard: <DashboardOutlined aria-hidden />,
		loginLogs: <FileTextOutlined aria-hidden />,
		roles: <UserSwitchOutlined aria-hidden />,
		settings: <ControlOutlined aria-hidden />,
		stepForm: <PartitionOutlined aria-hidden />,
		users: <UserOutlined aria-hidden />,
	} satisfies Record<AdminRouteIconKey, ReactNode>;

	return icons[iconKey];
}
