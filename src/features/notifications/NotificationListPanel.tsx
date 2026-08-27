import {
	Alert,
	Badge,
	Button,
	Empty,
	Flex,
	Listy,
	Skeleton,
	Space,
	Spin,
	Tag,
	theme,
	Typography,
} from "antd";
import { useTranslation } from "react-i18next";

import { formatDateTime, type FormatPreferences } from "../../app/formatting";
import type {
	PlatformNotification,
	PlatformNotificationPage,
} from "#src/api/notifications";
import { NotificationAvatar } from "./NotificationAvatar";
import styles from "./NotificationListPanel.module.css";

const { Text } = Typography;

const kindColor: Record<PlatformNotification["kind"], string> = {
	system: "blue",
	task: "gold",
	user: "purple",
};

interface NotificationListPanelProps {
	formatPreferences: FormatPreferences;
	isError: boolean;
	isFetching: boolean;
	onRead: (notificationId: string) => void;
	onRetry: () => void;
	page: PlatformNotificationPage | undefined;
	readDisabled: boolean;
	readingId: string | undefined;
}

export function NotificationListPanel({
	formatPreferences,
	isError,
	isFetching,
	onRead,
	onRetry,
	page,
	readDisabled,
	readingId,
}: NotificationListPanelProps) {
	const { t } = useTranslation();
	const { token } = theme.useToken();

	if (isError) {
		return (
			<Alert
				action={
					<Button onClick={onRetry}>
						{t("adminShell.notificationCenter.retry")}
					</Button>
				}
				description={t("adminShell.notificationCenter.errorFallback")}
				title={t("adminShell.notificationCenter.loadError")}
				showIcon
				type="error"
			/>
		);
	}

	if (!page) {
		return (
			<div data-testid="notification-center-loading">
				<Skeleton active paragraph={{ rows: 6 }} />
			</div>
		);
	}

	if (page.items.length === 0) {
		return (
			<Spin spinning={isFetching}>
				<Empty description={t("adminShell.notificationCenter.empty")} />
			</Spin>
		);
	}

	return (
		<Spin spinning={isFetching}>
			<Listy
				itemRender={(item) => (
					<div
						className={styles.row}
						data-testid={`notification-center-item-${item.id}`}
					>
						<div
							className={styles.content}
							style={{ columnGap: token.margin, rowGap: token.margin }}
						>
							<Flex className={styles.primary} gap={token.margin}>
								<Badge dot={!item.readAt} offset={[-2, 4]}>
									<NotificationAvatar kind={item.kind} />
								</Badge>
								<Flex
									flex={1}
									gap={token.marginXXS}
									style={{ minWidth: 0 }}
									vertical
								>
									<Text strong={!item.readAt}>{item.title}</Text>
									<Text type="secondary">{item.content}</Text>
								</Flex>
							</Flex>
							<Flex className={styles.metadata} gap={token.marginSM} vertical>
								<Tag color={kindColor[item.kind]}>
									{t(`adminShell.notificationCenter.kinds.${item.kind}`)}
								</Tag>
								<Space size={token.marginXS} wrap>
									<Text type="secondary">
										{t("adminShell.notificationCenter.receivedAt")}
									</Text>
									<Text type="secondary">
										{formatDateTime(item.createdAt, formatPreferences, {
											timeStyle: "short",
										})}
									</Text>
								</Space>
								{item.readAt ? null : (
									<Button
										disabled={readDisabled}
										loading={readingId === item.id}
										onClick={() => onRead(item.id)}
										type="link"
									>
										{t("adminShell.notificationCenter.markRead")}
									</Button>
								)}
							</Flex>
						</div>
					</div>
				)}
				items={page.items}
				rowKey="id"
			/>
		</Spin>
	);
}
