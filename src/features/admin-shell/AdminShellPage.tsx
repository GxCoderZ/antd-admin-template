import { useQueryClient } from "@tanstack/react-query";
import { Flex, Layout, theme } from "antd";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Outlet, useLocation, useNavigate, useNavigation } from "react-router";

import { RouteContentSkeleton } from "../../app/LoadingSkeletons";
import { adminRouteByPath, getAdminRouteMetadata } from "../../app/adminRoutes";
import { useLocalePreferences } from "../../app/localePreferences";
import { PermissionBoundary } from "../../app/PermissionProvider";
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
	writeFooterVisiblePreference,
	writeMenuTypePreference,
	writeNavigationModePreference,
} from "../../app/preferenceStorage";
import { PlatformLogo } from "../../app/PlatformLogo";
import { usePlatformBrand } from "../../app/usePlatformBrand";
import { resolveInitialLanguage } from "../../i18n";
import { AdminShellHeader } from "./AdminShellHeader";
import { AdminShellNavigation } from "./AdminShellNavigation";
import { AdminTabsBar } from "./AdminTabsBar";
import "./AdminShellPage.css";

const { Content, Footer } = Layout;

interface AdminShellPageProps {
	currentUserAvatarRevision: number;
	currentUserId: string;
	currentUsername: string;
	isColorBlindMode: boolean;
	isDarkMode: boolean;
	onChangeColorBlindMode: (enabled: boolean) => void;
	onChangeThemeColor: (nextThemeColor: ThemeColor) => void;
	onChangeThemeMode: (nextMode: ThemeMode) => void;
	onLogout: () => Promise<void>;
	themeColor: ThemeColor;
	themeMode: ThemeMode;
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
	const { i18n } = useTranslation();
	const { token } = theme.useToken();
	const brand = usePlatformBrand();
	const location = useLocation();
	const navigate = useNavigate();
	const navigation = useNavigation();
	const queryClient = useQueryClient();
	const [pageRevision, setPageRevision] = useState(0);
	const [isFooterVisible, setFooterVisible] = useState(
		readFooterVisiblePreference,
	);
	const [navigationMode, setNavigationMode] = useState<NavigationMode>(
		readNavigationModePreference,
	);
	const [menuType, setMenuType] = useState<MenuType>(readMenuTypePreference);
	const { onChangeCurrency, onChangeTimeZone, timeZone } =
		useLocalePreferences();
	const currentPage = getAdminRouteMetadata(location.pathname);
	const usesPageContainer = currentPage.contentLayout === "pageContainer";
	const usesTableLayout = currentPage.contentLayout === "table";
	const reloadCurrentPage = () => {
		// Remounting resets query-submission keys, so their earlier cache entries
		// must also be stale. The remounted page alone triggers new requests.
		void queryClient.invalidateQueries({ refetchType: "none" });
		setPageRevision((revision) => revision + 1);
	};
	const openRouteTab = (nextPath: string) => {
		const nextPage = adminRouteByPath.get(nextPath);

		if (nextPage) {
			void navigate(nextPage.key);
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

	return (
		<AdminShellNavigation
			currentPage={currentPage}
			headerActions={
				<AdminShellHeader
					currentUserAvatarRevision={currentUserAvatarRevision}
					currentUserId={currentUserId}
					currentUsername={currentUsername}
					isColorBlindMode={isColorBlindMode}
					isDarkMode={isDarkMode}
					isFooterVisible={isFooterVisible}
					menuType={menuType}
					navigationMode={navigationMode}
					onChangeColorBlindMode={onChangeColorBlindMode}
					onChangeFooterVisibility={changeFooterVisibility}
					onChangeMenuType={changeMenuType}
					onChangeNavigationMode={changeNavigationMode}
					onChangeThemeColor={onChangeThemeColor}
					onChangeThemeMode={onChangeThemeMode}
					onChangeTimeZone={onChangeTimeZone}
					onLogout={onLogout}
					onNavigate={openRouteTab}
					onResetPreferences={resetPreferences}
					themeColor={themeColor}
					themeMode={themeMode}
					timeZone={timeZone}
				/>
			}
			menuType={menuType}
			logo={<PlatformLogo size={token.controlHeight} src={brand.logoDataUrl} />}
			navigationMode={navigationMode}
			onNavigate={openRouteTab}
			shortTitle={brand.shortTitle}
			siteTitle={brand.siteTitle}
		>
			{({ showSidebarNavigation }) => (
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
					<AdminTabsBar
						currentPage={currentPage}
						onReload={reloadCurrentPage}
						workspaceRef={tabWorkspaceRef}
					/>

					<Content
						className="admin-shell-scroll-content"
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
								gap={usesPageContainer ? 0 : token.marginLG}
								style={{
									paddingBlock: usesPageContainer
										? 0
										: usesTableLayout || showSidebarNavigation
											? token.paddingLG
											: token.padding,
									paddingInline: usesPageContainer ? 0 : token.paddingLG,
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
										<Outlet key={pageRevision} />
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
								{brand.copyright}
							</Footer>
						) : null}
					</Content>
				</div>
			)}
		</AdminShellNavigation>
	);
}
