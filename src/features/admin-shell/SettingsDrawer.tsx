import {
	BgColorsOutlined,
	CheckOutlined,
	MoonOutlined,
	SunOutlined,
} from "@ant-design/icons";
import {
	Button,
	Divider,
	Drawer,
	Flex,
	Popconfirm,
	Segmented,
	Select,
	Switch,
	theme,
	Typography,
} from "antd";
import type { MouseEvent } from "react";
import { useTranslation } from "react-i18next";

import {
	type MenuType,
	type NavigationMode,
	type SupportedLanguageCode,
	supportedTimeZones,
	type ThemeColor,
	type ThemeMode,
	type TimeZone,
} from "../../app/preferenceStorage";
import { isSupportedLanguageCode, supportedLanguages } from "../../i18n";

const { Text } = Typography;

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
	onChangeThemeMode: (
		themeMode: ThemeMode,
		event?: MouseEvent<HTMLElement>,
	) => void;
	onChangeTimeZone: (timeZone: TimeZone) => void;
	onClose: () => void;
	onResetPreferences: () => Promise<void> | void;
	open: boolean;
	themeColor: ThemeColor;
	themeMode: ThemeMode;
	timeZone: TimeZone;
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
					<Button block>{t("preferences.reset.button")}</Button>
				</Popconfirm>
			}
			onClose={onClose}
			open={open}
			title={t("preferences.title")}
		>
			<Flex gap={token.marginLG} vertical>
				<Divider>{t("preferences.appearance.title")}</Divider>
				<Flex gap={token.marginSM} vertical>
					<Flex gap={token.marginXS} vertical>
						<Text>{t("preferences.appearance.themeMode")}</Text>
						<Segmented
							aria-label={t("preferences.appearance.themeMode")}
							block
							onChange={(nextMode) => onChangeThemeMode(nextMode as ThemeMode)}
							options={[
								{
									value: "system",
									label: t("theme.system"),
									icon: <BgColorsOutlined aria-hidden />,
								},
								{
									value: "light",
									label: t("theme.light"),
									icon: <SunOutlined aria-hidden />,
								},
								{
									value: "dark",
									label: t("theme.dark"),
									icon: <MoonOutlined aria-hidden />,
								},
							]}
							value={themeMode}
						/>
					</Flex>
					<Flex gap={token.marginXS} vertical>
						<Text>{t("preferences.themeColor.title")}</Text>
						<Flex gap={token.marginXS} wrap>
							{(
								[
									["#1677ff", "blue"],
									["#f5222d", "red"],
									["#fa8c16", "orange"],
									["#52c41a", "green"],
									["#13c2c2", "cyan"],
									["#722ed1", "purple"],
								] as const
							).map(([color, key]) => (
								<Button
									aria-label={t(`preferences.themeColor.${key}`)}
									icon={
										themeColor === color ? <CheckOutlined aria-hidden /> : null
									}
									key={key}
									onClick={() => onChangeThemeColor(color)}
									shape="circle"
									style={{ backgroundColor: color, color: token.colorWhite }}
								/>
							))}
						</Flex>
					</Flex>
					<Flex align="center" justify="space-between">
						<Text>{t("preferences.appearance.colorBlindMode")}</Text>
						<Switch
							aria-label={t("preferences.appearance.colorBlindMode")}
							checked={isColorBlindMode}
							onChange={onChangeColorBlindMode}
						/>
					</Flex>
				</Flex>

				<Divider>{t("preferences.navigationLayout.title")}</Divider>
				<Flex gap={token.marginSM} vertical>
					<Flex gap={token.marginXS} vertical>
						<Text>{t("preferences.navigation.mode")}</Text>
						<Segmented
							aria-label={t("preferences.navigation.mode")}
							block
							onChange={(nextMode) =>
								onChangeNavigationMode(nextMode as NavigationMode)
							}
							options={[
								{ value: "side", label: t("preferences.navigation.side") },
								{ value: "top", label: t("preferences.navigation.top") },
								{ value: "mixed", label: t("preferences.navigation.mixed") },
							]}
							size="large"
							value={navigationMode}
						/>
					</Flex>
					{navigationMode !== "top" ? (
						<Flex align="center" justify="space-between">
							<Text>{t("preferences.sidebar.menuType")}</Text>
							<Select<MenuType>
								aria-label={t("preferences.sidebar.menuType")}
								onChange={onChangeMenuType}
								options={[
									{
										label: t("preferences.sidebar.singleMenu"),
										value: "single",
									},
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
								style={{ width: token.controlHeight * 4 }}
								value={menuType}
							/>
						</Flex>
					) : null}
					<Flex align="center" justify="space-between">
						<Text>{t("preferences.content.footer")}</Text>
						<Switch
							aria-label={t("preferences.content.footer")}
							checked={isFooterVisible}
							onChange={onChangeFooterVisibility}
						/>
					</Flex>
				</Flex>

				<Divider>{t("preferences.languageRegion.title")}</Divider>
				<Flex gap={token.marginSM} vertical>
					<Flex align="center" justify="space-between">
						<Text>{t("preferences.languageRegion.interfaceLanguage")}</Text>
						<Select
							aria-label={t("preferences.languageRegion.interfaceLanguage")}
							onChange={(nextLanguage) => {
								if (isSupportedLanguageCode(nextLanguage)) {
									onChangeLanguage(nextLanguage);
								}
							}}
							options={supportedLanguages.map(({ code, labelKey }) => ({
								label: t(labelKey),
								value: code,
							}))}
							style={{ width: token.controlHeight * 4 }}
							value={language}
						/>
					</Flex>
					<Flex align="center" justify="space-between">
						<Text>{t("preferences.languageRegion.timeZone")}</Text>
						<Select
							aria-label={t("preferences.languageRegion.timeZone")}
							onChange={onChangeTimeZone}
							optionFilterProp="label"
							options={supportedTimeZones.map((value) => ({
								label: value,
								value,
							}))}
							showSearch
							style={{ width: token.controlHeight * 6 }}
							value={timeZone}
						/>
					</Flex>
				</Flex>
			</Flex>
		</Drawer>
	);
}
