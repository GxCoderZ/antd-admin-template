import { MailOutlined } from "@ant-design/icons";
import { getPlatformAccount, platformAccountQueryKey } from "#src/api/account";
import { getPlatformSession, platformSessionQueryKey } from "#src/api/auth";
import { ApiProblemError } from "#src/api/client";
import { useQuery } from "@tanstack/react-query";
import {
	Alert,
	Button,
	Card,
	Col,
	Descriptions,
	Divider,
	Flex,
	Row,
	Space,
	Tag,
	theme,
	Typography,
} from "antd";
import { useTranslation } from "react-i18next";

import { formatDateTime } from "../../app/formatting";
import { useLocalePreferences } from "../../app/localePreferences";
import { PlatformUserAvatar } from "../../app/PlatformUserAvatar";

const { Paragraph, Text, Title } = Typography;

interface AccountProfilePageProps {
	onOpenSettings: () => void;
}

function getProblemDetail(error: unknown) {
	return error instanceof ApiProblemError ? error.problem?.detail : undefined;
}

function usePlatformAccountQuery() {
	return useQuery({
		queryFn: ({ signal }) => getPlatformAccount(signal),
		queryKey: platformAccountQueryKey,
	});
}

function usePlatformSessionQuery() {
	return useQuery({
		queryFn: ({ signal }) => getPlatformSession(signal),
		queryKey: platformSessionQueryKey,
		staleTime: Number.POSITIVE_INFINITY,
	});
}

function AccountPageHeading({
	description,
	title,
}: {
	description: string;
	title: string;
}) {
	const { token } = theme.useToken();

	return (
		<section aria-labelledby="account-page-title">
			<Title
				id="account-page-title"
				level={3}
				style={{ marginBottom: token.marginXXS }}
			>
				{title}
			</Title>
			<Paragraph style={{ marginBottom: 0 }} type="secondary">
				{description}
			</Paragraph>
		</section>
	);
}

function AccountRoleTags({
	roles,
}: {
	roles: readonly { displayName: string; id: string }[];
}) {
	const { t } = useTranslation();

	if (roles.length === 0) {
		return (
			<Text type="secondary">{t("adminShell.account.profile.noRoles")}</Text>
		);
	}

	return (
		<Space size="small" wrap>
			{roles.map((role) => (
				<Tag key={role.id}>{role.displayName}</Tag>
			))}
		</Space>
	);
}

export function AccountProfilePage({
	onOpenSettings,
}: AccountProfilePageProps) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const accountQuery = usePlatformAccountQuery();
	const sessionQuery = usePlatformSessionQuery();
	const formatPreferences = useLocalePreferences();
	const avatarSize = token.controlHeightLG * 2;
	const account = accountQuery.data;
	const currentUserId = sessionQuery.data?.user.id;

	if (!account || !currentUserId) {
		const loadError = accountQuery.error ?? sessionQuery.error;

		return (
			<Flex gap={token.marginLG} vertical>
				<AccountPageHeading
					description={t("adminShell.account.profile.description")}
					title={t("adminShell.account.profile.title")}
				/>
				{loadError ? (
					<Alert
						action={
							<Button
								onClick={() => {
									void accountQuery.refetch();
									void sessionQuery.refetch();
								}}
							>
								{t("adminShell.account.retry")}
							</Button>
						}
						description={
							getProblemDetail(loadError) ??
							t("adminShell.account.requestErrorFallback")
						}
						showIcon
						title={t("adminShell.account.profile.loadError")}
						type="error"
					/>
				) : (
					<Card data-testid="account-profile-skeleton" loading />
				)}
			</Flex>
		);
	}

	const displayName = account.displayName.trim() || account.username;
	const accountDetails = [
		{
			key: "username",
			label: t("adminShell.account.profile.username"),
			children: account.username,
		},
		{
			key: "email",
			label: t("adminShell.account.profile.email"),
			children: account.email,
		},
		{
			key: "roles",
			label: t("adminShell.account.profile.roles"),
			children: <AccountRoleTags roles={account.roles} />,
		},
		{
			key: "createdAt",
			label: t("adminShell.account.profile.createdAt"),
			children: formatDateTime(account.createdAt, formatPreferences),
		},
	];

	return (
		<Flex gap={token.marginLG} vertical>
			<AccountPageHeading
				description={t("adminShell.account.profile.description")}
				title={t("adminShell.account.profile.title")}
			/>
			<Row gutter={[token.marginLG, token.marginLG]}>
				<Col lg={7} xs={24}>
					<Card style={{ height: "100%" }}>
						<Flex align="center" gap={token.marginSM} vertical>
							<PlatformUserAvatar
								displayName={displayName}
								fallback="icon"
								revision={accountQuery.dataUpdatedAt}
								size={avatarSize}
								userId={currentUserId}
							/>
							<Flex align="center" gap={token.marginXXS} vertical>
								<Title level={4} style={{ margin: 0 }}>
									{displayName}
								</Title>
								<Text type="secondary">@{account.username}</Text>
								<AccountRoleTags roles={account.roles} />
							</Flex>
						</Flex>
						<Divider />
						<Text>
							<MailOutlined aria-hidden /> {account.email}
						</Text>
						<Divider />
						<Button block onClick={onOpenSettings} type="primary">
							{t("adminShell.account.profile.edit")}
						</Button>
					</Card>
				</Col>
				<Col lg={17} xs={24}>
					<Card title={t("adminShell.account.profile.detailsTitle")}>
						<Descriptions
							column={{ xs: 1, sm: 2 }}
							items={accountDetails}
							size="small"
						/>
					</Card>
				</Col>
			</Row>
		</Flex>
	);
}
