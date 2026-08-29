import { CheckOutlined, UndoOutlined } from "@ant-design/icons";
import {
	Button,
	Divider,
	Drawer,
	Flex,
	Grid,
	Popconfirm,
	Select,
	Switch,
	theme,
	Tooltip,
	Typography,
} from "antd";
import type { CSSProperties, ReactNode } from "react";
import { useTranslation } from "react-i18next";

import {
	type MenuType,
	type NavigationMode,
	type SupportedLanguageCode,
	supportedTimeZones,
	type ThemeColor,
	themeColorOptions,
	type ThemeMode,
	type TimeZone,
} from "../../app/preferenceStorage";
import { isSupportedLanguageCode, supportedLanguages } from "../../i18n";
import { SettingsPreviewChoices } from "./SettingsPreviewChoices";
import styles from "./SettingsDrawer.module.css";

export interface SettingsDrawerProps {
	isColorBlindMode: boolean;
	isFooterVisible: boolean;
	language: SupportedLanguageCode;
	menuType: MenuType;
	navigationMode: NavigationMode;
	onChangeColorBlindMode: (enabled: boolean) => void;
	onChangeFooterVisibility: (visible: boolean) => void;
	onChangeLanguage: (language: SupportedLanguageCode) => void;
	onChangeMenuType: (menuType: MenuType) => void;
	onChangeNavigationMode: (navigationMode: NavigationMode) => void;
	onChangeThemeColor: (themeColor: ThemeColor) => void;
	onChangeThemeMode: (themeMode: ThemeMode) => void;
	onChangeTimeZone: (timeZone: TimeZone) => void;
	onClose: () => void;
	onResetPreferences: () => Promise<void> | void;
	open: boolean;
	themeColor: ThemeColor;
	themeMode: ThemeMode;
	timeZone: TimeZone;
}

function SettingsSection({
	title,
	children,
}: {
	title: string;
	children: ReactNode;
}) {
	return (
		<section className={styles.section}>
			<h3 className={styles.sectionTitle}>{title}</h3>
			{children}
		</section>
	);
}

function SettingsRow({
	label,
	children,
}: {
	label: string;
	children: ReactNode;
}) {
	return (
		<Flex align="center" className={styles.row} justify="space-between">
			<Typography.Text className={styles.rowLabel}>{label}</Typography.Text>
			{children}
		</Flex>
	);
}

export function SettingsDrawer({
	isColorBlindMode,
	isFooterVisible,
	language,
	menuType,
	navigationMode,
	onChangeColorBlindMode,
	onChangeFooterVisibility,
	onChangeLanguage,
	onChangeMenuType,
	onChangeNavigationMode,
	onChangeThemeColor,
	onChangeThemeMode,
	onChangeTimeZone,
	onClose,
	onResetPreferences,
	open,
	themeColor,
	themeMode,
	timeZone,
}: SettingsDrawerProps) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const screens = Grid.useBreakpoint();
	const contentStyle: CSSProperties &
		Record<`--settings-${string}`, string | number> = {
		"--settings-gap": `${token.marginXS}px`,
		"--settings-section-gap": `${token.marginSM}px`,
		"--settings-font-size": `${token.fontSize}px`,
		"--settings-line-height": token.lineHeight,
		"--settings-primary": token.colorPrimary,
		"--settings-heading": token.colorTextHeading,
	};

	return (
		<Drawer
			footer={
				<Popconfirm
					cancelText={t("preferences.reset.cancel")}
					description={t("preferences.reset.description")}
					okText={t("preferences.reset.confirm")}
					onConfirm={() => {
						void onResetPreferences();
					}}
					title={t("preferences.reset.title")}
				>
					<Button block icon={<UndoOutlined aria-hidden />}>
						{t("preferences.reset.button")}
					</Button>
				</Popconfirm>
			}
			onClose={onClose}
			open={open}
			size={screens.sm ? 300 : "100%"}
			// AntD releases body scroll lock before its leaving panel is removed.
			styles={{ root: { overflow: "hidden" } }}
			title={t("preferences.title")}
		>
			<div className={styles.content} style={contentStyle}>
				<SettingsSection title={t("preferences.appearance.title")}>
					<SettingsPreviewChoices<ThemeMode>
						label={t("preferences.appearance.themeMode")}
						onChange={onChangeThemeMode}
						options={[
							{ value: "light", label: t("theme.light") },
							{ value: "dark", label: t("theme.dark") },
							{ value: "system", label: t("theme.system") },
						]}
						value={themeMode}
					/>
				</SettingsSection>
				<SettingsSection title={t("preferences.themeColor.title")}>
					<Flex className={styles.swatches} gap={token.marginXS} wrap>
						{themeColorOptions.map(({ labelKey, value }) => (
							<Tooltip
								key={value}
								title={t(`preferences.themeColor.${labelKey}`)}
								trigger={["hover", "focus"]}
							>
								<Button
									aria-label={t(`preferences.themeColor.${labelKey}`)}
									aria-pressed={themeColor === value}
									className={styles.swatch}
									icon={
										themeColor === value ? <CheckOutlined aria-hidden /> : null
									}
									onClick={() => onChangeThemeColor(value)}
									style={{ backgroundColor: value, color: token.colorWhite }}
									type="text"
								/>
							</Tooltip>
						))}
					</Flex>
				</SettingsSection>

				<Divider />
				<SettingsSection title={t("preferences.navigation.mode")}>
					<SettingsPreviewChoices<NavigationMode>
						label={t("preferences.navigation.mode")}
						onChange={onChangeNavigationMode}
						options={[
							{ value: "side", label: t("preferences.navigation.side") },
							{ value: "top", label: t("preferences.navigation.top") },
							{ value: "mixed", label: t("preferences.navigation.mixed") },
						]}
						value={navigationMode}
					/>
				</SettingsSection>
				{navigationMode !== "top" ? (
					<SettingsSection title={t("preferences.sidebar.menuType")}>
						<SettingsPreviewChoices<MenuType>
							label={t("preferences.sidebar.menuType")}
							onChange={onChangeMenuType}
							options={[
								{ label: t("preferences.sidebar.singleMenu"), value: "single" },
								{
									label: t("preferences.sidebar.serviceGridMenu"),
									value: "serviceGrid",
								},
								...(navigationMode === "side"
									? [
											{
												label: t("preferences.sidebar.twoColumnMenu"),
												value: "twoColumn" as const,
											},
											{
												label: t("preferences.sidebar.splitServiceGridMenu"),
												value: "splitServiceGrid" as const,
											},
										]
									: []),
							]}
							value={menuType}
						/>
					</SettingsSection>
				) : null}
				<SettingsRow label={t("preferences.content.footer")}>
					<Switch
						aria-label={t("preferences.content.footer")}
						checked={isFooterVisible}
						onChange={onChangeFooterVisibility}
						size="small"
					/>
				</SettingsRow>

				<Divider />
				<SettingsSection title={t("preferences.languageRegion.title")}>
					<SettingsRow
						label={t("preferences.languageRegion.interfaceLanguage")}
					>
						<Select
							aria-label={t("preferences.languageRegion.interfaceLanguage")}
							className={styles.select}
							onChange={(nextLanguage) => {
								if (isSupportedLanguageCode(nextLanguage))
									onChangeLanguage(nextLanguage);
							}}
							options={supportedLanguages.map(({ code, labelKey }) => ({
								label: t(labelKey),
								value: code,
							}))}
							value={language}
						/>
					</SettingsRow>
					<SettingsRow label={t("preferences.languageRegion.timeZone")}>
						<Select
							aria-label={t("preferences.languageRegion.timeZone")}
							className={styles.select}
							onChange={onChangeTimeZone}
							optionFilterProp="label"
							options={supportedTimeZones.map((value) => ({
								label: value,
								value,
							}))}
							showSearch
							value={timeZone}
						/>
					</SettingsRow>
				</SettingsSection>

				<Divider />
				<SettingsSection title={t("preferences.otherSettings")}>
					<SettingsRow label={t("preferences.appearance.colorBlindMode")}>
						<Switch
							aria-label={t("preferences.appearance.colorBlindMode")}
							checked={isColorBlindMode}
							onChange={onChangeColorBlindMode}
							size="small"
						/>
					</SettingsRow>
				</SettingsSection>
			</div>
		</Drawer>
	);
}
