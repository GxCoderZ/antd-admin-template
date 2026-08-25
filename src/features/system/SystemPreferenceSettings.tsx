import {
	BgColorsOutlined,
	CheckOutlined,
	MoonOutlined,
	SunOutlined,
} from "@ant-design/icons";
import {
	Button,
	Divider,
	Flex,
	Form,
	Grid,
	Segmented,
	Select,
	Switch,
	theme,
	Tooltip,
	Typography,
} from "antd";
import { useSyncExternalStore } from "react";
import { useTranslation } from "react-i18next";

import { useLocalePreferences } from "../../app/localePreferences";
import {
	readUserTableDensityPreference,
	subscribeToPreferenceChanges,
	supportedTimeZones,
	type ThemeColor,
	type ThemeMode,
	writeUserTableDensityPreference,
} from "../../app/preferenceStorage";
import { useThemeMode } from "../../app/themeMode";
import { isSupportedLanguageCode, supportedLanguages } from "../../i18n";

const { Text } = Typography;

const themeColors = [
	["#1677ff", "blue"],
	["#f5222d", "red"],
	["#fa8c16", "orange"],
	["#52c41a", "green"],
	["#13c2c2", "cyan"],
	["#722ed1", "purple"],
] as const satisfies readonly (readonly [ThemeColor, string])[];

export function SystemPreferenceSettings() {
	const { t, i18n } = useTranslation();
	const { token } = theme.useToken();
	const screens = Grid.useBreakpoint();
	const {
		isColorBlindMode,
		onChangeColorBlindMode,
		onChangeThemeColor,
		onChangeThemeMode,
		themeColor,
		themeMode,
	} = useThemeMode();
	const { language, onChangeTimeZone, timeZone } = useLocalePreferences();
	const tableDensity = useSyncExternalStore(
		subscribeToPreferenceChanges,
		readUserTableDensityPreference,
		readUserTableDensityPreference,
	);
	const stackSegmentedControls = screens.sm === false;

	return (
		<Form
			component="div"
			layout="vertical"
			style={{ maxWidth: token.screenSM, width: "100%" }}
		>
			<Divider titlePlacement="start">
				{t("preferences.appearance.title")}
			</Divider>
			<Flex gap={token.marginLG} vertical>
				<Form.Item label={t("preferences.appearance.themeMode")}>
					<Segmented
						aria-label={t("preferences.appearance.themeMode")}
						block
						onChange={(nextMode) => onChangeThemeMode(nextMode as ThemeMode)}
						options={[
							{
								icon: <BgColorsOutlined aria-hidden />,
								label: t("theme.system"),
								value: "system",
							},
							{
								icon: <SunOutlined aria-hidden />,
								label: t("theme.light"),
								value: "light",
							},
							{
								icon: <MoonOutlined aria-hidden />,
								label: t("theme.dark"),
								value: "dark",
							},
						]}
						value={themeMode}
						vertical={stackSegmentedControls}
					/>
				</Form.Item>
				<Form.Item label={t("preferences.themeColor.title")}>
					<Flex gap={token.marginSM} wrap>
						{themeColors.map(([color, name]) => {
							const label = t(`preferences.themeColor.${name}`);
							return (
								<Tooltip key={color} title={label}>
									<Button
										aria-label={label}
										icon={
											themeColor === color ? (
												<CheckOutlined aria-hidden />
											) : null
										}
										onClick={() => onChangeThemeColor(color)}
										shape="circle"
										style={{ backgroundColor: color, color: token.colorWhite }}
									/>
								</Tooltip>
							);
						})}
					</Flex>
				</Form.Item>
				<Flex align="center" justify="space-between">
					<Text>{t("preferences.appearance.colorBlindMode")}</Text>
					<Switch
						aria-label={t("preferences.appearance.colorBlindMode")}
						checked={isColorBlindMode}
						onChange={onChangeColorBlindMode}
					/>
				</Flex>
			</Flex>

			<Divider titlePlacement="start">
				{t("preferences.languageRegion.title")}
			</Divider>
			<Flex gap={token.margin} vertical>
				<Form.Item label={t("preferences.languageRegion.interfaceLanguage")}>
					<Select
						aria-label={t("preferences.languageRegion.interfaceLanguage")}
						onChange={(nextLanguage) => {
							if (isSupportedLanguageCode(nextLanguage)) {
								void i18n.changeLanguage(nextLanguage);
							}
						}}
						options={supportedLanguages.map(({ code, labelKey }) => ({
							label: t(labelKey),
							value: code,
						}))}
						style={{ maxWidth: token.controlHeight * 7, width: "100%" }}
						value={language}
					/>
				</Form.Item>
				<Form.Item label={t("preferences.languageRegion.timeZone")}>
					<Select
						aria-label={t("preferences.languageRegion.timeZone")}
						onChange={onChangeTimeZone}
						optionFilterProp="label"
						options={supportedTimeZones.map((value) => ({
							label: value,
							value,
						}))}
						showSearch
						style={{ maxWidth: token.controlHeight * 10, width: "100%" }}
						value={timeZone}
					/>
				</Form.Item>
			</Flex>

			<Divider titlePlacement="start">
				{t("preferences.dataDisplay.title")}
			</Divider>
			<Form.Item label={t("preferences.dataDisplay.tableDensity")}>
				<Segmented
					aria-label={t("preferences.dataDisplay.tableDensity")}
					block
					onChange={writeUserTableDensityPreference}
					options={(["large", "middle", "small"] as const).map((value) => ({
						label: t(`preferences.dataDisplay.densityOptions.${value}`),
						value,
					}))}
					value={tableDensity}
					vertical={stackSegmentedControls}
				/>
			</Form.Item>
		</Form>
	);
}
