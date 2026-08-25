import { SaveOutlined } from "@ant-design/icons";
import { ApiProblemError } from "#src/api/client";
import {
	getPlatformSettings,
	platformSettingsQueryKey,
	type UpdatePlatformSettingsInput,
	updatePlatformSettings,
} from "#src/api/settings";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, Button, Card, Flex, Form, Input, Tabs, theme } from "antd";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router";

import { FormSkeleton } from "../../app/LoadingSkeletons";
import { platformPermissions, usePermission } from "../../app/permissions";
import { SystemPreferenceSettings } from "./SystemPreferenceSettings";

const settingsSections = ["general", "preferences"] as const;
type SettingsSection = (typeof settingsSections)[number];
type SettingsFormValues = Pick<UpdatePlatformSettingsInput, "siteTitle">;

function getProblemDetail(error: unknown) {
	return error instanceof ApiProblemError ? error.problem?.detail : undefined;
}

function isApiProblemStatus(error: unknown, status: number) {
	return error instanceof ApiProblemError && error.status === status;
}

function isSettingsSection(value: string | null): value is SettingsSection {
	return settingsSections.some((section) => section === value);
}

function PlatformGeneralSettings() {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const [form] = Form.useForm<SettingsFormValues>();
	const queryClient = useQueryClient();
	const canManageSettings = usePermission(platformPermissions.settingsManage);
	const settingsQuery = useQuery({
		queryFn: ({ signal }) => getPlatformSettings(signal),
		queryKey: platformSettingsQueryKey,
	});
	const updateMutation = useMutation({
		mutationFn: updatePlatformSettings,
		onSuccess: (updatedSettings) => {
			queryClient.setQueryData(platformSettingsQueryKey, updatedSettings);
			form.setFieldsValue(updatedSettings);
		},
	});
	const updateConflict = isApiProblemStatus(updateMutation.error, 409);

	useEffect(() => {
		if (settingsQuery.data) {
			form.setFieldsValue(settingsQuery.data);
		}
	}, [form, settingsQuery.data]);

	return (
		<Flex gap={token.margin} style={{ maxWidth: token.screenSM }} vertical>
			{settingsQuery.isError ? (
				<Alert
					action={
						<Button onClick={() => void settingsQuery.refetch()}>
							{t("adminShell.platformSettings.retry")}
						</Button>
					}
					description={
						getProblemDetail(settingsQuery.error) ??
						t("adminShell.platformSettings.errors.fallback")
					}
					showIcon
					title={t("adminShell.platformSettings.errors.load")}
					type="error"
				/>
			) : null}
			{updateMutation.isError ? (
				<Alert
					action={
						updateConflict ? (
							<Button
								onClick={() => {
									updateMutation.reset();
									void settingsQuery.refetch();
								}}
							>
								{t("optimisticLock.reload")}
							</Button>
						) : undefined
					}
					closable
					description={
						updateConflict
							? t("optimisticLock.description")
							: (getProblemDetail(updateMutation.error) ??
								t("adminShell.platformSettings.errors.fallback"))
					}
					onClose={() => updateMutation.reset()}
					showIcon
					title={t(
						updateConflict
							? "optimisticLock.title"
							: "adminShell.platformSettings.errors.update",
					)}
					type="error"
				/>
			) : null}
			{updateMutation.isSuccess ? (
				<Alert
					closable
					onClose={() => updateMutation.reset()}
					showIcon
					title={t("adminShell.platformSettings.saved")}
					type="success"
				/>
			) : null}
			{settingsQuery.isPending ? (
				<FormSkeleton />
			) : (
				<Form<SettingsFormValues>
					form={form}
					layout="vertical"
					onFinish={(values) => {
						const expectedVersion = settingsQuery.data?.version;

						if (canManageSettings && expectedVersion !== undefined) {
							updateMutation.mutate({ ...values, expectedVersion });
						} else if (canManageSettings) {
							void settingsQuery.refetch();
						}
					}}
					onValuesChange={() => {
						if (!updateConflict) {
							updateMutation.reset();
						}
					}}
				>
					<Form.Item
						label={t("adminShell.platformSettings.siteTitle")}
						name="siteTitle"
						rules={[
							{
								max: 64,
								message: t("adminShell.platformSettings.validation.siteTitle"),
								min: 1,
								required: true,
								whitespace: true,
							},
						]}
					>
						<Input
							disabled={settingsQuery.isError}
							maxLength={64}
							readOnly={!canManageSettings}
							showCount={canManageSettings}
						/>
					</Form.Item>
					{canManageSettings ? (
						<Button
							disabled={
								settingsQuery.isError || !settingsQuery.data || updateConflict
							}
							htmlType="submit"
							icon={<SaveOutlined aria-hidden />}
							loading={updateMutation.isPending}
							type="primary"
						>
							{t("adminShell.platformSettings.save")}
						</Button>
					) : null}
				</Form>
			)}
		</Flex>
	);
}

export function PlatformSettingsPage() {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const location = useLocation();
	const navigate = useNavigate();
	const selectedSection: SettingsSection = location.pathname.endsWith(
		"/appearance",
	)
		? "preferences"
		: "general";
	const selectedSectionLabel = t(
		`adminShell.platformSettings.sections.${selectedSection}`,
	);

	function changeSection(nextSection: string) {
		if (!isSettingsSection(nextSection)) {
			return;
		}

		void navigate(
			nextSection === "general"
				? "/system/settings"
				: "/system/settings/appearance",
		);
	}

	return (
		<Flex gap={token.marginLG} vertical>
			<Tabs
				activeKey={selectedSection}
				animated={{ inkBar: true, tabPane: false }}
				aria-label={t("adminShell.platformSettings.navigationLabel")}
				items={[
					{
						key: "general",
						label: t("adminShell.platformSettings.sections.general"),
					},
					{
						key: "preferences",
						label: t("adminShell.platformSettings.sections.preferences"),
					},
				]}
				onChange={changeSection}
				tabBarStyle={{ margin: 0 }}
			/>
			<Card styles={{ body: { minHeight: 520 } }} variant="borderless">
				<section aria-label={selectedSectionLabel}>
					{selectedSection === "general" ? (
						<PlatformGeneralSettings />
					) : (
						<SystemPreferenceSettings />
					)}
				</section>
			</Card>
		</Flex>
	);
}
