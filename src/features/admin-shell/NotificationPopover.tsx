import {
	BellOutlined,
	CheckOutlined,
	InboxOutlined,
	NotificationOutlined,
} from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	Alert,
	Badge,
	Button,
	Empty,
	Flex,
	Grid,
	message,
	Popover,
	Skeleton,
	Space,
	Tag,
	theme,
	Typography,
} from "antd";
import { type CSSProperties, useState } from "react";
import { useTranslation } from "react-i18next";

import {
	listPlatformNotifications,
	markAllPlatformNotificationsRead,
	markPlatformNotificationRead,
	platformNotificationsQueryKey,
	type PlatformNotification,
} from "#src/api/notifications";
import { HeaderIconButton } from "./HeaderIconButton";

const { Text } = Typography;

const previewPageSize = 6;
const notificationCenterPath = "/account/notifications";

interface NotificationPopoverProps {
	onNavigate: (path: string) => void;
	triggerStyle?: CSSProperties;
}

export function NotificationPopover({
	onNavigate,
	triggerStyle,
}: NotificationPopoverProps) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const screens = Grid.useBreakpoint();
	const queryClient = useQueryClient();
	const [messageApi, messageContextHolder] = message.useMessage();
	const [open, setOpen] = useState(false);
	const query = useQuery({
		queryFn: ({ signal }) =>
			listPlatformNotifications({ page: 1, pageSize: previewPageSize }, signal),
		queryKey: [
			...platformNotificationsQueryKey,
			{ page: 1, pageSize: previewPageSize, scope: "header-preview" },
		],
	});
	const refreshNotifications = () =>
		queryClient.invalidateQueries({ queryKey: platformNotificationsQueryKey });
	const readMutation = useMutation({
		mutationFn: markPlatformNotificationRead,
		onError: () => {
			void messageApi.error(t("adminShell.notificationCenter.updateError"));
		},
		onSuccess: () => {
			void messageApi.success(t("adminShell.notificationCenter.markReadSuccess"));
			void refreshNotifications();
		},
	});
	const readAllMutation = useMutation({
		mutationFn: markAllPlatformNotificationsRead,
		onError: () => {
			void messageApi.error(t("adminShell.notificationCenter.updateError"));
		},
		onSuccess: () => {
			void messageApi.success(t("adminShell.notificationCenter.markAllReadSuccess"));
			void refreshNotifications();
		},
	});
	const kindColor: Record<PlatformNotification["kind"], string> = {
		system: "blue",
		task: "gold",
		user: "purple",
	};
	const placement = screens.sm === true ? "bottomRight" : "bottom";
	const popoverTitle = (
		<Flex align="center" gap={token.marginXS} justify="space-between">
			<Space size={token.marginXS}>
				<NotificationOutlined aria-hidden />
				<Text strong>{t("adminShell.notificationCenter.previewTitle")}</Text>
			</Space>
			<Badge count={query.data?.unreadCount ?? 0} overflowCount={99} />
		</Flex>
	);
	const popoverContent = (
		<Flex
			data-testid="notification-popover"
			style={{ width: "min(380px, calc(100vw - 48px))" }}
			vertical
		>
			<div style={{ maxHeight: 390, overflowY: "auto" }}>
				{query.isPending ? (
					<div style={{ padding: token.padding }}>
						<Skeleton active paragraph={{ rows: 4 }} title={false} />
					</div>
				) : query.isError ? (
					<div style={{ padding: token.padding }}>
						<Alert
							action={
								<Button size="small" onClick={() => void query.refetch()}>
									{t("adminShell.notificationCenter.retry")}
								</Button>
							}
							message={t("adminShell.notificationCenter.loadError")}
							showIcon
							type="error"
						/>
					</div>
				) : query.data.items.length === 0 ? (
					<Empty
						description={t("adminShell.notificationCenter.empty")}
						image={Empty.PRESENTED_IMAGE_SIMPLE}
						style={{ margin: 0, padding: token.paddingLG }}
					/>
				) : (
					<Flex data-testid="notification-popover-list" vertical>
						{query.data.items.map((item) => (
							<Flex
								align="flex-start"
								gap={token.marginSM}
								key={item.id}
								style={{
									borderBottom: `${token.lineWidth}px ${token.lineType} ${token.colorBorderSecondary}`,
									paddingBlock: token.paddingSM,
									paddingInline: token.padding,
								}}
							>
								<Badge dot={!item.readAt} offset={[-2, 4]}>
									<span
										aria-hidden
										style={{
											alignItems: "center",
											background: token.colorFillSecondary,
											borderRadius: "50%",
											color: token.colorTextSecondary,
											display: "inline-flex",
											height: token.controlHeightLG,
											justifyContent: "center",
											width: token.controlHeightLG,
										}}
									>
										<InboxOutlined />
									</span>
								</Badge>
								<Flex flex={1} gap={token.marginXXS} style={{ minWidth: 0 }} vertical>
									<Space size={token.marginXS} wrap>
										<Text strong={!item.readAt}>{item.title}</Text>
										<Tag color={kindColor[item.kind]}>
											{t(`adminShell.notificationCenter.kinds.${item.kind}`)}
										</Tag>
									</Space>
									<Text ellipsis type="secondary">
										{item.content}
									</Text>
									<Text type="secondary">
										{new Date(item.createdAt).toLocaleString()}
									</Text>
								</Flex>
								{item.readAt ? null : (
									<Button
										loading={
											readMutation.isPending &&
											readMutation.variables === item.id
										}
										onClick={() => readMutation.mutate(item.id)}
										size="small"
										type="link"
									>
										{t("adminShell.notificationCenter.markRead")}
									</Button>
								)}
							</Flex>
						))}
					</Flex>
				)}
			</div>
			<Flex
				align="center"
				justify="space-between"
				style={{
					borderTop: `${token.lineWidth}px ${token.lineType} ${token.colorBorderSecondary}`,
					padding: token.paddingXS,
				}}
			>
				<Button
					disabled={!query.data?.unreadCount}
					icon={<CheckOutlined aria-hidden />}
					loading={readAllMutation.isPending}
					onClick={() => readAllMutation.mutate()}
					type="text"
				>
					{t("adminShell.notificationCenter.markAllRead")}
				</Button>
				<Button
					onClick={() => {
						setOpen(false);
						onNavigate(notificationCenterPath);
					}}
					type="primary"
				>
					{t("adminShell.notificationCenter.viewAll")}
				</Button>
			</Flex>
		</Flex>
	);

	return (
		<>
			{messageContextHolder}
			<Popover
				arrow={false}
				content={popoverContent}
				destroyOnHidden
				onOpenChange={setOpen}
				open={open}
				placement={placement}
				styles={{ content: { padding: 0 } }}
				title={popoverTitle}
				trigger="click"
			>
				<Badge
					count={query.data?.unreadCount ?? 0}
					offset={[-2, 4]}
					overflowCount={99}
					size="small"
					style={{ display: "inline-flex" }}
				>
					<HeaderIconButton
						aria-label={t("adminShell.notificationCenter.button")}
						icon={<BellOutlined aria-hidden />}
						style={triggerStyle}
						type="text"
					/>
				</Badge>
			</Popover>
		</>
	);
}
