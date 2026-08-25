import type { AccountPasswordChangeReq } from "#src/api/account";

import { fetchAccountSessions, fetchChangeAccountPassword, fetchRevokeAccountSession, fetchRevokeOtherAccountSessions } from "#src/api/account";
import { BasicButton } from "#src/components/basic-button";

import { LaptopOutlined, LockOutlined, ReloadOutlined } from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, Avatar, Divider, Empty, Flex, Form, Input, List, Popconfirm, Skeleton, Space, Tag, theme, Typography } from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { accountSessionsQueryKey } from "../constants";

export function SecuritySettings() {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const queryClient = useQueryClient();
	const [form] = Form.useForm<AccountPasswordChangeReq>();
	const [sessionSuccess, setSessionSuccess] = useState<"one" | "others">();
	const sessionsQuery = useQuery({
		queryKey: accountSessionsQueryKey,
		queryFn: async () => {
			const response = await fetchAccountSessions();
			if (response.code !== 0)
				throw new Error(response.msg);
			return response.data;
		},
	});
	const changePasswordMutation = useMutation({
		mutationFn: async (values: AccountPasswordChangeReq) => {
			const response = await fetchChangeAccountPassword(values);
			if (response.code !== 0)
				throw new Error(response.msg);
		},
		onSuccess: () => form.resetFields(),
	});
	const revokeMutation = useMutation({
		mutationFn: async (sessionId: string) => {
			const response = await fetchRevokeAccountSession({ session_id: sessionId });
			if (response.code !== 0)
				throw new Error(response.msg);
			return response.data;
		},
		onSuccess: async () => {
			setSessionSuccess("one");
			await queryClient.invalidateQueries({ queryKey: accountSessionsQueryKey });
		},
	});
	const revokeOthersMutation = useMutation({
		mutationFn: async () => {
			const response = await fetchRevokeOtherAccountSessions();
			if (response.code !== 0)
				throw new Error(response.msg);
			return response.data;
		},
		onSuccess: async () => {
			setSessionSuccess("others");
			await queryClient.invalidateQueries({ queryKey: accountSessionsQueryKey });
		},
	});
	const sessions = sessionsQuery.data ?? [];
	const otherSessionCount = sessions.filter(session => !session.current).length;
	const sessionMutationError = revokeMutation.error ?? revokeOthersMutation.error;

	return (
		<Flex gap={token.marginLG} vertical>
			{changePasswordMutation.isError && <Alert closable description={changePasswordMutation.error.message} message={t("account.passwordChangeError")} showIcon type="error" />}
			{changePasswordMutation.isSuccess && <Alert closable description={t("account.passwordChangedDescription")} message={t("account.passwordChanged")} showIcon type="success" />}
			<Form<AccountPasswordChangeReq>
				form={form}
				layout="vertical"
				onFinish={values => changePasswordMutation.mutate(values)}
				requiredMark={false}
				style={{ maxWidth: token.controlHeightLG * 10 }}
			>
				<Form.Item label={t("account.currentPassword")} name="current_password" rules={[{ required: true }]}>
					<Input.Password autoComplete="current-password" maxLength={1024} prefix={<LockOutlined />} />
				</Form.Item>
				<Form.Item label={t("account.newPassword")} name="new_password" rules={[{ required: true }, { min: 12, max: 1024, message: t("account.passwordLength") }]}>
					<Input.Password autoComplete="new-password" maxLength={1024} prefix={<LockOutlined />} />
				</Form.Item>
				<BasicButton htmlType="submit" loading={changePasswordMutation.isPending} type="primary">{t("account.changePassword")}</BasicButton>
			</Form>
			<Divider className="!m-0" />
			<Flex align="flex-start" gap={token.margin} justify="space-between" wrap>
				<Flex gap={token.marginXXS} vertical>
					<Typography.Title level={5} style={{ margin: 0 }}>{t("account.sessions")}</Typography.Title>
					<Typography.Text type="secondary">{t("account.sessionsDescription")}</Typography.Text>
				</Flex>
				<Popconfirm
					description={t("account.revokeOthersConfirmDescription", { count: otherSessionCount })}
					disabled={otherSessionCount === 0}
					okButtonProps={{ danger: true, loading: revokeOthersMutation.isPending }}
					onConfirm={() => {
						setSessionSuccess(undefined);
						revokeOthersMutation.mutate();
					}}
					title={t("account.revokeOthersConfirmTitle")}
				>
					<BasicButton danger disabled={otherSessionCount === 0 || revokeMutation.isPending} loading={revokeOthersMutation.isPending}>{t("account.revokeOthers")}</BasicButton>
				</Popconfirm>
			</Flex>
			{sessionMutationError && <Alert closable description={sessionMutationError.message} message={t("account.sessionsUpdateError")} showIcon type="error" />}
			{sessionSuccess && <Alert closable description={t(sessionSuccess === "one" ? "account.sessionRevokedDescription" : "account.otherSessionsRevokedDescription")} message={t("account.sessionsUpdated")} onClose={() => setSessionSuccess(undefined)} showIcon type="success" />}
			{sessionsQuery.isLoading && <Skeleton active paragraph={{ rows: 3 }} />}
			{sessionsQuery.isError && (
				<Alert
					action={<BasicButton icon={<ReloadOutlined />} onClick={() => sessionsQuery.refetch()}>{t("common.retry")}</BasicButton>}
					description={sessionsQuery.error.message}
					message={t("account.sessionsLoadError")}
					showIcon
					type="error"
				/>
			)}
			{sessionsQuery.isSuccess && sessions.length === 0 && <Empty description={t("account.sessionsEmpty")} image={Empty.PRESENTED_IMAGE_SIMPLE} />}
			{sessionsQuery.isSuccess && sessions.length > 0 && (
				<List
					dataSource={sessions}
					renderItem={session => (
						<List.Item
							actions={[
								session.current
									? <BasicButton key="current" disabled>{t("account.revokeSession")}</BasicButton>
									: (
										<Popconfirm key="revoke" description={t("account.revokeSessionConfirmDescription")} onConfirm={() => revokeMutation.mutate(session.id)} title={t("account.revokeSessionConfirmTitle")}>
											<BasicButton danger loading={revokeMutation.isPending && revokeMutation.variables === session.id}>{t("account.revokeSession")}</BasicButton>
										</Popconfirm>
									),
							]}
							style={{ background: session.current ? token.colorSuccessBg : undefined, borderRadius: token.borderRadius, padding: token.paddingSM }}
						>
							<List.Item.Meta
								avatar={<Avatar icon={<LaptopOutlined />} />}
								description={(
									<Flex gap={token.marginXXS} vertical>
										<Space size={token.marginSM} wrap>
											<Typography.Text type="secondary">{t("account.ipValue", { value: session.ip })}</Typography.Text>
											<Typography.Text type="secondary">{t("account.languageValue", { value: session.language })}</Typography.Text>
											<Typography.Text type="secondary">{t("account.timeZoneValue", { value: session.time_zone })}</Typography.Text>
										</Space>
										<Typography.Text type="secondary">{t("account.createdValue", { value: session.created_at })}</Typography.Text>
										<Typography.Text type="secondary">{t("account.expiresValue", { value: session.expires_at })}</Typography.Text>
									</Flex>
								)}
								title={(
									<Space>
										<Typography.Text strong>{session.device}</Typography.Text>
										{session.current ? <Tag color="success">{t("account.currentSession")}</Tag> : null}
									</Space>
								)}
							/>
						</List.Item>
					)}
				/>
			)}
		</Flex>
	);
}
