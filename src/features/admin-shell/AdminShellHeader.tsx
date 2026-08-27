import {
	BgColorsOutlined,
	GlobalOutlined,
	LogoutOutlined,
	MoonOutlined,
	MoreOutlined,
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
} from "antd";
import { type CSSProperties, useState } from "react";
import { useTranslation } from "react-i18next";

import {
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
	ThemeColor,
	ThemeMode,
} from "../../app/preferenceStorage";
import type { ThemeChangeEvent } from "../../app/themeMode";
import {
	isSupportedLanguageCode,
	resolveSupportedLanguage,
	supportedLanguages,
} from "../../i18n";
import { AdminRouteIcon } from "./AdminRouteIcon";
import { CommandPalette } from "./CommandPalette";
import { HeaderIconButton } from "./HeaderIconButton";
import { NotificationPopover } from "./NotificationPopover";
import { SettingsDrawer } from "./SettingsDrawer";

function collectNavigationRouteKeys(nodes: readonly AdminNavigationNode[]) {
	return nodes.flatMap((node): string[] => [
		...(node.routeKey ? [node.routeKey] : []),
		...(node.children ? collectNavigationRouteKeys(node.children) : []),
	]);
}

const commandPaletteRouteKeys = new Set([
	dashboardPath,
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
	onChangeThemeMode: (themeMode: ThemeMode, event?: ThemeChangeEvent) => void;
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
	const hasSidebarBreakpoint = screens.sm === true;
	// Match ProLayout GlobalHeader/ActionsContent and rightContentStyle dimensions.
	const iconActionStyle: CSSProperties = {
		border: 0,
		borderRadius: token.borderRadius,
		color: token.colorTextTertiary,
		flex: "0 0 auto",
		fontSize: 16,
		height: 28,
		marginInline: 2,
		padding: 6,
		width: 28,
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
	const themeIcon =
		themeMode === "system" ? (
			<BgColorsOutlined aria-hidden />
		) : isDarkMode ? (
			<SunOutlined aria-hidden />
		) : (
			<MoonOutlined aria-hidden />
		);
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
	const languageMenuItems: MenuProps["items"] = supportedLanguages.map(
		({ code, labelKey }) => ({
			key: code,
			label: t(labelKey),
		}),
	);
	const themeMenuItems: MenuProps["items"] = [
		{
			key: "system",
			icon: <BgColorsOutlined aria-hidden />,
			label: t("theme.system"),
		},
		{
			key: "light",
			icon: <SunOutlined aria-hidden />,
			label: t("theme.light"),
		},
		{
			key: "dark",
			icon: <MoonOutlined aria-hidden />,
			label: t("theme.dark"),
		},
	];
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
		{ type: "divider" },
		{
			key: "logout",
			icon: <LogoutOutlined aria-hidden />,
			label: t("adminShell.header.logout"),
		},
	];
	const compactHeaderMenuItems: MenuProps["items"] = [
		{
			key: "search",
			icon: <SearchOutlined aria-hidden />,
			label: t("adminShell.header.search"),
		},
		{
			key: "language",
			icon: <GlobalOutlined aria-hidden />,
			label: t("adminShell.header.language"),
			children: languageMenuItems,
		},
		{
			key: "theme",
			icon: themeIcon,
			label: t("theme.label"),
			children: themeMenuItems,
		},
		{
			key: "settings",
			icon: <SettingOutlined aria-hidden />,
			label: t("adminShell.header.settings"),
		},
	];
	const changeThemeFromMenu = (key: string, event?: ThemeChangeEvent) => {
		if (key === "light" || key === "dark" || key === "system") {
			onChangeThemeMode(key, event);
		}
	};
	const handleUserMenuClick: MenuProps["onClick"] = ({ key }) => {
		if (adminRouteByPath.get(key)?.groupKey === "account") {
			onNavigate(key);
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
				{hasSidebarBreakpoint ? (
					<>
						<HeaderIconButton
							aria-label={t("adminShell.header.search")}
							icon={<SearchOutlined aria-hidden />}
							onClick={() => setCommandPaletteOpen(true)}
							style={iconActionStyle}
							type="text"
						/>
						<Dropdown
							menu={{
								items: languageMenuItems,
								onClick: ({ key }) => void i18n.changeLanguage(key),
								selectedKeys: [language],
							}}
							trigger={["click"]}
						>
							<HeaderIconButton
								aria-label={t("adminShell.header.language")}
								icon={<GlobalOutlined aria-hidden />}
								style={iconActionStyle}
								type="text"
							/>
						</Dropdown>
						<Dropdown
							menu={{
								items: themeMenuItems,
								onClick: ({ domEvent, key }) =>
									changeThemeFromMenu(String(key), domEvent),
								selectedKeys: [themeMode],
							}}
							trigger={["click"]}
						>
							<HeaderIconButton
								aria-label={t("theme.label")}
								icon={themeIcon}
								style={iconActionStyle}
								type="text"
							/>
						</Dropdown>
						<HeaderIconButton
							aria-label={t("adminShell.header.settings")}
							icon={<SettingOutlined aria-hidden />}
							onClick={() => setPreferencesOpen(true)}
							style={iconActionStyle}
							type="text"
						/>
					</>
				) : (
					<Dropdown
						menu={{
							items: compactHeaderMenuItems,
							onClick: ({ domEvent, key }) => {
								if (key === "search") {
									setCommandPaletteOpen(true);
								}
								if (isSupportedLanguageCode(key)) {
									void i18n.changeLanguage(key);
								}
								changeThemeFromMenu(String(key), domEvent);
								if (key === "settings") {
									setPreferencesOpen(true);
								}
							},
							selectedKeys: [language, themeMode],
						}}
						trigger={["click"]}
					>
						<HeaderIconButton
							aria-label={t("adminShell.header.more")}
							icon={<MoreOutlined aria-hidden />}
							style={iconActionStyle}
							type="text"
						/>
					</Dropdown>
				)}
				<NotificationPopover
					onNavigate={onNavigate}
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
					trigger={["hover", "click"]}
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
							{hasSidebarBreakpoint ? <span>{currentUsername}</span> : null}
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
				items={commandPaletteItems}
				onNavigate={onNavigate}
				onOpenChange={setCommandPaletteOpen}
				open={commandPaletteOpen}
			/>
		</>
	);
}
