import {
	ClearOutlined,
	CloseOutlined,
	CompressOutlined,
	FullscreenOutlined,
	MoreOutlined,
	ReloadOutlined,
	VerticalLeftOutlined,
	VerticalRightOutlined,
} from "@ant-design/icons";
import { Button, Dropdown, Flex, type MenuProps, Tabs, theme } from "antd";
import type { RefObject, SetStateAction } from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import {
	adminRouteByPath,
	dashboardPath,
	getAdminRouteMetadata,
	type AdminRouteMetadata,
} from "../../app/adminRoutes";

interface AdminTabsBarProps {
	currentPage: AdminRouteMetadata;
	workspaceRef: RefObject<HTMLDivElement | null>;
}

interface OpenTabsState {
	routeKey: string;
	tabKeys: string[];
}

export function AdminTabsBar({ currentPage, workspaceRef }: AdminTabsBarProps) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const navigate = useNavigate();
	const tabsHeight = token.controlHeight + token.marginXS;
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

	const reloadTab = (targetKey: string) => {
		void navigate(targetKey, { replace: true });
	};

	const toggleFullscreen = () => {
		if (document.fullscreenElement) {
			void document.exitFullscreen?.();
			return;
		}

		void workspaceRef.current?.requestFullscreen?.();
	};

	const closeLeftTabs = (targetKey: string) => {
		const targetIndex = openTabKeys.indexOf(targetKey);
		if (targetIndex < 0) {
			return;
		}

		const nextTabKeys = openTabKeys.filter(
			(tabKey, tabIndex) => tabKey === dashboardPath || tabIndex >= targetIndex,
		);
		setOpenTabKeys(nextTabKeys);
		if (!nextTabKeys.includes(currentPage.key)) {
			void navigate(targetKey);
		}
	};

	const closeRightTabs = (targetKey: string) => {
		const targetIndex = openTabKeys.indexOf(targetKey);
		if (targetIndex < 0) {
			return;
		}

		const nextTabKeys = openTabKeys.filter(
			(tabKey, tabIndex) => tabKey === dashboardPath || tabIndex <= targetIndex,
		);
		setOpenTabKeys(nextTabKeys);
		if (!nextTabKeys.includes(currentPage.key)) {
			void navigate(targetKey);
		}
	};

	const closeOtherTabs = (targetKey: string) => {
		const nextTabKeys =
			targetKey === dashboardPath
				? [dashboardPath]
				: [dashboardPath, targetKey];
		setOpenTabKeys(nextTabKeys);
		if (!nextTabKeys.includes(currentPage.key)) {
			void navigate(targetKey);
		}
	};

	const closeAllTabs = () => {
		setOpenTabKeys([dashboardPath]);
		if (currentPage.key !== dashboardPath) {
			void navigate(dashboardPath);
		}
	};

	const createTabActionMenuItems = (
		targetKey: string,
	): NonNullable<MenuProps["items"]> => {
		const targetIndex = openTabKeys.indexOf(targetKey);
		const hasClosableLeftTabs = openTabKeys
			.slice(0, Math.max(targetIndex, 0))
			.some((tabKey) => tabKey !== dashboardPath);
		const hasClosableRightTabs = openTabKeys
			.slice(targetIndex + 1)
			.some((tabKey) => tabKey !== dashboardPath);
		const hasClosableOtherTabs = openTabKeys.some(
			(tabKey) => tabKey !== dashboardPath && tabKey !== targetKey,
		);
		const hasClosableTabs = openTabKeys.some(
			(tabKey) => tabKey !== dashboardPath,
		);

		return [
			{
				key: "reload",
				icon: <ReloadOutlined aria-hidden />,
				label: t("adminShell.tabs.reload"),
			},
			{
				key: "closeCurrent",
				disabled: targetKey === dashboardPath,
				icon: <CloseOutlined aria-hidden />,
				label: t("adminShell.tabs.closeCurrent"),
			},
			{ type: "divider" },
			{
				key: "closeLeft",
				disabled: !hasClosableLeftTabs,
				icon: <VerticalLeftOutlined aria-hidden />,
				label: t("adminShell.tabs.closeLeft"),
			},
			{
				key: "closeRight",
				disabled: !hasClosableRightTabs,
				icon: <VerticalRightOutlined aria-hidden />,
				label: t("adminShell.tabs.closeRight"),
			},
			{ type: "divider" },
			{
				key: "closeOthers",
				disabled: !hasClosableOtherTabs,
				icon: <CompressOutlined aria-hidden />,
				label: t("adminShell.tabs.closeOthers"),
			},
			{
				key: "closeAll",
				disabled: !hasClosableTabs,
				icon: <ClearOutlined aria-hidden />,
				label: t("adminShell.tabs.closeAll"),
			},
		];
	};

	const runTabAction = (targetKey: string, actionKey: string) => {
		if (actionKey === "reload") {
			reloadTab(targetKey);
		}
		if (actionKey === "closeCurrent") {
			closeTab(targetKey);
		}
		if (actionKey === "closeLeft") {
			closeLeftTabs(targetKey);
		}
		if (actionKey === "closeRight") {
			closeRightTabs(targetKey);
		}
		if (actionKey === "closeOthers") {
			closeOtherTabs(targetKey);
		}
		if (actionKey === "closeAll") {
			closeAllTabs();
		}
	};

	const openTabs = openTabKeys.map((tabKey) => {
		const tabPage =
			adminRouteByPath.get(tabKey) ?? getAdminRouteMetadata(dashboardPath);

		return {
			key: tabPage.key,
			label: (
				<Dropdown
					getPopupContainer={() => workspaceRef.current ?? document.body}
					menu={{
						items: createTabActionMenuItems(tabPage.key),
						onClick: ({ key }) => runTabAction(tabPage.key, key),
					}}
					trigger={["contextMenu"]}
				>
					<span>{t(tabPage.titleKey)}</span>
				</Dropdown>
			),
			closable: tabPage.key !== dashboardPath,
		};
	});

	return (
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
				boxSizing: "border-box",
				flex: `0 0 ${tabsHeight}px`,
				height: tabsHeight,
				minHeight: tabsHeight,
				padding: 0,
				width: "100%",
			}}
			tabBarExtraContent={
				<Flex align="center" gap={0} style={{ height: "100%" }}>
					<Button
						aria-label={t("adminShell.tabs.reload")}
						icon={<ReloadOutlined aria-hidden />}
						onClick={() => reloadTab(currentPage.key)}
						type="text"
					/>
					<Button
						aria-label={t("adminShell.tabs.fullscreen")}
						icon={<FullscreenOutlined aria-hidden />}
						onClick={toggleFullscreen}
						type="text"
					/>
					<Dropdown
						getPopupContainer={() => workspaceRef.current ?? document.body}
						menu={{
							items: createTabActionMenuItems(currentPage.key),
							onClick: ({ key }) => runTabAction(currentPage.key, key),
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
			tabBarStyle={{ margin: 0, minHeight: tabsHeight }}
			type="editable-card"
		/>
	);
}
