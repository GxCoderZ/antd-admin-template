import { CheckOutlined } from "@ant-design/icons";
import {
	keepPreviousData,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import {
	Badge,
	Button,
	Card,
	Flex,
	Input,
	message,
	Pagination,
	Segmented,
	theme,
	Typography,
} from "antd";
import { useTranslation } from "react-i18next";

import { useLocalePreferences } from "../../app/localePreferences";
import { useRouteSessionState } from "../../app/routeSessionState";
import {
	listPlatformNotifications,
	markAllPlatformNotificationsRead,
	markPlatformNotificationRead,
	platformNotificationsQueryKey,
} from "#src/api/notifications";
import { NotificationListPanel } from "./NotificationListPanel";

const { Search } = Input;
const { Title } = Typography;
const notificationCenterRouteKey = "/account/notifications";

type NotificationScope = "all" | "unread";

export function NotificationCenterPage() {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const formatPreferences = useLocalePreferences();
	const queryClient = useQueryClient();
	const [messageApi, messageContextHolder] = message.useMessage();
	const [keywordDraft, setKeywordDraft] = useRouteSessionState({
		initialState: "",
		routeKey: notificationCenterRouteKey,
		stateKey: "keyword-draft",
	});
	const [keyword, setKeyword] = useRouteSessionState({
		initialState: "",
		routeKey: notificationCenterRouteKey,
		stateKey: "keyword",
	});
	const [scope, setScope] = useRouteSessionState<NotificationScope>({
		initialState: "all",
		routeKey: notificationCenterRouteKey,
		stateKey: "scope",
	});
	const [page, setPage] = useRouteSessionState({
		initialState: 1,
		routeKey: notificationCenterRouteKey,
		stateKey: "page",
	});
	const [pageSize, setPageSize] = useRouteSessionState({
		initialState: 10,
		routeKey: notificationCenterRouteKey,
		stateKey: "page-size",
	});
	const unread = scope === "unread";
	const query = useQuery({
		placeholderData: keepPreviousData,
		queryFn: ({ signal }) =>
			listPlatformNotifications({ keyword, page, pageSize, unread }, signal),
		queryKey: [
			...platformNotificationsQueryKey,
			{ keyword, page, pageSize, unread },
		],
	});
	const notificationPage = query.data;
	const unreadCount = notificationPage ? notificationPage.unreadCount : 0;
	const refreshNotifications = () =>
		queryClient.invalidateQueries({ queryKey: platformNotificationsQueryKey });
	const reportReadError = () => {
		void messageApi.error(t("adminShell.notificationCenter.updateError"));
	};
	const readMutation = useMutation({
		mutationFn: markPlatformNotificationRead,
		onError: reportReadError,
		onSuccess: async () => {
			if (
				unread &&
				notificationPage &&
				notificationPage.items.length === 1 &&
				page > 1
			) {
				setPage(page - 1);
			}
			await refreshNotifications();
		},
	});
	const readAllMutation = useMutation({
		mutationFn: markAllPlatformNotificationsRead,
		onError: reportReadError,
		onSuccess: async () => {
			if (unread) setPage(1);
			await refreshNotifications();
		},
	});
	const busy = readMutation.isPending || readAllMutation.isPending;

	function applyKeyword(nextKeyword: string) {
		setKeyword(nextKeyword.trim());
		setPage(1);
	}

	function changeScope(nextScope: NotificationScope) {
		setScope(nextScope);
		setPage(1);
	}

	return (
		<>
			{messageContextHolder}
			<Card
				title={
					<Flex align="center" gap={token.margin} justify="space-between" wrap>
						<Flex align="center" gap={token.marginSM} wrap>
							<Title level={5} style={{ margin: 0 }}>
								{t("adminShell.notificationCenter.title")}
							</Title>
							<Badge count={unreadCount} overflowCount={99} />
							<Button
								disabled={busy || unreadCount === 0}
								icon={<CheckOutlined aria-hidden />}
								loading={readAllMutation.isPending}
								onClick={() => readAllMutation.mutate()}
							>
								{t("adminShell.notificationCenter.markAllRead")}
							</Button>
						</Flex>
						<Flex
							align="center"
							gap={token.marginSM}
							style={{ minWidth: 0, maxWidth: "100%" }}
							wrap
						>
							<Segmented<NotificationScope>
								disabled={busy}
								onChange={changeScope}
								options={[
									{
										label: t("adminShell.notificationCenter.all"),
										value: "all",
									},
									{
										label: t("adminShell.notificationCenter.unread"),
										value: "unread",
									},
								]}
								value={scope}
							/>
							<Search
								aria-label={t(
									"adminShell.notificationCenter.searchPlaceholder",
								)}
								allowClear
								disabled={busy}
								onChange={(event) => setKeywordDraft(event.target.value)}
								onSearch={applyKeyword}
								placeholder={t(
									"adminShell.notificationCenter.searchPlaceholder",
								)}
								style={{ width: 272, maxWidth: "100%" }}
								value={keywordDraft}
							/>
						</Flex>
					</Flex>
				}
				styles={{
					header: { paddingBlock: token.padding },
					body: { padding: `0 ${token.paddingLG}px ${token.padding}px` },
				}}
			>
				<NotificationListPanel
					formatPreferences={formatPreferences}
					isError={query.isError}
					isFetching={query.isFetching && !query.isPending}
					onRead={(notificationId) => {
						if (!busy && !query.isPlaceholderData)
							readMutation.mutate(notificationId);
					}}
					onRetry={() => void query.refetch()}
					page={notificationPage}
					readDisabled={busy || query.isPlaceholderData}
					readingId={
						readMutation.isPending ? readMutation.variables : undefined
					}
				/>
				<Flex justify="end" style={{ marginTop: token.margin }}>
					<Pagination
						current={notificationPage ? notificationPage.page : page}
						disabled={busy}
						onChange={(nextPage, nextPageSize) => {
							setPage(nextPage);
							setPageSize(nextPageSize);
						}}
						pageSize={notificationPage ? notificationPage.pageSize : pageSize}
						showSizeChanger
						total={notificationPage ? notificationPage.total : 0}
					/>
				</Flex>
			</Card>
		</>
	);
}
