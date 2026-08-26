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
import type { Announcements, DragEndEvent } from "@dnd-kit/core";
import {
	closestCenter,
	DndContext,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import { restrictToHorizontalAxis } from "@dnd-kit/modifiers";
import {
	arrayMove,
	horizontalListSortingStrategy,
	SortableContext,
	sortableKeyboardCoordinates,
	useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button, Dropdown, Flex, type MenuProps, Tabs, theme } from "antd";
import type {
	CSSProperties,
	HTMLAttributes,
	KeyboardEvent,
	PointerEvent,
	ReactElement,
	RefObject,
	SetStateAction,
} from "react";
import { cloneElement, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import {
	adminRouteByPath,
	dashboardPath,
	getAdminRouteMetadata,
	type AdminRouteMetadata,
} from "../../app/adminRoutes";
import { clearRouteSessionState } from "../../app/routeSessionState";

interface AdminTabsBarProps {
	currentPage: AdminRouteMetadata;
	workspaceRef: RefObject<HTMLDivElement | null>;
}

interface OpenTabsState {
	routeKey: string;
	tabKeys: string[];
}

interface TabNodeProps extends HTMLAttributes<HTMLDivElement> {
	"data-node-key": string;
}

interface DraggableTabNodeProps extends TabNodeProps {
	contextMenuProps: MenuProps;
	draggableDescription: string;
	draggingStyle: CSSProperties;
	getPopupContainer: () => HTMLElement;
}

const interactiveElementSelector =
	'button, a, input, textarea, select, [contenteditable="true"]';

function isInteractiveEventTarget(
	event: KeyboardEvent<HTMLElement> | PointerEvent<HTMLElement>,
) {
	return (
		event.target instanceof Element &&
		event.target !== event.currentTarget &&
		event.target.closest(interactiveElementSelector) !== null
	);
}

function DraggableTabNode({
	children,
	contextMenuProps,
	draggableDescription,
	draggingStyle,
	getPopupContainer,
	...tabProps
}: Readonly<DraggableTabNodeProps>) {
	const tabKey = tabProps["data-node-key"];
	const {
		attributes,
		isDragging,
		listeners,
		setNodeRef,
		transform,
		transition,
	} = useSortable({ id: tabKey });
	const child = children as ReactElement<Record<string, unknown>>;
	const style: CSSProperties = {
		...tabProps.style,
		cursor: isDragging ? "grabbing" : "grab",
		transform: CSS.Translate.toString(transform),
		transition: isDragging ? "none" : transition,
		...(isDragging ? draggingStyle : undefined),
		zIndex: isDragging ? 1 : undefined,
	};
	const sortableListeners = {
		onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
			if (!isInteractiveEventTarget(event)) {
				listeners?.onKeyDown?.(event);
			}
		},
		onPointerDown: (event: PointerEvent<HTMLElement>) => {
			if (event.button === 0 && !isInteractiveEventTarget(event)) {
				listeners?.onPointerDown?.(event);
			}
		},
	};

	const draggableTab = cloneElement(child, {
		"aria-describedby": attributes["aria-describedby"],
		"aria-disabled": attributes["aria-disabled"],
		"aria-roledescription": draggableDescription,
		ref: setNodeRef,
		style,
		...sortableListeners,
	});

	return (
		<Dropdown
			getPopupContainer={getPopupContainer}
			menu={contextMenuProps}
			trigger={["contextMenu"]}
		>
			{draggableTab}
		</Dropdown>
	);
}

function FixedTabNode({ children, ...tabProps }: Readonly<TabNodeProps>) {
	const child = children as ReactElement<Record<string, unknown>>;

	return cloneElement(child, {
		style: { ...tabProps.style, cursor: "default" },
	});
}

export function AdminTabsBar({ currentPage, workspaceRef }: AdminTabsBarProps) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const navigate = useNavigate();
	const tabsHeight = token.controlHeight + token.marginXS;
	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	);
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
	const clearClosedTabStates = (nextTabKeys: readonly string[]) => {
		openTabKeys
			.filter((tabKey) => !nextTabKeys.includes(tabKey))
			.forEach(clearRouteSessionState);
	};

	const closeTab = (targetKey: string) => {
		if (targetKey === dashboardPath) {
			return;
		}

		const targetIndex = openTabKeys.indexOf(targetKey);
		const nextTabKeys = openTabKeys.filter((tabKey) => tabKey !== targetKey);
		clearClosedTabStates(nextTabKeys);
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
		clearClosedTabStates(nextTabKeys);
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
		clearClosedTabStates(nextTabKeys);
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
		clearClosedTabStates(nextTabKeys);
		setOpenTabKeys(nextTabKeys);
		if (!nextTabKeys.includes(currentPage.key)) {
			void navigate(targetKey);
		}
	};

	const closeAllTabs = () => {
		clearClosedTabStates([dashboardPath]);
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

	const getTabTitle = (tabKey: string | number) => {
		const path = String(tabKey);
		const tabPage =
			adminRouteByPath.get(path) ?? getAdminRouteMetadata(dashboardPath);
		return t(tabPage.titleKey);
	};
	const dragAnnouncements: Announcements = {
		onDragStart: ({ active }) =>
			t("adminShell.tabs.dragStart", { title: getTabTitle(active.id) }),
		onDragOver: ({ active, over }) =>
			over
				? t("adminShell.tabs.dragOver", {
						activeTitle: getTabTitle(active.id),
						overTitle: getTabTitle(over.id),
					})
				: undefined,
		onDragEnd: ({ active, over }) =>
			over
				? t("adminShell.tabs.dragEnd", {
						activeTitle: getTabTitle(active.id),
						overTitle: getTabTitle(over.id),
					})
				: undefined,
		onDragCancel: ({ active }) =>
			t("adminShell.tabs.dragCancel", { title: getTabTitle(active.id) }),
	};
	const reorderTabs = ({ active, over }: DragEndEvent) => {
		const activeKey = String(active.id);
		const overKey = over ? String(over.id) : undefined;
		if (
			!overKey ||
			activeKey === overKey ||
			activeKey === dashboardPath ||
			overKey === dashboardPath
		) {
			return;
		}

		setOpenTabKeys((currentTabKeys) => {
			const activeIndex = currentTabKeys.indexOf(activeKey);
			const overIndex = currentTabKeys.indexOf(overKey);
			return activeIndex < 0 || overIndex < 0
				? currentTabKeys
				: arrayMove(currentTabKeys, activeIndex, overIndex);
		});
	};

	const openTabs = openTabKeys.map((tabKey) => {
		const tabPage =
			adminRouteByPath.get(tabKey) ?? getAdminRouteMetadata(dashboardPath);

		return {
			key: tabPage.key,
			label: <span>{t(tabPage.titleKey)}</span>,
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
			renderTabBar={(tabBarProps, DefaultTabBar) => (
				<DndContext
					accessibility={{
						announcements: dragAnnouncements,
						screenReaderInstructions: {
							draggable: t("adminShell.tabs.dragInstructions"),
						},
					}}
					collisionDetection={closestCenter}
					modifiers={[restrictToHorizontalAxis]}
					onDragEnd={reorderTabs}
					sensors={sensors}
				>
					<SortableContext
						items={openTabKeys.filter((tabKey) => tabKey !== dashboardPath)}
						strategy={horizontalListSortingStrategy}
					>
						<DefaultTabBar {...tabBarProps}>
							{(node) => {
								const tabNodeProps = (node as ReactElement<TabNodeProps>).props;
								const tabKey = String(node.key);
								return node.key === dashboardPath ? (
									<FixedTabNode {...tabNodeProps} key={node.key}>
										{node}
									</FixedTabNode>
								) : (
									<DraggableTabNode
										{...tabNodeProps}
										contextMenuProps={{
											items: createTabActionMenuItems(tabKey),
											onClick: ({ key }) => runTabAction(tabKey, key),
										}}
										draggableDescription={t(
											"adminShell.tabs.draggableDescription",
										)}
										draggingStyle={{
											backgroundColor: token.colorBgElevated,
											boxShadow: token.boxShadowTertiary,
										}}
										getPopupContainer={() =>
											workspaceRef.current ?? document.body
										}
										key={node.key}
									>
										{node}
									</DraggableTabNode>
								);
							}}
						</DefaultTabBar>
					</SortableContext>
				</DndContext>
			)}
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
				<Flex
					align="center"
					gap={0}
					style={{ height: "100%", paddingInlineEnd: token.marginXS }}
				>
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
