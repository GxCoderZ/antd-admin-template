import { CheckOutlined } from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	Alert,
	Badge,
	Button,
	Card,
	Empty,
	Flex,
	Listy,
	Pagination,
	Segmented,
	Skeleton,
	Space,
	Tag,
	theme,
	Typography,
} from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import {
	listPlatformNotifications,
	markAllPlatformNotificationsRead,
	markPlatformNotificationRead,
	platformNotificationsQueryKey,
	type PlatformNotification,
} from "#src/api/notifications";

const { Paragraph, Text, Title } = Typography;

export function NotificationCenterPage() {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const queryClient = useQueryClient();
	const [unreadOnly, setUnreadOnly] = useState(false);
	const [page, setPage] = useState(1);
	const pageSize = 10;
	const query = useQuery({
		queryFn: ({ signal }) =>
			listPlatformNotifications(
				{ page, pageSize, ...(unreadOnly ? { unread: true } : {}) },
				signal,
			),
		queryKey: [
			...platformNotificationsQueryKey,
			{ page, pageSize, unreadOnly },
		],
	});
	const refresh = () =>
		queryClient.invalidateQueries({ queryKey: platformNotificationsQueryKey });
	const readMutation = useMutation({
		mutationFn: markPlatformNotificationRead,
		onSuccess: refresh,
	});
	const readAllMutation = useMutation({
		mutationFn: markAllPlatformNotificationsRead,
		onSuccess: refresh,
	});

	const kindColor: Record<PlatformNotification["kind"], string> = {
		system: "blue",
		task: "gold",
		user: "purple",
	};

	return (
		<Flex gap={token.marginLG} vertical>
			<div>
				<Flex align="center" gap={token.marginSM} wrap>
					<Title level={2} style={{ margin: 0 }}>
						{t("adminShell.notificationCenter.title")}
					</Title>
					<Badge count={query.data?.unreadCount ?? 0} overflowCount={99} />
				</Flex>
				<Paragraph
					type="secondary"
					style={{ marginBottom: 0, marginTop: token.marginXS }}
				>
					{t("adminShell.notificationCenter.description")}
				</Paragraph>
			</div>
			<Card
				extra={
					<Button
						disabled={!query.data?.unreadCount}
						icon={<CheckOutlined />}
						loading={readAllMutation.isPending}
						onClick={() => readAllMutation.mutate()}
					>
						{t("adminShell.notificationCenter.markAllRead")}
					</Button>
				}
				title={
					<Segmented
						onChange={(value) => {
							setUnreadOnly(value === "unread");
							setPage(1);
						}}
						options={[
							{ label: t("adminShell.notificationCenter.all"), value: "all" },
							{
								label: t("adminShell.notificationCenter.unread"),
								value: "unread",
							},
						]}
						value={unreadOnly ? "unread" : "all"}
					/>
				}
			>
				{query.isPending ? (
					<div data-testid="notification-center-loading">
						<Skeleton active paragraph={{ rows: 6 }} />
					</div>
				) : query.isError ? (
					<Alert
						action={
							<Button onClick={() => void query.refetch()}>
								{t("adminShell.notificationCenter.retry")}
							</Button>
						}
						description={t("adminShell.notificationCenter.errorFallback")}
						title={t("adminShell.notificationCenter.loadError")}
						showIcon
						type="error"
					/>
				) : query.data.items.length === 0 ? (
					<Empty description={t("adminShell.notificationCenter.empty")} />
				) : (
					<>
						<Listy
							itemRender={(item) => (
								<Flex
									align="flex-start"
									data-testid={`notification-center-item-${item.id}`}
									gap={token.margin}
									justify="space-between"
									wrap
								>
									<Flex gap={token.marginXXS} style={{ minWidth: 0 }} vertical>
										<Space wrap>
											<Badge status={item.readAt ? "default" : "processing"} />
											<Text strong={!item.readAt}>{item.title}</Text>
											<Tag color={kindColor[item.kind]}>
												{t(`adminShell.notificationCenter.kinds.${item.kind}`)}
											</Tag>
										</Space>
										<Space orientation="vertical" size={token.marginXXS}>
											<Text>{item.content}</Text>
											<Text type="secondary">
												{new Date(item.createdAt).toLocaleString()}
											</Text>
										</Space>
									</Flex>
									{!item.readAt ? (
										<Button
											loading={
												readMutation.isPending &&
												readMutation.variables === item.id
											}
											onClick={() => readMutation.mutate(item.id)}
											type="link"
										>
											{t("adminShell.notificationCenter.markRead")}
										</Button>
									) : null}
								</Flex>
							)}
							items={query.data.items}
							rowKey="id"
						/>
						<Flex justify="end" style={{ marginTop: token.margin }}>
							<Pagination
								current={query.data.page}
								onChange={setPage}
								pageSize={query.data.pageSize}
								showSizeChanger={false}
								total={query.data.total}
							/>
						</Flex>
					</>
				)}
			</Card>
		</Flex>
	);
}
