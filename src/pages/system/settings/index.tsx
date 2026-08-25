import type { PlatformSettingsUpdateReq } from "#src/api/system/settings";

import { fetchPlatformSettings, fetchUpdatePlatformSettings } from "#src/api/system/settings";
import { BasicButton } from "#src/components/basic-button";
import { BasicCard } from "#src/components/basic-card";
import { BasicContent } from "#src/components/basic-content";
import { FormSkeleton } from "#src/components/loading-skeletons";
import { usePermission } from "#src/hooks/use-permission";

import { ReloadOutlined, SaveOutlined } from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, Flex, Form, Input, theme } from "antd";
import { useTranslation } from "react-i18next";

const platformSettingsQueryKey = ["platform-settings"] as const;

export default function PlatformSettings() {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const queryClient = useQueryClient();
	const canManageSettings = usePermission("system:settings:edit");
	const settingsQuery = useQuery({
		queryKey: platformSettingsQueryKey,
		queryFn: async () => {
			const response = await fetchPlatformSettings();
			if (response.code !== 0)
				throw new Error(response.msg);
			return response.data;
		},
	});
	const updateMutation = useMutation({
		mutationFn: async (values: PlatformSettingsUpdateReq) => {
			const response = await fetchUpdatePlatformSettings(values);
			if (response.code !== 0)
				throw new Error(response.msg);
			return response.data;
		},
		onSuccess: (settings) => {
			queryClient.setQueryData(platformSettingsQueryKey, settings);
			document.title = settings.site_title;
		},
	});

	return (
		<BasicContent>
			<BasicCard title={t("platform-settings.title")}>
				<Flex gap={token.margin} style={{ maxWidth: token.screenSM }} vertical>
					{settingsQuery.isError && (
						<Alert
							action={<BasicButton icon={<ReloadOutlined />} onClick={() => settingsQuery.refetch()}>{t("common.retry")}</BasicButton>}
							description={settingsQuery.error.message}
							message={t("platform-settings.loadError")}
							showIcon
							type="error"
						/>
					)}
					{updateMutation.isError && <Alert closable description={updateMutation.error.message} message={t("platform-settings.updateError")} onClose={() => updateMutation.reset()} showIcon type="error" />}
					{updateMutation.isSuccess && <Alert closable message={t("platform-settings.saved")} onClose={() => updateMutation.reset()} showIcon type="success" />}
					{settingsQuery.isLoading
						? <FormSkeleton />
						: settingsQuery.data && (
							<Form<PlatformSettingsUpdateReq>
								initialValues={{ site_title: settingsQuery.data.site_title }}
								key={settingsQuery.data.updated_at}
								layout="vertical"
								onFinish={values => canManageSettings && updateMutation.mutate(values)}
							>
								<Form.Item label={t("platform-settings.siteTitle")} name="site_title" rules={[{ max: 64, min: 1, required: true, whitespace: true }]}>
									<Input disabled={settingsQuery.isError} maxLength={64} readOnly={!canManageSettings} showCount={canManageSettings} />
								</Form.Item>
								{canManageSettings && (
									<BasicButton disabled={settingsQuery.isError} htmlType="submit" icon={<SaveOutlined />} loading={updateMutation.isPending} type="primary">
										{t("common.save")}
									</BasicButton>
								)}
							</Form>
						)}
				</Flex>
			</BasicCard>
		</BasicContent>
	);
}
