import type { ButtonProps } from "antd";
import type { NotificationItem } from "./types";

import { useState } from "react";
import { NotificationPopup } from "./index";

export function NotificationContainer({ ...restProps }: ButtonProps) {
	const [notifications, _setNotifications] = useState<NotificationItem[]>([]);

	// useEffect(() => {
	// 	fetchNotifications().then((res) => {
	// 		setNotifications(
	// 			Array.from({ length: 20 }).flatMap(() => res.data),
	// 		);
	// 	});
	// }, []);

	return (
		<NotificationPopup
			notifications={notifications}
			{...restProps}
		/>
	);
}
