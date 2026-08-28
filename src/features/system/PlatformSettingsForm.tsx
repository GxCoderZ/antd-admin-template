import { SaveOutlined } from "@ant-design/icons";
import type { PlatformSettingsValues } from "#src/api/settings";
import { Button, Card, Flex, Form, Tabs, theme } from "antd";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useSearchParams } from "react-router";

import {
	GeneralSettingsFields,
	NotificationSettingsFields,
	SecuritySettingsFields,
} from "./PlatformSettingsFields";

interface PlatformSettingsFormProps {
	canManage: boolean;
	conflict: boolean;
	initialValues: PlatformSettingsValues;
	onChange: () => void;
	onSave: (values: PlatformSettingsValues) => void;
	saving: boolean;
}

export function PlatformSettingsForm({
	canManage,
	conflict,
	initialValues,
	onChange,
	onSave,
	saving,
}: PlatformSettingsFormProps) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const [searchParams, setSearchParams] = useSearchParams();
	// Remove the preview switch and the rejected layout after the user's comparison.
	const layoutPreview = searchParams.get("layoutPreview") === "integrated";
	const section = searchParams.get("section");
	const selected =
		section === "security" || section === "notifications" ? section : "general";
	const disabled = !canManage || saving;
	const [readingLogo, setReadingLogo] = useState(false);
	const changeSection = (next: string) => {
		setSearchParams(
			(params) => {
				if (next === "general") params.delete("section");
				else params.set("section", next);
				return params;
			},
			{ replace: true },
		);
	};
	const sections = [
		{
			key: "general",
			fields: (
				<GeneralSettingsFields
					disabled={disabled}
					logoLoading={readingLogo}
					onLogoLoading={setReadingLogo}
				/>
			),
		},
		{ key: "security", fields: <SecuritySettingsFields disabled={disabled} /> },
		{
			key: "notifications",
			fields: <NotificationSettingsFields disabled={disabled} />,
		},
	];
	const tabs = (
		<Tabs
			activeKey={selected}
			animated={{ inkBar: true, tabPane: false }}
			aria-label={t("adminShell.platformSettings.navigationLabel")}
			items={sections.map(({ key, fields }) => {
				const content = (
					<Flex style={{ maxWidth: token.screenSM }} vertical>
						{fields}
						{canManage ? (
							<Flex>
								<Button
									disabled={conflict || readingLogo}
									htmlType="submit"
									icon={<SaveOutlined aria-hidden />}
									loading={saving}
									type="primary"
								>
									{t("adminShell.platformSettings.save")}
								</Button>
							</Flex>
						) : null}
					</Flex>
				);
				return {
					key,
					label: t(`adminShell.platformSettings.sections.${key}`),
					forceRender: true,
					children: layoutPreview ? content : <Card>{content}</Card>,
				};
			})}
			onChange={changeSection}
			tabBarStyle={{ marginBottom: token.marginLG }}
		/>
	);
	return (
		<Form<PlatformSettingsValues>
			disabled={disabled}
			initialValues={initialValues}
			layout="vertical"
			name="system-settings"
			onFinish={(values) => {
				if (!readingLogo) onSave(values);
			}}
			onFinishFailed={({ errorFields }) => {
				const firstSection = errorFields[0]?.name[0];
				if (typeof firstSection === "string") changeSection(firstSection);
			}}
			onValuesChange={onChange}
		>
			{layoutPreview ? (
				<Card styles={{ body: { paddingTop: 0 } }}>{tabs}</Card>
			) : (
				tabs
			)}
		</Form>
	);
}
