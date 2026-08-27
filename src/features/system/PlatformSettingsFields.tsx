import {
	passwordRequirements,
	platformSettingsLimits as limits,
} from "#src/api/settings";
import {
	Checkbox,
	ConfigProvider,
	DatePicker,
	Form,
	Input,
	InputNumber,
	Select,
	Switch,
	theme,
} from "antd";
import dayjs, { type Dayjs } from "dayjs";
import "dayjs/locale/zh-cn";
import "dayjs/locale/zh-tw";
import "dayjs/locale/ko";
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
	const { token } = theme.useToken();
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
			<ConfigProvider
				theme={{
					components: { DatePicker: { timeColumnWidth: token.controlHeight } },
				}}
			>
				<Form.Item
					getValueFromEvent={(value: Dayjs | null) =>
						value ? value.toISOString() : null
					}
					getValueProps={(value: string | null) => ({
						value: value ? dayjs(value) : null,
					})}
					label={t("adminShell.platformSettings.security.maintenanceEndsAt")}
					name={["security", "maintenanceEndsAt"]}
				>
					<DatePicker
						disabled={disabled || !maintenanceEnabled}
						format="YYYY-MM-DD HH:mm"
						popupAlign={{
							overflow: { adjustX: true, adjustY: true, shiftX: true },
						}}
						showTime
						style={{ width: "100%" }}
					/>
				</Form.Item>
			</ConfigProvider>
			<Form.Item
				label={t("adminShell.platformSettings.security.captchaEnabled")}
				name={["security", "captchaEnabled"]}
				valuePropName="checked"
			>
				<Switch />
			</Form.Item>
			<Form.Item
				label={t("adminShell.platformSettings.security.passwordMinLength")}
				name={["security", "passwordMinLength"]}
				rules={[
					{
						required: true,
						type: "integer",
						...limits.passwordMinLength,
						message: t(
							"adminShell.platformSettings.validation.number",
							limits.passwordMinLength,
						),
					},
				]}
			>
				<InputNumber
					{...limits.passwordMinLength}
					suffix={t("adminShell.platformSettings.units.characters")}
					style={{ width: "100%" }}
				/>
			</Form.Item>
			<Form.Item
				label={t("adminShell.platformSettings.security.passwordRequirements")}
				name={["security", "passwordRequirements"]}
			>
				<Checkbox.Group
					options={passwordRequirements.map((value) => ({
						value,
						label: t(
							`adminShell.platformSettings.passwordRequirements.${value}`,
						),
					}))}
				/>
			</Form.Item>
			{(
				["loginFailureLimit", "lockoutMinutes", "idleTimeoutMinutes"] as const
			).map((name) => (
				<Form.Item
					key={name}
					label={t(`adminShell.platformSettings.security.${name}`)}
					name={["security", name]}
					rules={[
						{
							required: true,
							type: "integer",
							...limits[name],
							message: t(
								"adminShell.platformSettings.validation.number",
								limits[name],
							),
						},
					]}
				>
					<InputNumber
						{...limits[name]}
						suffix={t(
							name === "loginFailureLimit"
								? "adminShell.platformSettings.units.attempts"
								: "adminShell.platformSettings.units.minutes",
						)}
						style={{ width: "100%" }}
					/>
				</Form.Item>
			))}
			<Form.Item
				label={t(
					"adminShell.platformSettings.security.forceInitialPasswordChange",
				)}
				name={["security", "forceInitialPasswordChange"]}
				valuePropName="checked"
			>
				<Switch />
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
	const form = Form.useFormInstance();
	const inboxEnabled: unknown = Form.useWatch(
		["notifications", "inboxEnabled"],
		form,
	);
	return (
		<>
			{(
				[
					"announcementsEnabled",
					"inboxEnabled",
					"unreadReminderEnabled",
				] as const
			).map((name) => (
				<Form.Item
					key={name}
					label={t(`adminShell.platformSettings.notifications.${name}`)}
					name={["notifications", name]}
					valuePropName="checked"
				>
					<Switch
						disabled={
							disabled || (name === "unreadReminderEnabled" && !inboxEnabled)
						}
					/>
				</Form.Item>
			))}
			<Form.Item
				label={t("adminShell.platformSettings.notifications.retentionDays")}
				name={["notifications", "retentionDays"]}
				rules={[
					{
						required: true,
						type: "integer",
						...limits.retentionDays,
						message: t(
							"adminShell.platformSettings.validation.number",
							limits.retentionDays,
						),
					},
				]}
			>
				<InputNumber
					{...limits.retentionDays}
					suffix={t("adminShell.platformSettings.units.days")}
					style={{ width: "100%" }}
				/>
			</Form.Item>
		</>
	);
}
