import {
	AntDesignOutlined,
	AppstoreOutlined,
	CheckCircleOutlined,
	MenuFoldOutlined,
	MenuUnfoldOutlined,
	ProfileOutlined,
	SettingOutlined,
	WarningOutlined,
} from "@ant-design/icons";
import {
	Breadcrumb,
	Button,
	Drawer,
	Flex,
	Grid,
	Layout,
	Menu,
	type MenuProps,
	theme,
	Typography,
} from "antd";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link as RouterLink } from "react-router";

import {
	adminCollapsibleSidebarGroupKeys,
	adminNavigationGroupByKey,
	adminNavigationGroups,
	adminRouteByPath,
	dashboardPath,
	getAdminRouteMetadata,
	getAdminRouteOpenKeys,
	type AdminGroupIconKey,
	type AdminNavigationNode,
	type AdminRouteMetadata,
} from "../../app/adminRoutes";
import { usePermissionChecker } from "../../app/permissions";
import type { MenuType, NavigationMode } from "../../app/preferenceStorage";
import { AdminRouteIcon } from "./AdminRouteIcon";
import { TwoColumnServiceMenu } from "./TwoColumnServiceMenu";

const { Header, Sider } = Layout;
const { Text } = Typography;
const collapsibleSidebarRootKeys: readonly string[] =
	adminCollapsibleSidebarGroupKeys;

const groupIconByKey: Record<AdminGroupIconKey, ReactNode> = {
	examples: <AppstoreOutlined aria-hidden />,
	exceptions: <WarningOutlined aria-hidden />,
	formExamples: <ProfileOutlined aria-hidden />,
	listExamples: <AppstoreOutlined aria-hidden />,
	operations: <ProfileOutlined aria-hidden />,
	results: <CheckCircleOutlined aria-hidden />,
	system: <SettingOutlined aria-hidden />,
};

interface DesktopMenuState {
	contextKey: string;
	openKeys: string[];
}

interface AdminShellNavigationProps {
	children: (layout: { showSidebarNavigation: boolean }) => ReactNode;
	currentPage: AdminRouteMetadata;
	headerActions: ReactNode;
	menuType: MenuType;
	navigationMode: NavigationMode;
	onNavigate: (path: string) => void;
	siteTitle: string;
}

export function AdminShellNavigation({
	children,
	currentPage,
	headerActions,
	menuType,
	navigationMode,
	onNavigate,
	siteTitle,
}: AdminShellNavigationProps) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const screens = Grid.useBreakpoint();
	const hasPermission = usePermissionChecker();
	const [collapsed, setCollapsed] = useState(false);
	const [compactSidebarExpanded, setCompactSidebarExpanded] = useState(false);
	const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);
	const [mobileOpenKeys, setMobileOpenKeys] = useState<string[]>([]);
	const shellHeaderHeight = token.controlHeightLG + token.margin;
	const collapsedSidebarWidth = token.controlHeightLG * 2;
	const sidebarWidth = token.controlHeightLG + token.paddingLG * 8;
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
						icon: route.iconKey ? (
							<AdminRouteIcon iconKey={route.iconKey} />
						) : undefined,
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
		icon: <AdminRouteIcon iconKey="dashboard" />,
		label: t(dashboardRoute.titleKey),
	};
	const navigationItemsByGroup = new Map<
		string,
		NonNullable<MenuProps["items"]>
	>(
		adminNavigationGroups.map((group) => [
			group.key,
			createNavigationItems(group.nodes),
		]),
	);
	const visibleNavigationGroups = adminNavigationGroups.filter(
		(group) => (navigationItemsByGroup.get(group.key)?.length ?? 0) > 0,
	);
	const navigationItems: NonNullable<MenuProps["items"]> = [
		dashboardNavigationItem,
		...visibleNavigationGroups.map((group) => ({
			key: group.key,
			icon: groupIconByKey[group.iconKey],
			label: t(group.titleKey),
			children: navigationItemsByGroup.get(group.key) ?? [],
		})),
	];
	const topLevelNavigationItems: NonNullable<MenuProps["items"]> = [
		{ ...dashboardNavigationItem, key: "dashboard" },
		...visibleNavigationGroups.map((group) => ({
			key: group.key,
			icon: groupIconByKey[group.iconKey],
			label: t(group.titleKey),
		})),
	];
	const mixedSidebarItemsByGroup = new Map<
		string,
		NonNullable<MenuProps["items"]>
	>([
		["dashboard", [dashboardNavigationItem]],
		...visibleNavigationGroups.map(
			(group) =>
				[group.key, navigationItemsByGroup.get(group.key) ?? []] as const,
		),
	]);
	const sidebarNavigationItems =
		isDesktopNavigation && navigationMode === "mixed"
			? (mixedSidebarItemsByGroup.get(currentPage.groupKey) ?? [])
			: navigationItems;
	const topNavigationItems =
		navigationMode === "mixed" ? topLevelNavigationItems : navigationItems;
	const openRouteTab = (nextPath: string) => {
		if (adminRouteByPath.has(nextPath)) {
			onNavigate(nextPath);
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
	const handleDesktopOpenChange: MenuProps["onOpenChange"] = (nextOpenKeys) => {
		const newlyOpenedRootKey = nextOpenKeys.find(
			(key) =>
				collapsibleSidebarRootKeys.includes(key) &&
				!desktopOpenKeys.includes(key),
		);
		if (newlyOpenedRootKey) {
			setDesktopOpenKeys([newlyOpenedRootKey]);
			return;
		}

		const openRootKey = nextOpenKeys.find((key) =>
			collapsibleSidebarRootKeys.includes(key),
		);
		setDesktopOpenKeys(
			openRootKey
				? nextOpenKeys.filter(
						(key) =>
							key === openRootKey || !collapsibleSidebarRootKeys.includes(key),
					)
				: [...nextOpenKeys],
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
	const breadcrumbItems = [
		...(currentPage.groupKey === "dashboard"
			? []
			: [{ title: t(currentPage.sectionKey) }]),
		{ title: t(currentPage.titleKey) },
	];
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
						style={{
							flex: "1 1 auto",
							minWidth: 0,
							overflow: "hidden",
						}}
					>
						{showMobileNavigation ? (
							<Button
								aria-label={t("adminShell.navigation.openMobile")}
								icon={<MenuUnfoldOutlined aria-hidden />}
								onClick={() => {
									setMobileOpenKeys(activeSidebarOpenKeys);
									setMobileNavigationOpen(true);
								}}
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
								onClick={({ key }) => {
									if (navigationMode === "mixed") {
										openNavigationGroup(key);
										return;
									}
									openRouteTab(String(key));
								}}
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
								style={{
									maxWidth: "100%",
									minWidth: 0,
									whiteSpace: "nowrap",
								}}
							>
								{t(currentPage.titleKey)}
							</Text>
						) : null}
					</Flex>
					{headerActions}
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
						onClick={({ key }) => {
							openRouteTab(String(key));
							setMobileNavigationOpen(false);
						}}
						onOpenChange={setMobileOpenKeys}
						openKeys={mobileOpenKeys}
						selectedKeys={[currentPage.key]}
						style={{ height: "100%", width: "100%" }}
					/>
				</Drawer>

				{children({ showSidebarNavigation })}
			</Layout>
		</Layout>
	);
}
