import {
	CheckOutlined,
	LogoutOutlined,
	GlobalOutlined,
	MoonOutlined,
	SearchOutlined,
	SettingOutlined,
	SunOutlined,
} from "@ant-design/icons";
import {
	Dropdown,
	Flex,
	Grid,
	message,
	type MenuProps,
	Space,
	theme,
	Tooltip,
} from "antd";
import { type CSSProperties, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import {
	aboutPath,
	adminNavigationGroups,
	adminRouteByPath,
	adminRouteDefinitions,
	dashboardPath,
	type AdminNavigationNode,
} from "../../app/adminRoutes";
import { PlatformUserAvatar } from "../../app/PlatformUserAvatar";
import { usePermissionChecker } from "../../app/permissions";
import type {
	MenuType,
	NavigationMode,
	SupportedLanguageCode,
	ThemeColor,
	ThemeMode,
} from "../../app/preferenceStorage";
import {
	isSupportedLanguageCode,
	loadLanguageResources,
	resolveSupportedLanguage,
	supportedLanguages,
} from "../../i18n";
import { AdminRouteIcon } from "./AdminRouteIcon";
import { CommandPalette } from "./CommandPalette";
import { HeaderIconButton } from "./HeaderIconButton";
import { NotificationPopover } from "./NotificationPopover";
import { SettingsDrawer } from "./SettingsDrawer";

const languageFlags: Record<SupportedLanguageCode, string> = {
	"bn-BD": "\u{1F1E7}\u{1F1E9}",
	"fa-IR": "\u{1F1EE}\u{1F1F7}",
	"id-ID": "\u{1F1EE}\u{1F1E9}",
	"ja-JP": "\u{1F1EF}\u{1F1F5}",
	"pt-BR": "\u{1F1E7}\u{1F1F7}",
	"zh-CN": "\u{1F1E8}\u{1F1F3}",
	"zh-TW": "\u{1F1ED}\u{1F1F0}",
	en: "\u{1F1FA}\u{1F1F8}",
};

function collectNavigationRouteKeys(nodes: readonly AdminNavigationNode[]) {
	return nodes.flatMap((node): string[] => [
		...(node.routeKey ? [node.routeKey] : []),
		...(node.children ? collectNavigationRouteKeys(node.children) : []),
	]);
}

const commandPaletteRouteKeys = new Set([
	dashboardPath,
	aboutPath,
	...adminNavigationGroups.flatMap((group) =>
		collectNavigationRouteKeys(group.nodes),
	),
]);

interface AdminShellHeaderProps {
	currentUserAvatarRevision: number;
	currentUserId: string;
	currentUsername: string;
	isColorBlindMode: boolean;
	isDarkMode: boolean;
	isFooterVisible: boolean;
	menuType: MenuType;
	navigationMode: NavigationMode;
	onChangeColorBlindMode: (enabled: boolean) => void;
	onChangeFooterVisibility: (visible: boolean) => void;
	onChangeMenuType: (menuType: MenuType) => void;
	onChangeNavigationMode: (mode: NavigationMode) => void;
	onChangeThemeColor: (themeColor: ThemeColor) => void;
	onChangeThemeMode: (themeMode: ThemeMode) => void;
	onChangeTimeZone: (timeZone: string) => void;
	onLogout: () => Promise<void>;
	onNavigate: (path: string) => void;
	onResetPreferences: () => Promise<void>;
	themeColor: ThemeColor;
	themeMode: ThemeMode;
	timeZone: string;
}

export function AdminShellHeader({
	currentUserAvatarRevision,
	currentUserId,
	currentUsername,
	isColorBlindMode,
	isDarkMode,
	isFooterVisible,
	menuType,
	navigationMode,
	onChangeColorBlindMode,
	onChangeFooterVisibility,
	onChangeMenuType,
	onChangeNavigationMode,
	onChangeThemeColor,
	onChangeThemeMode,
	onChangeTimeZone,
	onLogout,
	onNavigate,
	onResetPreferences,
	themeColor,
	themeMode,
	timeZone,
}: AdminShellHeaderProps) {
	const { t, i18n } = useTranslation();
	const { token } = theme.useToken();
	const screens = Grid.useBreakpoint();
	const hasPermission = usePermissionChecker();
	const [messageApi, messageContextHolder] = message.useMessage();
	const [preferencesOpen, setPreferencesOpen] = useState(false);
	const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
	const languageChangeId = useRef(0);
	const showAccountName = screens.sm === true;
	// Ported from ant-design/ant-design-pro src/components/RightContent/style.ts.
	// Public Button styles preserve its dimensions without the upstream !important overrides.
	const iconActionStyle: CSSProperties = {
		alignItems: "center",
		borderRadius: token.borderRadius,
		display: "inline-flex",
		flex: "0 0 auto",
		height: 36,
		justifyContent: "center",
		minWidth: 36,
		paddingBlock: 0,
		paddingInline: token.paddingXS,
	};
	const accountActionStyle: CSSProperties = {
		border: 0,
		borderRadius: token.borderRadius,
		color: token.colorTextTertiary,
		flex: "0 0 auto",
		height: 44,
		marginInline: token.padding,
		padding: 8,
	};
	const language = resolveSupportedLanguage(i18n.resolvedLanguage);
	const themeActionLabel = t(isDarkMode ? "theme.lightMode" : "theme.darkMode");
	const changeLanguage: MenuProps["onClick"] = ({ key }) => {
		if (!isSupportedLanguageCode(key)) return;
		const changeId = ++languageChangeId.current;
		if (key === language) return;
		// Prepare resources before committing, so the latest choice wins without blocking the button.
		void loadLanguageResources(key)
			.then(() => {
				if (changeId === languageChangeId.current) {
					return i18n.changeLanguage(key);
				}
			})
			.catch(() => {
				if (changeId === languageChangeId.current) {
					void messageApi.error(t("adminShell.header.languageError"));
				}
			});
	};
	const commandPaletteItems = adminRouteDefinitions
		.filter(
			(route) =>
				commandPaletteRouteKeys.has(route.key) &&
				hasPermission(route.requiredPermission),
		)
		.map((route) => ({
			icon: route.iconKey ? (
				<AdminRouteIcon iconKey={route.iconKey} />
			) : undefined,
			key: route.key,
			label: t(route.titleKey),
			searchTerms: [
				t(route.titleKey),
				i18n.getFixedT("zh-CN")(route.titleKey),
				i18n.getFixedT("en")(route.titleKey),
			],
		}));
	const accountRouteMenuItems: MenuProps["items"] = adminRouteDefinitions
		.filter((route) => route.groupKey === "account")
		.map((route) => ({
			key: route.key,
			icon: route.iconKey ? (
				<AdminRouteIcon iconKey={route.iconKey} />
			) : undefined,
			label: t(route.titleKey),
		}));
	const userMenuItems: MenuProps["items"] = [
		...accountRouteMenuItems,
		{
			key: "preferences",
			icon: <SettingOutlined aria-hidden />,
			label: t("preferences.title"),
		},
		{ type: "divider" },
		{
			key: "logout",
			icon: <LogoutOutlined aria-hidden />,
			label: t("adminShell.header.logout"),
		},
	];
	const handleUserMenuClick: MenuProps["onClick"] = ({ key }) => {
		if (adminRouteByPath.get(key)?.groupKey === "account") {
			onNavigate(key);
			return;
		}
		if (key === "preferences") {
			setPreferencesOpen(true);
			return;
		}

		if (key === "logout") {
			void onLogout().catch(() => {
				void messageApi.error(t("adminShell.header.logoutError"));
			});
		}
	};

	return (
		<>
			{messageContextHolder}
			<Flex align="center" style={{ flex: "0 0 auto", height: "100%" }}>
				<Tooltip title={t("adminShell.header.search")}>
					<HeaderIconButton
						aria-label={t("adminShell.header.search")}
						icon={<SearchOutlined aria-hidden />}
						onClick={() => setCommandPaletteOpen(true)}
						style={iconActionStyle}
						type="text"
					/>
				</Tooltip>
				<Dropdown
					// Corner placement flips by default; the full-width mobile menu also needs shifting.
					align={{ overflow: { shiftX: true } }}
					arrow
					menu={{
						items: supportedLanguages.map(({ code, labelKey }) => ({
							"aria-current": code === language ? "true" : undefined,
							icon:
								code === language ? (
									<CheckOutlined
										aria-hidden
										style={{ color: token.colorSuccess }}
									/>
								) : (
									<span
										aria-hidden
										style={{ display: "inline-block", width: token.fontSize }}
									/>
								),
							key: code,
							label: (
								<>
									<span aria-hidden>{languageFlags[code]}</span> {t(labelKey)}
								</>
							),
						})),
						onClick: changeLanguage,
						selectedKeys: [language],
						// Match Ant Design Pro RightContent/LangDropdown.tsx.
						style: { minWidth: 180 },
					}}
					placement="bottomRight"
					styles={{ root: { width: screens.xs ? "100%" : undefined } }}
				>
					<HeaderIconButton
						aria-label={t("language.label")}
						style={iconActionStyle}
						type="text"
					>
						<GlobalOutlined aria-hidden />
					</HeaderIconButton>
				</Dropdown>
				<Tooltip title={themeActionLabel}>
					<HeaderIconButton
						aria-label={themeActionLabel}
						icon={
							isDarkMode ? (
								<SunOutlined aria-hidden />
							) : (
								<MoonOutlined aria-hidden />
							)
						}
						onClick={() => onChangeThemeMode(isDarkMode ? "light" : "dark")}
						style={iconActionStyle}
						type="text"
					/>
				</Tooltip>
				<NotificationPopover
					onNavigate={onNavigate}
					timeZone={timeZone}
					triggerStyle={iconActionStyle}
				/>
				<Dropdown
					arrow
					menu={{
						items: userMenuItems,
						onClick: handleUserMenuClick,
						selectedKeys: [],
					}}
					placement="bottomRight"
					trigger={["click"]}
				>
					<HeaderIconButton
						aria-label={currentUsername}
						style={accountActionStyle}
						type="text"
					>
						<Space size={token.marginXS}>
							<PlatformUserAvatar
								displayName={currentUsername}
								fallback="icon"
								revision={currentUserAvatarRevision}
								size={28}
								userId={currentUserId}
							/>
							{showAccountName ? <span>{currentUsername}</span> : null}
						</Space>
					</HeaderIconButton>
				</Dropdown>
			</Flex>

			<SettingsDrawer
				isColorBlindMode={isColorBlindMode}
				isFooterVisible={isFooterVisible}
				language={language}
				menuType={menuType}
				navigationMode={navigationMode}
				onChangeColorBlindMode={onChangeColorBlindMode}
				onChangeFooterVisibility={onChangeFooterVisibility}
				onChangeLanguage={(nextLanguage) => {
					void i18n.changeLanguage(nextLanguage);
				}}
				onChangeMenuType={onChangeMenuType}
				onChangeNavigationMode={onChangeNavigationMode}
				onChangeThemeColor={onChangeThemeColor}
				onChangeThemeMode={onChangeThemeMode}
				onChangeTimeZone={onChangeTimeZone}
				onClose={() => setPreferencesOpen(false)}
				onResetPreferences={onResetPreferences}
				open={preferencesOpen}
				themeColor={themeColor}
				themeMode={themeMode}
				timeZone={timeZone}
			/>

			<CommandPalette
				key={currentUserId}
				historyScope={currentUserId}
				items={commandPaletteItems}
				onNavigate={onNavigate}
				onOpenChange={setCommandPaletteOpen}
				open={commandPaletteOpen}
			/>
		</>
	);
}
