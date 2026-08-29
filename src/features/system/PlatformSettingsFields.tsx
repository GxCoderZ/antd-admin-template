import { platformSettingsLimits as limits } from "#src/api/settings";
import { Form, Input, Select, Switch } from "antd";
import { useTranslation } from "react-i18next";

import { SystemLogoInput } from "./SystemLogoInput";

export function GeneralSettingsFields({
	disabled,
	onLogoLoading,
	logoLoading,
}: {
	disabled: boolean;
	onLogoLoading: (loading: boolean) => void;
	logoLoading: boolean;
}) {
	const { t } = useTranslation();
	return (
		<>
			{(
				[
					"siteTitle",
					"shortTitle",
					"logoDataUrl",
					"browserTitle",
					"copyright",
				] as const
			).map((name) =>
				name === "logoDataUrl" ? (
					<Form.Item
						key={name}
						label={t("adminShell.platformSettings.general.logo")}
						name={["general", name]}
					>
						<SystemLogoInput
							disabled={disabled}
							loading={logoLoading}
							onLoading={onLogoLoading}
						/>
					</Form.Item>
				) : (
					<Form.Item
						key={name}
						label={t(`adminShell.platformSettings.general.${name}`)}
						name={["general", name]}
						rules={[
							{
								required: true,
								whitespace: true,
								max: limits[name],
								message: t("adminShell.platformSettings.validation.text", {
									max: limits[name],
								}),
							},
						]}
					>
						<Input maxLength={limits[name]} />
					</Form.Item>
				),
			)}
		</>
	);
}

export function SecuritySettingsFields({ disabled }: { disabled: boolean }) {
	const { t } = useTranslation();
	const form = Form.useFormInstance();
	const maintenanceEnabled: unknown = Form.useWatch(
		["security", "maintenanceEnabled"],
		form,
	);
	return (
		<>
			<Form.Item
				label={t("adminShell.platformSettings.security.loginAccess")}
				name={["security", "loginAccess"]}
			>
				<Select
					options={(["all", "adminOnly", "disabled"] as const).map((value) => ({
						value,
						label: t(`adminShell.platformSettings.loginAccess.${value}`),
					}))}
				/>
			</Form.Item>
			<Form.Item
				label={t("adminShell.platformSettings.security.maintenanceEnabled")}
				name={["security", "maintenanceEnabled"]}
				valuePropName="checked"
			>
				<Switch />
			</Form.Item>
			<Form.Item
				dependencies={[["security", "maintenanceEnabled"]]}
				label={t("adminShell.platformSettings.security.maintenanceMessage")}
				name={["security", "maintenanceMessage"]}
				rules={[
					{
						required: maintenanceEnabled === true,
						whitespace: maintenanceEnabled === true,
						max: limits.maintenanceMessage,
						message: t("adminShell.platformSettings.validation.text", {
							max: limits.maintenanceMessage,
						}),
					},
				]}
			>
				<Input.TextArea
					autoSize={{ minRows: 2, maxRows: 4 }}
					disabled={disabled || !maintenanceEnabled}
					maxLength={limits.maintenanceMessage}
				/>
			</Form.Item>
		</>
	);
}

export function NotificationSettingsFields({
	disabled,
}: {
	disabled: boolean;
}) {
	const { t } = useTranslation();
	return (
		<>
			{(["announcementsEnabled", "inboxEnabled"] as const).map((name) => (
				<Form.Item
					key={name}
					label={t(`adminShell.platformSettings.notifications.${name}`)}
					name={["notifications", name]}
					valuePropName="checked"
				>
					<Switch disabled={disabled} />
				</Form.Item>
			))}
		</>
	);
}
