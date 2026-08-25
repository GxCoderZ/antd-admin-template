import {
	AppstoreAddOutlined,
	ApartmentOutlined,
	AuditOutlined,
	BankOutlined,
	BookOutlined,
	BugOutlined,
	CheckCircleOutlined,
	CloseCircleOutlined,
	ControlOutlined,
	DashboardOutlined,
	FileTextOutlined,
	FormOutlined,
	EyeOutlined,
	InfoCircleOutlined,
	IdcardOutlined,
	NotificationOutlined,
	PartitionOutlined,
	ProjectOutlined,
	ReadOutlined,
	StopOutlined,
	TableOutlined,
	UserOutlined,
	UserSwitchOutlined,
	WarningOutlined,
} from "@ant-design/icons";
import type { ReactNode } from "react";

import type { AdminRouteIconKey } from "../../app/adminRoutes";

interface AdminRouteIconProps {
	iconKey: AdminRouteIconKey;
}

export function AdminRouteIcon({ iconKey }: AdminRouteIconProps) {
	const icons = {
		about: <InfoCircleOutlined aria-hidden />,
		advancedForm: <FormOutlined aria-hidden />,
		announcements: <NotificationOutlined aria-hidden />,
		auditLogs: <AuditOutlined aria-hidden />,
		basicForm: <FormOutlined aria-hidden />,
		batchTable: <TableOutlined aria-hidden />,
		dashboard: <DashboardOutlined aria-hidden />,
		departments: <BankOutlined aria-hidden />,
		dictionaries: <BookOutlined aria-hidden />,
		exceptionForbidden: <StopOutlined aria-hidden />,
		exceptionNotFound: <WarningOutlined aria-hidden />,
		exceptionServerError: <BugOutlined aria-hidden />,
		loginLogs: <FileTextOutlined aria-hidden />,
		previewPanel: <EyeOutlined aria-hidden />,
		positions: <IdcardOutlined aria-hidden />,
		resultFailure: <CloseCircleOutlined aria-hidden />,
		resultSuccess: <CheckCircleOutlined aria-hidden />,
		roles: <UserSwitchOutlined aria-hidden />,
		searchApplications: <AppstoreAddOutlined aria-hidden />,
		searchArticles: <ReadOutlined aria-hidden />,
		searchProjects: <ProjectOutlined aria-hidden />,
		settings: <ControlOutlined aria-hidden />,
		stepForm: <PartitionOutlined aria-hidden />,
		treeCategory: <ApartmentOutlined aria-hidden />,
		users: <UserOutlined aria-hidden />,
	} satisfies Record<AdminRouteIconKey, ReactNode>;

	return icons[iconKey];
}
