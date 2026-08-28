import { type MenuProps, theme } from "antd";
import type { CSSProperties } from "react";
import { useMemo } from "react";

import styles from "./TwoColumnServiceMenu.module.css";
import { NavigationMenu } from "./NavigationMenu";

interface TwoColumnServiceMenuProps {
	items: MenuProps["items"];
	onClick: NonNullable<MenuProps["onClick"]>;
	onOpenChange: NonNullable<MenuProps["onOpenChange"]>;
	openKeys: string[];
	rootGrid?: boolean;
	selectedKeys: string[];
}

type MenuItem = NonNullable<MenuProps["items"]>[number];
type SubmenuItem = Extract<MenuItem, { children?: unknown }> & {
	children: NonNullable<MenuProps["items"]>;
};

function hasChildArray(item: MenuItem): item is SubmenuItem {
	return Boolean(
		item &&
		typeof item === "object" &&
		"children" in item &&
		Array.isArray(item.children),
	);
}

function appendClassName(
	currentClassName: string | undefined,
	className: string | undefined,
) {
	return [currentClassName, className].filter(Boolean).join(" ");
}

function markTwoColumnLayout(
	items: NonNullable<MenuProps["items"]>,
	contentInset: number,
	arrowStep: number,
	isGridChild = false,
	depth = 0,
): NonNullable<MenuProps["items"]> {
	return items.map((item) => {
		if (!item || typeof item !== "object" || item.type === "divider") {
			return item;
		}

		if (!hasChildArray(item)) {
			return {
				...item,
				icon: undefined,
				style: {
					...item.style,
					paddingInlineStart: contentInset,
				},
			};
		}

		const containsPages = item.children.length > 0;
		const hasIcon = "icon" in item && Boolean(item.icon);
		const submenuStyle = {
			...item.style,
			"--service-grid-arrow-offset": `${depth * arrowStep}px`,
		} as CSSProperties;

		return {
			...item,
			className: appendClassName(
				item.className,
				appendClassName(
					styles.twoColumnSubmenu,
					isGridChild && containsPages ? styles.fullWidthSubmenu : undefined,
				),
			),
			children: markTwoColumnLayout(
				item.children,
				contentInset,
				arrowStep,
				true,
				depth + 1,
			),
			label: hasIcon ? (
				item.label
			) : (
				<span className={styles.titleLabel}>{item.label}</span>
			),
			style: submenuStyle,
		};
	});
}

export function TwoColumnServiceMenu({
	items,
	onClick,
	onOpenChange,
	openKeys,
	rootGrid = false,
	selectedKeys,
}: TwoColumnServiceMenuProps) {
	const { token } = theme.useToken();
	const twoColumnItems = useMemo(
		() =>
			markTwoColumnLayout(
				items ?? [],
				token.paddingLG,
				token.padding,
				rootGrid,
			),
		[items, rootGrid, token.padding, token.paddingLG],
	);
	const menuStyle = {
		"--service-grid-arrow-base": `${token.padding}px`,
		"--service-grid-content-inset": `${token.paddingLG}px`,
		background: token.colorBgContainer,
		borderInlineEnd: 0,
	} as CSSProperties;

	return (
		<NavigationMenu
			className={rootGrid ? styles.rootGrid : undefined}
			data-testid="admin-shell-service-grid-menu"
			inlineIndent={0}
			items={twoColumnItems}
			mode="inline"
			onClick={onClick}
			onOpenChange={onOpenChange}
			openKeys={openKeys}
			selectedKeys={selectedKeys}
			style={menuStyle}
		/>
	);
}
