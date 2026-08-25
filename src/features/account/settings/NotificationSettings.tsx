import {
	getPlatformAccountNotifications,
	platformAccountNotificationsQueryKey,
	type PlatformAccountNotifications,
	updatePlatformAccountNotifications,
} from "#src/api/account";
import { ApiProblemError } from "#src/api/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, Button, Flex, Listy, Skeleton, Switch, Typography } from "antd";
import { useTranslation } from "react-i18next";

const { Text } = Typography;

function getProblemDetail(error: unknown) {
	return error instanceof ApiProblemError ? error.problem?.detail : undefined;
}

export function NotificationSettings() {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const notificationsQuery = useQuery({
		queryFn: ({ signal }) => getPlatformAccountNotifications(signal),
		queryKey: platformAccountNotificationsQueryKey,
	});
	const updateMutation = useMutation({
		mutationFn: updatePlatformAccountNotifications,
		onSuccess: (notifications) => {
			queryClient.setQueryData(
				platformAccountNotificationsQueryKey,
				notifications,
			);
		},
	});

	if (notificationsQuery.isPending)
		return <Skeleton active paragraph={{ rows: 4 }} />;
	if (notificationsQuery.isError || !notificationsQuery.data) {
		return (
			<Alert
				action={
					<Button onClick={() => void notificationsQuery.refetch()}>
						{t("adminShell.account.retry")}
					</Button>
				}
				description={
					getProblemDetail(notificationsQuery.error) ??
					t("adminShell.account.requestErrorFallback")
				}
				showIcon
				title={t("adminShell.account.settings.notification.loadError")}
				type="error"
			/>
		);
	}

	const preferences = notificationsQuery.data;
	const items: Array<{
		description: string;
		key: keyof PlatformAccountNotifications;
		title: string;
	}> = [
		{
			key: "userMessage",
			title: t("adminShell.account.settings.notification.userMessage"),
			description: t(
				"adminShell.account.settings.notification.userMessageDescription",
			),
		},
		{
			key: "systemMessage",
			title: t("adminShell.account.settings.notification.systemMessage"),
			description: t(
				"adminShell.account.settings.notification.systemMessageDescription",
			),
		},
		{
			key: "todoTask",
			title: t("adminShell.account.settings.notification.todoTask"),
			description: t(
				"adminShell.account.settings.notification.todoTaskDescription",
			),
		},
	];

	return (
		<>
			{updateMutation.isError ? (
				<Alert
					closable
					description={
						getProblemDetail(updateMutation.error) ??
						t("adminShell.account.requestErrorFallback")
					}
					onClose={() => updateMutation.reset()}
					showIcon
					title={t("adminShell.account.settings.notification.updateError")}
					type="error"
				/>
			) : null}
			<Listy
				itemRender={(item) => (
					<Flex align="center" gap="middle" justify="space-between">
						<Flex gap={2} style={{ minWidth: 0 }} vertical>
							<Text strong>{item.title}</Text>
							<Text type="secondary">{item.description}</Text>
						</Flex>
						<Switch
							aria-label={item.title}
							checked={preferences[item.key]}
							checkedChildren={t("adminShell.account.settings.notification.on")}
							loading={updateMutation.isPending}
							onChange={(checked) => {
								const previous = preferences;
								const next = { ...preferences, [item.key]: checked };
								queryClient.setQueryData(
									platformAccountNotificationsQueryKey,
									next,
								);
								updateMutation.mutate(next, {
									onError: () =>
										queryClient.setQueryData(
											platformAccountNotificationsQueryKey,
											previous,
										),
								});
							}}
							unCheckedChildren={t(
								"adminShell.account.settings.notification.off",
							)}
						/>
					</Flex>
				)}
				items={items}
				rowKey="key"
				styles={{ item: { padding: "14px 0" } }}
			/>
		</>
	);
}
