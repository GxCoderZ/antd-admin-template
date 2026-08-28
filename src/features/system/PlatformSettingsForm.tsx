import { SaveOutlined } from "@ant-design/icons";
import type { PlatformSettingsValues } from "#src/api/settings";
import { Button, Card, Flex, Form, theme } from "antd";
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
	const items = sections.map(({ key, fields }) => ({
		key,
		label: t(`adminShell.platformSettings.sections.${key}`),
		children: (
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
		),
	}));
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
			<Card
				activeTabKey={selected}
				onTabChange={changeSection}
				tabList={items.map(({ key, label }) => ({ key, label }))}
				tabProps={{
					animated: { inkBar: true, tabPane: false },
					"aria-label": t("adminShell.platformSettings.navigationLabel"),
					size: "medium",
				}}
			>
				{/* Keep every field registered for cross-section validation and saving. */}
				{items.map(({ key, label, children }) => (
					<section aria-label={label} hidden={selected !== key} key={key}>
						{children}
					</section>
				))}
			</Card>
		</Form>
	);
}
