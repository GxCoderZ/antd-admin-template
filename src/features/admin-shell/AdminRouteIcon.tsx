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
	ImportOutlined,
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
import type { ComponentProps } from "react";

import type { AdminRouteIconKey } from "../../app/adminRoutes";

const adminRouteIcons = {
	about: InfoCircleOutlined,
	advancedForm: FormOutlined,
	announcements: NotificationOutlined,
	auditLogs: AuditOutlined,
	basicForm: FormOutlined,
	batchTable: TableOutlined,
	dashboard: DashboardOutlined,
	departments: BankOutlined,
	dictionaries: BookOutlined,
	editableTable: TableOutlined,
	exceptionForbidden: StopOutlined,
	exceptionNotFound: WarningOutlined,
	exceptionServerError: BugOutlined,
	importExport: ImportOutlined,
	loginLogs: FileTextOutlined,
	positions: IdcardOutlined,
	previewPanel: EyeOutlined,
	resultFailure: CloseCircleOutlined,
	resultSuccess: CheckCircleOutlined,
	roles: UserSwitchOutlined,
	searchApplications: AppstoreAddOutlined,
	searchArticles: ReadOutlined,
	searchProjects: ProjectOutlined,
	settings: ControlOutlined,
	stepForm: PartitionOutlined,
	treeCategory: ApartmentOutlined,
	users: UserOutlined,
} satisfies Record<AdminRouteIconKey, typeof UserOutlined>;

interface AdminRouteIconProps
	extends Omit<ComponentProps<typeof UserOutlined>, "ref"> {
	iconKey: AdminRouteIconKey;
}

export function AdminRouteIcon({ iconKey, ...iconProps }: AdminRouteIconProps) {
	const Icon = adminRouteIcons[iconKey];

	return <Icon aria-hidden {...iconProps} />;
}
