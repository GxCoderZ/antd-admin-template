import {
	NotificationOutlined,
	ScheduleOutlined,
	UserOutlined,
} from "@ant-design/icons";
import { Avatar, theme } from "antd";

import type { PlatformNotification } from "#src/api/notifications";

interface NotificationAvatarProps {
	kind: PlatformNotification["kind"];
	size?: number;
}

const notificationIcons = {
	system: <NotificationOutlined aria-hidden />,
	task: <ScheduleOutlined aria-hidden />,
	user: <UserOutlined aria-hidden />,
} as const;

export function NotificationAvatar({
	kind,
	size = 48,
}: NotificationAvatarProps) {
	const { token } = theme.useToken();

	return (
		<Avatar
			icon={notificationIcons[kind]}
			size={size}
			style={{
				backgroundColor: token.colorPrimaryBg,
				color: token.colorPrimary,
			}}
		/>
	);
}
