import {
	AntDesignOutlined,
	AuditOutlined,
	BgColorsOutlined,
	ControlOutlined,
	DashboardOutlined,
	FileTextOutlined,
	FullscreenOutlined,
	GlobalOutlined,
	InfoCircleOutlined,
	LogoutOutlined,
	MenuFoldOutlined,
	MenuUnfoldOutlined,
	MoonOutlined,
	MoreOutlined,
	ProfileOutlined,
	ReloadOutlined,
	SearchOutlined,
	SettingOutlined,
	SunOutlined,
	UserOutlined,
	UserSwitchOutlined,
} from "@ant-design/icons";
import {
	Breadcrumb,
	Button,
	Drawer,
	Dropdown,
	Flex,
	Grid,
	Layout,
	Menu,
	type MenuProps,
	Space,
	Tabs,
	theme,
	Typography,
} from "antd";
import type { MouseEvent, ReactNode, SetStateAction } from "react";
import { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
	Link as RouterLink,
	Outlet,
	useLocation,
	useNavigate,
	useNavigation,
} from "react-router";

import { RouteContentSkeleton } from "../../app/LoadingSkeletons";
import {
	adminNavigationGroupByKey,
	adminNavigationGroups,
	adminRouteByPath,
	adminRouteDefinitions,
	adminSidebarGroupKeys,
	dashboardPath,
	getAdminRouteMetadata,
	getAdminRouteOpenKeys,
	type AdminGroupIconKey,
	type AdminNavigationNode,
	type AdminRouteIconKey,
} from "../../app/adminRoutes";
import { useLocalePreferences } from "../../app/localePreferences";
import { usePlatformSiteTitle } from "../../app/usePlatformSiteTitle";
import {
	clearStoredPreferences,
	defaultPreferences,
	readFooterVisiblePreference,
	readMenuTypePreference,
	readNavigationModePreference,
	type MenuType,
	type NavigationMode,
	type ThemeColor,
	type ThemeMode,
	writeMenuTypePreference,
	writeFooterVisiblePreference,
	writeNavigationModePreference,
} from "../../app/preferenceStorage";
import {
	isSupportedLanguageCode,
	resolveInitialLanguage,
	resolveSupportedLanguage,
	supportedLanguages,
} from "../../i18n";
import { PermissionBoundary } from "../../app/PermissionProvider";
import { PlatformUserAvatar } from "../../app/PlatformUserAvatar";
import { usePermissionChecker } from "../../app/permissions";
import { SettingsDrawer } from "./SettingsDrawer";
import { CommandPalette } from "./CommandPalette";
import { TwoColumnServiceMenu } from "./TwoColumnServiceMenu";

const { Content, Footer, Header, Sider } = Layout;
const { Text } = Typography;
const sidebarRootKeys: readonly string[] = adminSidebarGroupKeys;

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

interface AdminShellPageProps {
	currentUserAvatarRevision: number;
	currentUserId: string;
	currentUsername: string;
	isColorBlindMode: boolean;
	isDarkMode: boolean;
	onChangeColorBlindMode: (enabled: boolean) => void;
	onChangeThemeColor: (nextThemeColor: ThemeColor) => void;
	onChangeThemeMode: (
		nextMode: ThemeMode,
		event?: MouseEvent<HTMLElement>,
	) => void;
	onLogout: () => Promise<void>;
	themeColor: ThemeColor;
	themeMode: ThemeMode;
}

interface DesktopMenuState {
	contextKey: string;
	openKeys: string[];
}

interface OpenTabsState {
	routeKey: string;
	tabKeys: string[];
}

export function AdminShellPage({
	currentUserAvatarRevision,
	currentUserId,
	currentUsername,
	isColorBlindMode,
	isDarkMode,
	onChangeColorBlindMode,
	onChangeThemeColor,
	onChangeThemeMode,
	onLogout,
	themeColor,
	themeMode,
}: AdminShellPageProps) {
	const tabWorkspaceRef = useRef<HTMLDivElement>(null);
	const { t, i18n } = useTranslation();
	const { token } = theme.useToken();
	const siteTitle = usePlatformSiteTitle();
	const screens = Grid.useBreakpoint();
	const location = useLocation();
	const navigate = useNavigate();
	const navigation = useNavigation();
	const hasPermission = usePermissionChecker();
	const [collapsed, setCollapsed] = useState(false);
	const [compactSidebarExpanded, setCompactSidebarExpanded] = useState(false);
	const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);
	const [mobileOpenKeys, setMobileOpenKeys] = useState<string[]>([]);
	const [isFooterVisible, setFooterVisible] = useState(
		readFooterVisiblePreference,
	);
	const [navigationMode, setNavigationMode] = useState<NavigationMode>(
		readNavigationModePreference,
	);
	const [menuType, setMenuType] = useState<MenuType>(readMenuTypePreference);
	const [preferencesOpen, setPreferencesOpen] = useState(false);
	const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
	const language = resolveSupportedLanguage(i18n.resolvedLanguage);
	const { onChangeCurrency, onChangeTimeZone, timeZone } =
		useLocalePreferences();
	const shellHeaderHeight = token.controlHeightLG + token.margin;
	const shellTabsHeight = token.controlHeight + token.marginXS;
	const collapsedSidebarWidth = token.controlHeightLG * 2;
	const sidebarWidth = token.controlHeightLG + token.paddingLG * 8;
	const currentPage = getAdminRouteMetadata(location.pathname);
	const hasSidebarBreakpoint = screens.sm === true;
	const isDesktopNavigation = screens.lg === true;
	const showTopNavigation = isDesktopNavigation && navigationMode !== "side";
	const showMixedSidebar =
		isDesktopNavigation &&
		navigationMode === "mixed" &&
		adminNavigationGroupByKey.has(currentPage.groupKey);
	const showSidebarNavigation =
		hasSidebarBreakpoint &&
		(!isDesktopNavigation || navigationMode === "side" || showMixedSidebar);
	const showMobileNavigation = !hasSidebarBreakpoint;
	const showExpandedNavigation = isDesktopNavigation && showSidebarNavigation;
	const isCompactSidebarNavigation =
		showSidebarNavigation && !showExpandedNavigation;
	const isSidebarCollapsed = isCompactSidebarNavigation
		? !compactSidebarExpanded
		: collapsed;
	const isSplitMenuActive =
		isDesktopNavigation &&
		navigationMode === "side" &&
		(menuType === "twoColumn" || menuType === "splitServiceGrid");
	const isSplitServiceGridActive =
		isSplitMenuActive && menuType === "splitServiceGrid";
	const isServiceGridMenuActive =
		isDesktopNavigation &&
		navigationMode !== "top" &&
		menuType === "serviceGrid";
	const showSplitSidebar = isSplitMenuActive && !isSidebarCollapsed;
	const showServiceGridSidebar = isServiceGridMenuActive && !isSidebarCollapsed;
	const activeSidebarOpenKeys = useMemo(
		() => getAdminRouteOpenKeys(currentPage),
		[currentPage],
	);
	const desktopMenuContextKey = `${currentPage.key}:${isSidebarCollapsed ? "collapsed" : "expanded"}`;
	const defaultDesktopOpenKeys = isSidebarCollapsed
		? []
		: activeSidebarOpenKeys;
	const [desktopMenuState, setDesktopMenuState] = useState<DesktopMenuState>(
		() => ({
			contextKey: desktopMenuContextKey,
			openKeys: defaultDesktopOpenKeys,
		}),
	);
	let desktopOpenKeys = desktopMenuState.openKeys;
	if (desktopMenuState.contextKey !== desktopMenuContextKey) {
		desktopOpenKeys = defaultDesktopOpenKeys;
		setDesktopMenuState({
			contextKey: desktopMenuContextKey,
			openKeys: defaultDesktopOpenKeys,
		});
	}
	const setDesktopOpenKeys = (nextOpenKeys: string[]) => {
		setDesktopMenuState({
			contextKey: desktopMenuContextKey,
			openKeys: nextOpenKeys,
		});
	};
	const [openTabsState, setOpenTabsState] = useState<OpenTabsState>(() => ({
		routeKey: currentPage.key,
		tabKeys:
			currentPage.key === dashboardPath
				? [dashboardPath]
				: [dashboardPath, currentPage.key],
	}));
	let openTabKeys = openTabsState.tabKeys;
	if (openTabsState.routeKey !== currentPage.key) {
		openTabKeys = openTabsState.tabKeys.includes(currentPage.key)
			? openTabsState.tabKeys
			: [...openTabsState.tabKeys, currentPage.key];
		setOpenTabsState({ routeKey: currentPage.key, tabKeys: openTabKeys });
	}
	const setOpenTabKeys = (nextTabKeys: SetStateAction<string[]>) => {
		setOpenTabsState((currentState) => {
			const currentTabKeys =
				currentState.routeKey === currentPage.key
					? currentState.tabKeys
					: currentState.tabKeys.includes(currentPage.key)
						? currentState.tabKeys
						: [...currentState.tabKeys, currentPage.key];

			return {
				routeKey: currentPage.key,
				tabKeys:
					typeof nextTabKeys === "function"
						? nextTabKeys(currentTabKeys)
						: nextTabKeys,
			};
		});
	};
	const themeIcon =
		themeMode === "system" ? (
			<BgColorsOutlined aria-hidden />
		) : isDarkMode ? (
			<SunOutlined aria-hidden />
		) : (
			<MoonOutlined aria-hidden />
		);
	const currentTabIndex = openTabKeys.indexOf(currentPage.key);
	const hasClosableCurrentTab = currentPage.key !== dashboardPath;
	const hasClosableLeftTabs = openTabKeys
		.slice(0, Math.max(currentTabIndex, 0))
		.some((tabKey) => tabKey !== dashboardPath);
	const hasClosableRightTabs = openTabKeys
		.slice(currentTabIndex + 1)
		.some((tabKey) => tabKey !== dashboardPath);
	const hasClosableOtherTabs = openTabKeys.some(
		(tabKey) => tabKey !== dashboardPath && tabKey !== currentPage.key,
	);
	const hasClosableTabs = openTabKeys.some(
		(tabKey) => tabKey !== dashboardPath,
	);
	const closeTab = (targetKey: string) => {
		if (targetKey === dashboardPath) {
			return;
		}

		const targetIndex = openTabKeys.indexOf(targetKey);
		const nextTabKeys = openTabKeys.filter((tabKey) => tabKey !== targetKey);
		setOpenTabKeys(nextTabKeys.length > 0 ? nextTabKeys : [dashboardPath]);

		if (targetKey === currentPage.key) {
			void navigate(
				nextTabKeys[targetIndex - 1] ??
					nextTabKeys[targetIndex] ??
					dashboardPath,
			);
		}
	};

	const openRouteTab = (nextPath: string) => {
		const nextPage = adminRouteByPath.get(nextPath);

		if (!nextPage) {
			return;
		}

		setOpenTabKeys((existingTabKeys) =>
			existingTabKeys.includes(nextPage.key)
				? existingTabKeys
				: [...existingTabKeys, nextPage.key],
		);
		void navigate(nextPage.key);
	};

	const openMobileRouteTab = (nextPath: string) => {
		openRouteTab(nextPath);
		setMobileNavigationOpen(false);
	};
	const openMobileNavigation = () => {
		setMobileOpenKeys(activeSidebarOpenKeys);
		setMobileNavigationOpen(true);
	};

	const reloadCurrentTab = () => {
		void navigate(currentPage.key, { replace: true });
	};

	const toggleFullscreen = () => {
		if (document.fullscreenElement) {
			void document.exitFullscreen?.();
			return;
		}

		void tabWorkspaceRef.current?.requestFullscreen?.();
	};

	const closeLeftTabs = () => {
		setOpenTabKeys((existingTabKeys) =>
			existingTabKeys.filter(
				(tabKey, tabIndex) =>
					tabKey === dashboardPath || tabIndex >= currentTabIndex,
			),
		);
	};

	const closeRightTabs = () => {
		setOpenTabKeys((existingTabKeys) =>
			existingTabKeys.filter(
				(tabKey, tabIndex) =>
					tabKey === dashboardPath || tabIndex <= currentTabIndex,
			),
		);
	};

	const closeOtherTabs = () => {
		setOpenTabKeys(
			currentPage.key === dashboardPath
				? [dashboardPath]
				: [dashboardPath, currentPage.key],
		);
	};

	const closeAllTabs = () => {
		setOpenTabKeys([dashboardPath]);
		if (currentPage.key !== dashboardPath) {
			void navigate(dashboardPath);
		}
	};

	const openTabs = openTabKeys.map((tabKey) => {
		const tabPage =
			adminRouteByPath.get(tabKey) ?? getAdminRouteMetadata(dashboardPath);

		return {
			key: tabPage.key,
			label: t(tabPage.titleKey),
			closable: tabPage.key !== dashboardPath,
		};
	});
	const breadcrumbItems = [
		...(currentPage.groupKey === "dashboard"
			? []
			: [{ title: t(currentPage.sectionKey) }]),
		{ title: t(currentPage.titleKey) },
	];
	const routeIconByKey: Record<AdminRouteIconKey, ReactNode> = {
		dashboard: <DashboardOutlined aria-hidden />,
		users: <UserOutlined aria-hidden />,
		roles: <UserSwitchOutlined aria-hidden />,
		auditLogs: <AuditOutlined aria-hidden />,
		loginLogs: <FileTextOutlined aria-hidden />,
		settings: <ControlOutlined aria-hidden />,
		about: <InfoCircleOutlined aria-hidden />,
	};
	const groupIconByKey: Record<AdminGroupIconKey, ReactNode> = {
		operations: <ProfileOutlined aria-hidden />,
		system: <SettingOutlined aria-hidden />,
	};
	const commandPaletteItems = adminRouteDefinitions
		.filter(
			(route) =>
				commandPaletteRouteKeys.has(route.key) &&
				hasPermission(route.requiredPermission),
		)
		.map((route) => ({
			icon: route.iconKey ? routeIconByKey[route.iconKey] : undefined,
			key: route.key,
			label: t(route.titleKey),
			searchTerms: [
				t(route.titleKey),
				i18n.getFixedT("zh-CN")(route.titleKey),
				i18n.getFixedT("en")(route.titleKey),
			],
		}));
	const createNavigationItems = (
		nodes: readonly AdminNavigationNode[],
	): NonNullable<MenuProps["items"]> => {
		const items: NonNullable<MenuProps["items"]> = [];

		nodes.forEach((node) => {
			if (node.routeKey) {
				const route = adminRouteByPath.get(node.routeKey);

				if (route && hasPermission(route.requiredPermission)) {
					items.push({
						key: route.key,
						icon: route.iconKey ? routeIconByKey[route.iconKey] : undefined,
						label: t(route.titleKey),
					});
				}
				return;
			}

			if (!node.key || !node.titleKey) {
				return;
			}

			items.push({
				key: node.key,
				label: t(node.titleKey),
				children: node.children
					? createNavigationItems(node.children)
					: undefined,
			});
		});

		return items;
	};
	const dashboardRoute = getAdminRouteMetadata(dashboardPath);
	const dashboardNavigationItem = {
		key: dashboardRoute.key,
		icon: routeIconByKey.dashboard,
		label: t(dashboardRoute.titleKey),
	};
	const navigationItemsByGroup = new Map(
		adminNavigationGroups.map((group) => [
			group.key,
			createNavigationItems(group.nodes),
		]),
	);
	const visibleNavigationGroups = adminNavigationGroups.filter(
		(group) => (navigationItemsByGroup.get(group.key)?.length ?? 0) > 0,
	);
	const navigationItems: MenuProps["items"] = [
		dashboardNavigationItem,
		...visibleNavigationGroups.map((group) => ({
			key: group.key,
			icon: groupIconByKey[group.iconKey],
			label: t(group.titleKey),
			children: navigationItemsByGroup.get(group.key),
		})),
	];
	const topLevelNavigationItems: MenuProps["items"] = [
		{
			...dashboardNavigationItem,
			key: "dashboard",
		},
		...visibleNavigationGroups.map((group) => ({
			key: group.key,
			icon: groupIconByKey[group.iconKey],
			label: t(group.titleKey),
		})),
	];
	const mixedSidebarItemsByGroup = new Map<string, MenuProps["items"]>([
		["dashboard", [dashboardNavigationItem]],
		...visibleNavigationGroups.map(
			(group) => [group.key, navigationItemsByGroup.get(group.key)] as const,
		),
	]);
	const sidebarNavigationItems =
		isDesktopNavigation && navigationMode === "mixed"
			? (mixedSidebarItemsByGroup.get(currentPage.groupKey) ?? [])
			: navigationItems;
	const topNavigationItems =
		navigationMode === "mixed" ? topLevelNavigationItems : navigationItems;
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
			icon: route.iconKey ? routeIconByKey[route.iconKey] : undefined,
			label: t(route.titleKey),
		}));
	const userMenuItems: MenuProps["items"] = [
		...accountRouteMenuItems,
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
	const changeThemeFromMenu = (
		key: string,
		event: MouseEvent<HTMLElement> | undefined,
	) => {
		if (key === "light" || key === "dark" || key === "system") {
			onChangeThemeMode(key, event);
		}
	};
	const changeMenuType = (nextMenuType: MenuType) => {
		writeMenuTypePreference(nextMenuType);
		setMenuType(nextMenuType);
	};
	const changeFooterVisibility = (visible: boolean) => {
		writeFooterVisiblePreference(visible);
		setFooterVisible(visible);
	};
	const changeNavigationMode = (nextMode: NavigationMode) => {
		if (
			nextMode === "mixed" &&
			(menuType === "twoColumn" || menuType === "splitServiceGrid")
		) {
			changeMenuType(
				menuType === "splitServiceGrid" ? "serviceGrid" : "single",
			);
		}
		writeNavigationModePreference(nextMode);
		setNavigationMode(nextMode);
	};
	const resetPreferences = async () => {
		changeFooterVisibility(defaultPreferences.footerVisible);
		changeNavigationMode(defaultPreferences.navigationMode);
		changeMenuType(defaultPreferences.menuType);
		onChangeColorBlindMode(defaultPreferences.colorBlindMode);
		onChangeThemeColor(defaultPreferences.themeColor);
		onChangeThemeMode(defaultPreferences.themeMode);
		onChangeCurrency(defaultPreferences.currency);
		onChangeTimeZone(defaultPreferences.timeZone);
		await i18n.changeLanguage(resolveInitialLanguage(null));
		clearStoredPreferences();
	};
	const handleUserMenuClick: MenuProps["onClick"] = ({ key }) => {
		if (adminRouteByPath.get(key)?.groupKey === "account") {
			openRouteTab(key);
			return;
		}

		if (key === "logout") {
			void onLogout().catch(() => undefined);
		}
	};
	const openNavigationGroup = (groupKey: string) => {
		const nextPath =
			groupKey === "dashboard"
				? dashboardPath
				: adminNavigationGroups.find((group) => group.key === groupKey)
						?.defaultRouteKey;

		if (nextPath) {
			openRouteTab(nextPath);
		}
	};
	const handleTopNavigationClick: MenuProps["onClick"] = ({ key }) => {
		if (navigationMode === "mixed") {
			openNavigationGroup(key);
			return;
		}

		openRouteTab(String(key));
	};
	const handleDesktopOpenChange: MenuProps["onOpenChange"] = (nextOpenKeys) => {
		const newlyOpenedRootKey = nextOpenKeys.find(
			(key) => sidebarRootKeys.includes(key) && !desktopOpenKeys.includes(key),
		);
		if (newlyOpenedRootKey) {
			setDesktopOpenKeys([newlyOpenedRootKey]);
			return;
		}

		const openRootKey = nextOpenKeys.find((key) =>
			sidebarRootKeys.includes(key),
		);
		setDesktopOpenKeys(
			openRootKey
				? nextOpenKeys.filter(
						(key) => key === openRootKey || !sidebarRootKeys.includes(key),
					)
				: [],
		);
	};
	const toggleSidebar = () => {
		if (isCompactSidebarNavigation) {
			setCompactSidebarExpanded((nextExpanded) => !nextExpanded);
			return;
		}

		setCollapsed((nextCollapsed) => !nextCollapsed);
	};
	const twoColumnSecondaryItems =
		mixedSidebarItemsByGroup.get(currentPage.groupKey) ?? [];
	const splitSecondaryMenuProps = {
		items: twoColumnSecondaryItems,
		onClick: ({ key }) => openRouteTab(String(key)),
		onOpenChange: (nextOpenKeys) =>
			setDesktopOpenKeys([currentPage.groupKey, ...nextOpenKeys]),
		openKeys: desktopOpenKeys.filter(
			(openKey) => openKey !== currentPage.groupKey,
		),
		selectedKeys: [currentPage.key],
	} satisfies Pick<
		MenuProps,
		"items" | "onClick" | "onOpenChange" | "openKeys" | "selectedKeys"
	>;
	const twoColumnTitleKey =
		currentPage.groupKey === "dashboard"
			? currentPage.titleKey
			: currentPage.sectionKey;
	const renderSidebarLogo = (compact: boolean) => (
		<RouterLink
			aria-label={t(dashboardRoute.titleKey)}
			style={{
				color: "inherit",
				display: "block",
				textDecoration: "none",
				width: "100%",
			}}
			to={dashboardPath}
		>
			<Flex
				align="center"
				data-testid="admin-shell-sidebar-logo"
				gap={token.marginXS}
				justify={compact ? "center" : "flex-start"}
				style={{
					height: shellHeaderHeight,
					overflow: "hidden",
					paddingInline: compact ? token.paddingSM : token.paddingLG,
				}}
			>
				<AntDesignOutlined
					aria-hidden
					style={{
						color: token.colorPrimary,
						flex: "0 0 auto",
						fontSize: token.controlHeight,
					}}
				/>
				{compact ? null : (
					<Text
						strong
						style={{
							lineHeight: `${token.controlHeight}px`,
							whiteSpace: "nowrap",
						}}
					>
						{siteTitle}
					</Text>
				)}
			</Flex>
		</RouterLink>
	);

	return (
		<Layout
			style={{
				height: "100dvh",
				minHeight: 0,
				minWidth: 0,
				overflow: "hidden",
				width: "100%",
			}}
		>
			{showSidebarNavigation ? (
				<Sider
					collapsed={isSidebarCollapsed}
					collapsedWidth={collapsedSidebarWidth}
					collapsible
					breakpoint="lg"
					style={{
						background: token.colorBgContainer,
						borderInlineEnd: `${token.lineWidth}px ${token.lineType} ${token.colorBorderSecondary}`,
					}}
					theme="light"
					trigger={null}
					width={
						isSplitMenuActive
							? sidebarWidth + collapsedSidebarWidth
							: sidebarWidth
					}
				>
					{showSplitSidebar ? (
						<Flex
							data-testid="admin-shell-two-column-sidebar"
							style={{ height: "100%" }}
						>
							<Flex
								style={{
									borderInlineEnd: `${token.lineWidth}px ${token.lineType} ${token.colorBorderSecondary}`,
									flex: `0 0 ${collapsedSidebarWidth}px`,
								}}
								vertical
							>
								{renderSidebarLogo(true)}
								<Menu
									inlineCollapsed
									items={topLevelNavigationItems}
									mode="inline"
									onClick={({ key }) => openNavigationGroup(key)}
									selectedKeys={[currentPage.groupKey]}
									style={{
										background: token.colorBgContainer,
										borderInlineEnd: 0,
									}}
								/>
							</Flex>
							<Flex
								style={{ flex: `0 0 ${sidebarWidth}px`, minWidth: 0 }}
								vertical
							>
								<Flex
									align="center"
									style={{
										height: shellHeaderHeight,
										paddingInline: token.paddingLG,
									}}
								>
									<Text ellipsis strong>
										{t(twoColumnTitleKey)}
									</Text>
								</Flex>
								{isSplitServiceGridActive ? (
									<TwoColumnServiceMenu {...splitSecondaryMenuProps} rootGrid />
								) : (
									<Menu
										{...splitSecondaryMenuProps}
										mode="inline"
										style={{
											background: token.colorBgContainer,
											borderInlineEnd: 0,
										}}
									/>
								)}
							</Flex>
						</Flex>
					) : showServiceGridSidebar ? (
						<>
							{renderSidebarLogo(false)}
							<TwoColumnServiceMenu
								items={sidebarNavigationItems}
								onClick={({ key }) => openRouteTab(String(key))}
								onOpenChange={handleDesktopOpenChange}
								openKeys={desktopOpenKeys}
								rootGrid={navigationMode === "mixed"}
								selectedKeys={[currentPage.key]}
							/>
						</>
					) : (
						<>
							{renderSidebarLogo(isSidebarCollapsed)}
							<Menu
								{...(isSidebarCollapsed
									? { defaultOpenKeys: [] as string[] }
									: {
											onOpenChange: handleDesktopOpenChange,
											openKeys: desktopOpenKeys,
										})}
								inlineCollapsed={isSidebarCollapsed}
								items={sidebarNavigationItems}
								key={
									isSidebarCollapsed ? "collapsed-sidebar" : "expanded-sidebar"
								}
								mode="inline"
								onClick={({ key }) => openRouteTab(String(key))}
								selectedKeys={[currentPage.key]}
								style={{
									background: token.colorBgContainer,
									borderInlineEnd: 0,
								}}
							/>
						</>
					)}
				</Sider>
			) : null}

			<Layout
				style={{
					height: "100%",
					minHeight: 0,
					minWidth: 0,
					overflow: "hidden",
					width: "100%",
				}}
			>
				<Header
					style={{
						alignItems: "center",
						background: token.colorBgContainer,
						borderBottom: `${token.lineWidth}px ${token.lineType} ${token.colorBorderSecondary}`,
						display: "flex",
						gap: token.marginXS,
						height: shellHeaderHeight,
						justifyContent: "space-between",
						lineHeight: `${shellHeaderHeight}px`,
						minWidth: 0,
						overflow: "hidden",
						paddingInline: token.padding,
						width: "100%",
					}}
				>
					<Flex
						align="center"
						gap={token.marginXS}
						style={{ flex: "1 1 auto", minWidth: 0, overflow: "hidden" }}
					>
						{showMobileNavigation ? (
							<Button
								aria-label={t("adminShell.navigation.openMobile")}
								icon={<MenuUnfoldOutlined aria-hidden />}
								onClick={openMobileNavigation}
								type="text"
							/>
						) : null}
						{showSidebarNavigation ? (
							<Button
								aria-label={
									isSidebarCollapsed
										? t("adminShell.navigation.expand")
										: t("adminShell.navigation.collapse")
								}
								data-testid="admin-shell-sidebar-toggle"
								icon={
									isSidebarCollapsed ? (
										<MenuUnfoldOutlined aria-hidden />
									) : (
										<MenuFoldOutlined aria-hidden />
									)
								}
								onClick={toggleSidebar}
								style={{
									borderRadius: token.borderRadius,
									flex: "0 0 auto",
									height: token.controlHeight,
									width: token.controlHeight,
								}}
								type="text"
							/>
						) : null}
						{showSidebarNavigation ? (
							<Breadcrumb
								items={breadcrumbItems}
								style={{
									flex: "0 1 auto",
									minWidth: 0,
									overflow: "hidden",
									whiteSpace: "nowrap",
								}}
							/>
						) : null}
						{showTopNavigation && !showSidebarNavigation ? (
							<RouterLink
								aria-label={t(dashboardRoute.titleKey)}
								style={{
									color: "inherit",
									flex: "0 0 auto",
									textDecoration: "none",
								}}
								to={dashboardPath}
							>
								<Flex align="center" gap={token.marginXS}>
									<AntDesignOutlined
										aria-hidden
										style={{
											color: token.colorPrimary,
											fontSize: token.controlHeight,
										}}
									/>
									<Text strong style={{ whiteSpace: "nowrap" }}>
										{siteTitle}
									</Text>
								</Flex>
							</RouterLink>
						) : null}
						{showTopNavigation ? (
							<Menu
								data-testid="admin-shell-top-navigation"
								items={topNavigationItems}
								mode="horizontal"
								onClick={handleTopNavigationClick}
								selectedKeys={
									navigationMode === "mixed"
										? [currentPage.groupKey]
										: [currentPage.key, currentPage.groupKey]
								}
								style={{
									background: token.colorBgContainer,
									borderBottom: 0,
									flex: "1 1 auto",
									minWidth: 0,
								}}
							/>
						) : null}
						{showMobileNavigation ? (
							<Text
								data-testid="admin-shell-mobile-title"
								ellipsis
								strong
								style={{ maxWidth: "100%", minWidth: 0, whiteSpace: "nowrap" }}
							>
								{t(currentPage.titleKey)}
							</Text>
						) : null}
					</Flex>
					<Space
						size={hasSidebarBreakpoint ? token.marginXS : 0}
						style={{ flex: "0 0 auto" }}
					>
						{hasSidebarBreakpoint ? (
							<>
								<Button
									aria-label={t("adminShell.header.search")}
									icon={<SearchOutlined aria-hidden />}
									onClick={() => setCommandPaletteOpen(true)}
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
									<Button
										aria-label={t("adminShell.header.language")}
										icon={<GlobalOutlined aria-hidden />}
										type="text"
									/>
								</Dropdown>
								<Dropdown
									menu={{
										items: themeMenuItems,
										onClick: ({ domEvent, key }) =>
											changeThemeFromMenu(
												String(key),
												domEvent as unknown as MouseEvent<HTMLElement>,
											),
										selectedKeys: [themeMode],
									}}
									trigger={["click"]}
								>
									<Button
										aria-label={t("theme.label")}
										icon={themeIcon}
										type="text"
									/>
								</Dropdown>
								<Button
									aria-label={t("adminShell.header.settings")}
									icon={<SettingOutlined aria-hidden />}
									onClick={() => setPreferencesOpen(true)}
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
										changeThemeFromMenu(
											String(key),
											domEvent as unknown as MouseEvent<HTMLElement>,
										);
										if (key === "settings") {
											setPreferencesOpen(true);
										}
									},
									selectedKeys: [language, themeMode],
								}}
								trigger={["click"]}
							>
								<Button
									aria-label={t("adminShell.header.more")}
									icon={<MoreOutlined aria-hidden />}
									type="text"
								/>
							</Dropdown>
						)}
						<Dropdown
							menu={{
								items: userMenuItems,
								onClick: handleUserMenuClick,
							}}
							trigger={["click"]}
						>
							<Button aria-label={currentUsername} type="text">
								<Space size={token.marginXS}>
									<PlatformUserAvatar
										displayName={currentUsername}
										fallback="icon"
										revision={currentUserAvatarRevision}
										size="small"
										userId={currentUserId}
									/>
									{hasSidebarBreakpoint ? <Text>{currentUsername}</Text> : null}
								</Space>
							</Button>
						</Dropdown>
					</Space>
				</Header>

				<Drawer
					destroyOnHidden
					onClose={() => setMobileNavigationOpen(false)}
					open={showMobileNavigation && mobileNavigationOpen}
					placement="left"
					size={sidebarWidth}
					styles={{ body: { padding: 0 } }}
					title={siteTitle}
				>
					<Menu
						items={navigationItems}
						mode="inline"
						onClick={({ key }) => openMobileRouteTab(String(key))}
						onOpenChange={setMobileOpenKeys}
						openKeys={mobileOpenKeys}
						selectedKeys={[currentPage.key]}
						style={{ height: "100%", width: "100%" }}
					/>
				</Drawer>

				<div
					data-testid="admin-shell-tab-workspace"
					ref={tabWorkspaceRef}
					style={{
						background: token.colorBgLayout,
						display: "flex",
						flex: "1 1 auto",
						flexDirection: "column",
						minHeight: 0,
						minWidth: 0,
						overflow: "hidden",
						width: "100%",
					}}
				>
					<Tabs
						activeKey={currentPage.key}
						aria-label={t("adminShell.tabs.label")}
						hideAdd
						items={openTabs}
						onChange={(nextPath) => void navigate(nextPath)}
						onEdit={(targetKey, action) => {
							if (action === "remove" && typeof targetKey === "string") {
								closeTab(targetKey);
							}
						}}
						style={{
							background: token.colorBgContainer,
							borderBottom: `${token.lineWidth}px ${token.lineType} ${token.colorBorderSecondary}`,
							minHeight: shellTabsHeight,
							padding: 0,
							width: "100%",
						}}
						tabBarExtraContent={
							<Flex align="center" gap={0} style={{ height: "100%" }}>
								<Button
									aria-label={t("adminShell.tabs.reload")}
									icon={<ReloadOutlined aria-hidden />}
									onClick={reloadCurrentTab}
									type="text"
								/>
								<Button
									aria-label={t("adminShell.tabs.fullscreen")}
									icon={<FullscreenOutlined aria-hidden />}
									onClick={toggleFullscreen}
									type="text"
								/>
								<Dropdown
									getPopupContainer={() =>
										tabWorkspaceRef.current ?? document.body
									}
									menu={{
										items: [
											{
												key: "reload",
												icon: <ReloadOutlined aria-hidden />,
												label: t("adminShell.tabs.reload"),
											},
											{
												key: "closeCurrent",
												disabled: !hasClosableCurrentTab,
												label: t("adminShell.tabs.closeCurrent"),
											},
											{ type: "divider" },
											{
												key: "closeLeft",
												disabled: !hasClosableLeftTabs,
												label: t("adminShell.tabs.closeLeft"),
											},
											{
												key: "closeRight",
												disabled: !hasClosableRightTabs,
												label: t("adminShell.tabs.closeRight"),
											},
											{
												key: "closeOthers",
												disabled: !hasClosableOtherTabs,
												label: t("adminShell.tabs.closeOthers"),
											},
											{
												key: "closeAll",
												disabled: !hasClosableTabs,
												label: t("adminShell.tabs.closeAll"),
											},
										],
										onClick: ({ key }) => {
											if (key === "reload") {
												reloadCurrentTab();
											}
											if (key === "closeCurrent") {
												closeTab(currentPage.key);
											}
											if (key === "closeLeft") {
												closeLeftTabs();
											}
											if (key === "closeRight") {
												closeRightTabs();
											}
											if (key === "closeOthers") {
												closeOtherTabs();
											}
											if (key === "closeAll") {
												closeAllTabs();
											}
										},
									}}
									trigger={["click"]}
								>
									<Button
										aria-label={t("adminShell.tabs.more")}
										icon={<MoreOutlined aria-hidden />}
										type="text"
									/>
								</Dropdown>
							</Flex>
						}
						tabBarStyle={{ margin: 0, minHeight: shellTabsHeight }}
						type="editable-card"
					/>

					<SettingsDrawer
						isColorBlindMode={isColorBlindMode}
						isFooterVisible={isFooterVisible}
						language={language}
						menuType={menuType}
						navigationMode={navigationMode}
						onChangeColorBlindMode={onChangeColorBlindMode}
						onChangeFooterVisibility={changeFooterVisibility}
						onChangeLanguage={(nextLanguage) => {
							void i18n.changeLanguage(nextLanguage);
						}}
						onChangeMenuType={changeMenuType}
						onChangeNavigationMode={changeNavigationMode}
						onChangeThemeColor={onChangeThemeColor}
						onChangeThemeMode={onChangeThemeMode}
						onChangeTimeZone={onChangeTimeZone}
						onClose={() => setPreferencesOpen(false)}
						onResetPreferences={resetPreferences}
						open={preferencesOpen}
						themeColor={themeColor}
						themeMode={themeMode}
						timeZone={timeZone}
					/>

					<CommandPalette
						items={commandPaletteItems}
						onNavigate={openRouteTab}
						onOpenChange={setCommandPaletteOpen}
						open={commandPaletteOpen}
					/>

					<Content
						style={{
							flex: "1 1 auto",
							minHeight: 0,
							overflow: "auto",
							width: "100%",
						}}
					>
						<Flex vertical>
							<Flex
								data-testid="admin-shell-page-content"
								gap={token.marginLG}
								style={{
									paddingBlockEnd: showSidebarNavigation
										? token.paddingLG
										: token.padding,
									paddingBlockStart: showSidebarNavigation
										? token.paddingLG
										: token.padding,
									paddingInline: token.paddingLG,
									width: "100%",
								}}
								vertical
							>
								{navigation.state === "loading" ? (
									<RouteContentSkeleton />
								) : (
									<PermissionBoundary
										permission={currentPage.requiredPermission}
									>
										<Outlet />
									</PermissionBoundary>
								)}
							</Flex>
						</Flex>
						{isFooterVisible ? (
							<Footer
								style={{
									background: token.colorBgLayout,
									color: token.colorTextTertiary,
									paddingBlock: token.paddingLG,
									paddingInline: token.padding,
									textAlign: "center",
								}}
							>
								{t("app.copyright", { siteTitle })}
							</Footer>
						) : null}
					</Content>
				</div>
			</Layout>
		</Layout>
	);
}
