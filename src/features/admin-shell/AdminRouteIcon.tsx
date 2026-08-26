import {
	AuditOutlined,
	BankOutlined,
	BookOutlined,
	BugOutlined,
	ControlOutlined,
	DashboardOutlined,
	FileTextOutlined,
	InfoCircleOutlined,
	IdcardOutlined,
	NotificationOutlined,
	StopOutlined,
	UserOutlined,
	UserSwitchOutlined,
	WarningOutlined,
} from "@ant-design/icons";
import type { ComponentProps } from "react";

import type { AdminRouteIconKey } from "../../app/adminRoutes";

const adminRouteIcons = {
	about: InfoCircleOutlined,
	announcements: NotificationOutlined,
	auditLogs: AuditOutlined,
	dashboard: DashboardOutlined,
	departments: BankOutlined,
	dictionaries: BookOutlined,
	exceptionForbidden: StopOutlined,
	exceptionNotFound: WarningOutlined,
	exceptionServerError: BugOutlined,
	loginLogs: FileTextOutlined,
	positions: IdcardOutlined,
	roles: UserSwitchOutlined,
	settings: ControlOutlined,
	users: UserOutlined,
} satisfies Record<AdminRouteIconKey, typeof UserOutlined>;

interface AdminRouteIconProps extends Omit<
	ComponentProps<typeof UserOutlined>,
	"ref"
> {
	iconKey: AdminRouteIconKey;
}

export function AdminRouteIcon({ iconKey, ...iconProps }: AdminRouteIconProps) {
	const Icon = adminRouteIcons[iconKey];

	return <Icon aria-hidden {...iconProps} />;
}
