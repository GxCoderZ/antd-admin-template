import { fetchAccountProfile } from "#src/api/account";
import { BasicButton } from "#src/components/basic-button";
import { BasicCard } from "#src/components/basic-card";
import { BasicContent } from "#src/components/basic-content";

import { MailOutlined, ReloadOutlined, UserOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { Alert, Avatar, Col, Descriptions, Divider, Flex, Row, theme, Typography } from "antd";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import { AccountPageHeading } from "../components/account-page-heading";
import { AccountRoleTags } from "../components/account-role-tags";
import { accountProfileQueryKey } from "../constants";

export default function AccountProfile() {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const navigate = useNavigate();
	const accountQuery = useQuery({
		queryKey: accountProfileQueryKey,
		queryFn: async () => {
			const response = await fetchAccountProfile();
			if (response.code !== 0)
				throw new Error(response.msg);
			return response.data;
		},
	});
	const account = accountQuery.data;

	return (
		<BasicContent>
			<Flex gap={token.marginLG} vertical>
				<AccountPageHeading description={t("account.profileDescription")} title={t("account.profileTitle")} />
				{accountQuery.isError && (
					<Alert
						action={<BasicButton icon={<ReloadOutlined />} onClick={() => accountQuery.refetch()}>{t("common.retry")}</BasicButton>}
						description={accountQuery.error.message}
						message={t("account.profileLoadError")}
						showIcon
						type="error"
					/>
				)}
				{accountQuery.isLoading && <BasicCard loading />}
				{account && (
					<Row gutter={[token.marginLG, token.marginLG]}>
						<Col lg={7} xs={24}>
							<BasicCard className="h-full">
								<Flex align="center" gap={token.marginSM} vertical>
									<Avatar icon={<UserOutlined />} size={token.controlHeightLG * 2} src={account.avatar || undefined} />
									<Flex align="center" gap={token.marginXXS} vertical>
										<Typography.Title level={4} style={{ margin: 0 }}>{account.display_name || account.username}</Typography.Title>
										<Typography.Text type="secondary">{`@${account.username}`}</Typography.Text>
										<AccountRoleTags roles={account.roles} />
									</Flex>
								</Flex>
								<Divider />
								<Flex align="center" gap={token.marginXS}>
									<MailOutlined />
									<Typography.Text>{account.email}</Typography.Text>
								</Flex>
								<Divider />
								<BasicButton block type="primary" onClick={() => navigate("/account/settings")}>{t("account.editProfile")}</BasicButton>
							</BasicCard>
						</Col>
						<Col lg={17} xs={24}>
							<BasicCard title={t("account.detailsTitle")}>
								<Descriptions
									column={{ xs: 1, sm: 2 }}
									items={[
										{ key: "username", label: t("account.username"), children: account.username },
										{ key: "email", label: t("account.email"), children: account.email },
										{ key: "roles", label: t("account.roles"), children: <AccountRoleTags roles={account.roles} /> },
										{ key: "createdAt", label: t("account.createdAt"), children: account.created_at },
									]}
									size="small"
								/>
							</BasicCard>
						</Col>
					</Row>
				)}
			</Flex>
		</BasicContent>
	);
}
