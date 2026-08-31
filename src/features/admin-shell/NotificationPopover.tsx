import { BellOutlined, CheckOutlined } from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	Alert,
	Badge,
	Button,
	Empty,
	Flex,
	Grid,
	message,
	Modal,
	Popover,
	Skeleton,
	theme,
	Tooltip,
	Typography,
} from "antd";
import { type CSSProperties, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import {
	clearPlatformNotifications,
	listPlatformNotifications,
	markAllPlatformNotificationsRead,
	markPlatformNotificationRead,
	platformNotificationsQueryKey,
} from "#src/api/notifications";
import { resolveSupportedLanguage } from "../../i18n";
import { NotificationAvatar } from "../notifications/NotificationAvatar";
import { HeaderIconButton } from "./HeaderIconButton";
import styles from "./NotificationPopover.module.css";

const { Text } = Typography;
const previewPageSize = 6;

interface NotificationPopoverProps {
	onNavigate: (path: string) => void;
	onOpenChange: (open: boolean) => void;
	open: boolean;
	timeZone: string;
	triggerStyle?: CSSProperties;
}

export function NotificationPopover({
	onNavigate,
	onOpenChange,
	open,
	timeZone,
	triggerStyle,
}: NotificationPopoverProps) {
	const { t, i18n } = useTranslation();
	const { token } = theme.useToken();
	const screens = Grid.useBreakpoint();
	const queryClient = useQueryClient();
	const [messageApi, messageContextHolder] = message.useMessage();
	const [clearOpen, setClearOpen] = useState(false);
	const contentRef = useRef<HTMLDivElement>(null);
	const triggerRef = useRef<HTMLAnchorElement | HTMLButtonElement>(null);
	const handleOpenChange = (nextOpen: boolean) => {
		if (!nextOpen && contentRef.current?.contains(document.activeElement)) {
			triggerRef.current?.focus();
		}
		onOpenChange(nextOpen);
	};
	const query = useQuery({
		queryFn: ({ signal }) =>
			listPlatformNotifications({ page: 1, pageSize: previewPageSize }, signal),
		queryKey: [
			...platformNotificationsQueryKey,
			{ page: 1, pageSize: previewPageSize, scope: "header-preview" },
		],
	});
	const refresh = () =>
		queryClient.invalidateQueries({ queryKey: platformNotificationsQueryKey });
	const reportReadError = () => {
		void messageApi.error(t("adminShell.notificationCenter.updateError"));
	};
	const readMutation = useMutation({
		mutationFn: markPlatformNotificationRead,
		onError: reportReadError,
		onSuccess: refresh,
	});
	const readAllMutation = useMutation({
		mutationFn: markAllPlatformNotificationsRead,
		onError: reportReadError,
		onSuccess: refresh,
	});
	const clearMutation = useMutation({
		mutationFn: clearPlatformNotifications,
		onError: () => {
			void messageApi.error(t("adminShell.notificationCenter.clearError"));
		},
		onSuccess: async () => {
			await refresh();
			setClearOpen(false);
			void messageApi.success(t("adminShell.notificationCenter.clearSuccess"));
		},
	});
	const busy =
		readMutation.isPending ||
		readAllMutation.isPending ||
		clearMutation.isPending;
	const hasUnread = query.isSuccess && query.data.unreadCount > 0;
	const border = `${token.lineWidth}px ${token.lineType} ${token.colorBorderSecondary}`;
	const content = (
		<Flex
			data-testid="notification-popover"
			ref={contentRef}
			vertical
			style={{ width: `min(384px, calc(100vw - ${token.margin * 2}px))` }}
		>
			<Flex
				align="center"
				justify="space-between"
				style={{
					padding: `${token.paddingXS}px ${token.padding}px`,
					borderBottom: border,
				}}
			>
				<Text>{t("adminShell.notificationCenter.previewTitle")}</Text>
				<Tooltip title={t("adminShell.notificationCenter.markAllRead")}>
					<Button
						aria-label={t("adminShell.notificationCenter.markAllRead")}
						disabled={!hasUnread || busy}
						icon={<CheckOutlined />}
						loading={readAllMutation.isPending}
						onClick={() => readAllMutation.mutate()}
						type="text"
					/>
				</Tooltip>
			</Flex>
			<div
				data-testid="notification-popover-list"
				style={{
					height: "min(380px, calc(100dvh - 200px))",
					overflowY: "auto",
				}}
			>
				{query.isPending ? (
					<div style={{ padding: token.padding }}>
						<Skeleton active paragraph={{ rows: 6 }} title={false} />
					</div>
				) : query.isError ? (
					<div style={{ padding: token.padding }}>
						<Alert
							action={
								<Button size="small" onClick={() => void query.refetch()}>
									{t("adminShell.notificationCenter.retry")}
								</Button>
							}
							title={t("adminShell.notificationCenter.loadError")}
							showIcon
							type="error"
						/>
					</div>
				) : query.data.items.length === 0 ? (
					<Empty
						description={t("adminShell.notificationCenter.empty")}
						image={Empty.PRESENTED_IMAGE_SIMPLE}
						style={{ padding: token.paddingLG, margin: 0 }}
					/>
				) : (
					query.data.items.map((item) => (
						<Button
							aria-label={
								item.readAt
									? item.title
									: t("adminShell.notificationCenter.readAction", {
											title: item.title,
										})
							}
							aria-busy={
								readMutation.isPending && readMutation.variables === item.id
							}
							block
							key={item.id}
							onClick={() => {
								if (!item.readAt && !busy) readMutation.mutate(item.id);
							}}
							style={{
								height: "auto",
								border: 0,
								borderBottom: border,
								borderRadius: 0,
								padding: token.padding,
								whiteSpace: "normal",
								textAlign: "start",
							}}
							styles={{ content: { width: "100%" } }}
							type="text"
						>
							<Flex
								align="center"
								gap={token.margin + token.marginXXS}
								style={{ width: "100%", minWidth: 0 }}
							>
								<NotificationAvatar kind={item.kind} size={40} />
								<Flex
									gap={token.marginXS}
									style={{ flex: 1, minWidth: 0 }}
									vertical
								>
									<Flex
										align="start"
										gap={token.marginXS}
										justify="space-between"
									>
										<Text
											strong={!item.readAt}
											style={{ overflowWrap: "anywhere" }}
										>
											{item.title}
										</Text>
										{!item.readAt ? (
											<Badge
												color={token.colorPrimary}
												style={{ flexShrink: 0 }}
											/>
										) : null}
									</Flex>
									<span
										className={styles.summary}
										style={{
											fontSize: token.fontSizeSM,
											color: token.colorTextSecondary,
										}}
									>
										{item.content}
									</span>
									<Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
										{new Intl.DateTimeFormat(
											resolveSupportedLanguage(i18n.resolvedLanguage),
											{ dateStyle: "medium", timeStyle: "short", timeZone },
										).format(new Date(item.createdAt))}
									</Text>
								</Flex>
							</Flex>
						</Button>
					))
				)}
			</div>
			<Flex
				align="center"
				gap={token.marginXS}
				justify="space-between"
				style={{
					borderTop: border,
					padding: `${token.paddingXS}px ${token.padding}px`,
				}}
			>
				<Button
					danger
					disabled={!query.isSuccess || query.data.total === 0 || busy}
					loading={clearMutation.isPending}
					onClick={() => {
						onOpenChange(false);
						setClearOpen(true);
					}}
					type="text"
				>
					{t("adminShell.notificationCenter.clear")}
				</Button>
				<Button
					onClick={() => {
						onOpenChange(false);
						onNavigate("/account/notifications");
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
			<Modal
				width={screens.sm === true ? token.screenXS : "100%"}
				style={{ maxWidth: "100%" }}
				open={clearOpen}
				title={t("adminShell.notificationCenter.clearConfirmTitle")}
				cancelText={t("adminShell.notificationCenter.cancel")}
				okText={t("adminShell.notificationCenter.confirmClear")}
				okButtonProps={{ danger: true }}
				confirmLoading={clearMutation.isPending}
				onCancel={() => setClearOpen(false)}
				onOk={() => clearMutation.mutate()}
			>
				{t("adminShell.notificationCenter.clearConfirmContent")}
			</Modal>
			<Popover
				arrow={false}
				content={content}
				destroyOnHidden
				onOpenChange={handleOpenChange}
				open={open}
				placement={screens.sm === true ? "bottomRight" : "bottom"}
				styles={{ container: { padding: 0, overflow: "hidden" } }}
				trigger="click"
			>
				<Tooltip
					title={open ? null : t("adminShell.notificationCenter.button")}
				>
					<HeaderIconButton
						aria-expanded={open}
						ref={triggerRef}
						aria-label={t("adminShell.notificationCenter.button")}
						icon={
							<Badge
								color={token.colorPrimary}
								dot={hasUnread}
								styles={{
									root: { display: "inline-flex", fontSize: "inherit" },
								}}
							>
								<BellOutlined aria-hidden />
							</Badge>
						}
						style={triggerStyle}
						type="text"
					/>
				</Tooltip>
			</Popover>
		</>
	);
}
