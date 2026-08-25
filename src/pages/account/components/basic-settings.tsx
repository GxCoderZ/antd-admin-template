import type { AccountProfileType } from "#src/api/account";

import { fetchAccountProfile, fetchDeleteAccountAvatar, fetchUpdateAccountProfile, fetchUploadAccountAvatar } from "#src/api/account";
import { BasicButton } from "#src/components/basic-button";
import { BasicCard } from "#src/components/basic-card";
import { useUserStore } from "#src/store/user";

import { DeleteOutlined, MailOutlined, ReloadOutlined, UploadOutlined, UserOutlined } from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, Avatar, Col, Flex, Form, Input, Row, Space, theme, Typography, Upload } from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { accountProfileQueryKey, avatarUploadLimitBytes, supportedAvatarContentTypes } from "../constants";

interface BasicSettingsValues {
	display_name: string
}

export function BasicSettings() {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const queryClient = useQueryClient();
	const refreshUserInfo = useUserStore(state => state.getUserInfo);
	const [avatarValidationError, setAvatarValidationError] = useState<string>();
	const accountQuery = useQuery({
		queryKey: accountProfileQueryKey,
		queryFn: async () => {
			const response = await fetchAccountProfile();
			if (response.code !== 0)
				throw new Error(response.msg);
			return response.data;
		},
	});
	const updateMutation = useMutation({
		mutationFn: async (values: BasicSettingsValues) => {
			const response = await fetchUpdateAccountProfile({ display_name: values.display_name, email: accountQuery.data!.email });
			if (response.code !== 0)
				throw new Error(response.msg);
			return response.data;
		},
		onSuccess: async (account) => {
			queryClient.setQueryData<AccountProfileType>(accountProfileQueryKey, account);
			await refreshUserInfo();
		},
	});
	const uploadMutation = useMutation({
		mutationFn: async (file: File) => {
			const response = await fetchUploadAccountAvatar(file);
			if (response.code !== 0)
				throw new Error(response.msg);
			return response.data.avatar;
		},
		onSuccess: async (avatar) => {
			queryClient.setQueryData<AccountProfileType>(accountProfileQueryKey, current => current ? { ...current, avatar } : current);
			await refreshUserInfo();
		},
	});
	const deleteMutation = useMutation({
		mutationFn: async () => {
			const response = await fetchDeleteAccountAvatar();
			if (response.code !== 0)
				throw new Error(response.msg);
		},
		onSuccess: async () => {
			queryClient.setQueryData<AccountProfileType>(accountProfileQueryKey, current => current ? { ...current, avatar: "" } : current);
			await refreshUserInfo();
		},
	});
	const account = accountQuery.data;
	const mutationError = updateMutation.error ?? uploadMutation.error ?? deleteMutation.error;

	if (accountQuery.isLoading)
		return <BasicCard loading />;
	if (accountQuery.isError || !account) {
		return (
			<Alert
				action={<BasicButton icon={<ReloadOutlined />} onClick={() => accountQuery.refetch()}>{t("common.retry")}</BasicButton>}
				description={accountQuery.error?.message}
				message={t("account.profileLoadError")}
				showIcon
				type="error"
			/>
		);
	}

	return (
		<Flex gap={token.marginLG} vertical>
			{mutationError && <Alert closable description={mutationError.message} message={t("account.updateError")} showIcon type="error" />}
			{updateMutation.isSuccess && <Alert closable description={t("account.profileSavedDescription")} message={t("account.profileSaved")} showIcon type="success" />}
			{avatarValidationError && <Alert closable description={avatarValidationError} message={t("account.avatarValidationError")} onClose={() => setAvatarValidationError(undefined)} showIcon type="error" />}
			{uploadMutation.isSuccess && <Alert closable description={t("account.avatarUpdatedDescription")} message={t("account.avatarUpdated")} showIcon type="success" />}
			{deleteMutation.isSuccess && <Alert closable description={t("account.avatarDeletedDescription")} message={t("account.avatarDeleted")} showIcon type="success" />}
			<Row gutter={[token.marginXL, token.marginLG]}>
				<Col lg={16} xs={24}>
					<Form<BasicSettingsValues>
						initialValues={{ display_name: account.display_name }}
						key={`${account.id}:${account.display_name}`}
						layout="vertical"
						onFinish={values => updateMutation.mutate(values)}
						requiredMark={false}
						style={{ maxWidth: token.controlHeightLG * 10 }}
					>
						<Form.Item label={t("account.username")}><Input disabled prefix={<UserOutlined />} value={account.username} /></Form.Item>
						<Form.Item label={t("account.displayName")} name="display_name" rules={[{ max: 64, required: true, whitespace: true }]}>
							<Input maxLength={64} />
						</Form.Item>
						<Form.Item label={t("account.email")}><Input disabled prefix={<MailOutlined />} value={account.email} /></Form.Item>
						<BasicButton htmlType="submit" loading={updateMutation.isPending} type="primary">{t("common.save")}</BasicButton>
					</Form>
				</Col>
				<Col lg={8} xs={24}>
					<Flex align="center" gap={token.marginSM} vertical>
						<Typography.Text strong>{t("account.avatar")}</Typography.Text>
						<Avatar icon={<UserOutlined />} size={token.controlHeightLG * 2} src={account.avatar || undefined} />
						<Space size={token.marginXS} wrap>
							<Upload
								accept="image/png,image/jpeg,image/webp"
								beforeUpload={(file) => {
									if (!supportedAvatarContentTypes.has(file.type)) {
										setAvatarValidationError(t("account.avatarTypeError"));
										return Upload.LIST_IGNORE;
									}
									if (file.size > avatarUploadLimitBytes) {
										setAvatarValidationError(t("account.avatarSizeError"));
										return Upload.LIST_IGNORE;
									}
									setAvatarValidationError(undefined);
									return true;
								}}
								customRequest={({ file }) => file instanceof File && uploadMutation.mutate(file)}
								maxCount={1}
								showUploadList={false}
							>
								<BasicButton icon={<UploadOutlined />} loading={uploadMutation.isPending}>{t("account.uploadAvatar")}</BasicButton>
							</Upload>
							<BasicButton danger icon={<DeleteOutlined />} loading={deleteMutation.isPending} onClick={() => deleteMutation.mutate()}>{t("account.deleteAvatar")}</BasicButton>
						</Space>
						<Typography.Text className="text-center" type="secondary">{t("account.avatarHint")}</Typography.Text>
					</Flex>
				</Col>
			</Row>
		</Flex>
	);
}
