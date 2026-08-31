import {
	ConfigProvider,
	Menu,
	theme,
	type MenuProps,
	type MenuRef,
} from "antd";
import { useRef } from "react";

import { appAntdCssVar } from "../../app/antdCssVar";
import { PressRipple } from "./PressRipple";
import { usePressRipple } from "./usePressRipple";

function getRippleTarget(
	target: EventTarget | null,
	rootMenu: HTMLUListElement | null,
	alignHorizontalRoot: boolean,
) {
	const item =
		target instanceof Element ? target.closest('[role="menuitem"]') : null;
	if (
		!(item instanceof HTMLElement) ||
		item.getAttribute("aria-disabled") === "true"
	)
		return null;

	if (alignHorizontalRoot && item.closest('[role="menu"]') === rootMenu) {
		const parent = item.parentElement;
		return {
			element:
				parent instanceof HTMLElement && parent.getAttribute("role") === "none"
					? parent
					: item,
			squareClip: true,
		};
	}

	return { element: item, squareClip: false };
}

export function NavigationMenu(props: MenuProps) {
	const menuRef = useRef<MenuRef>(null);
	const { token } = theme.useToken();
	const { ripples, activeRipple, showRipple, releaseRipple, finishRipple } =
		usePressRipple(props.disabled);
	const resolveRippleTarget = (target: EventTarget | null) =>
		getRippleTarget(
			target,
			menuRef.current?.menu?.list ?? null,
			props.mode === "horizontal",
		);
	return (
		<ConfigProvider
			theme={{
				cssVar: appAntdCssVar,
				components: {
					Menu: {
						itemActiveBg: "transparent",
						dangerItemActiveBg: "transparent",
						horizontalItemBorderRadius: token.borderRadius,
					},
				},
			}}
		>
			<Menu
				{...props}
				ref={menuRef}
				onPointerDownCapture={(event) => {
					props.onPointerDownCapture?.(event);
					const target = resolveRippleTarget(event.target);
					if (target && !event.defaultPrevented && event.button === 0)
						showRipple(target.element, event, target.squareClip);
				}}
				onPointerUpCapture={(event) => {
					props.onPointerUpCapture?.(event);
					releaseRipple();
				}}
				onPointerCancelCapture={(event) => {
					props.onPointerCancelCapture?.(event);
					releaseRipple();
				}}
				onPointerOutCapture={(event) => {
					props.onPointerOutCapture?.(event);
					if (
						activeRipple &&
						(!(event.relatedTarget instanceof Node) ||
							!activeRipple.target.contains(event.relatedTarget))
					)
						releaseRipple();
				}}
				onKeyDownCapture={(event) => {
					props.onKeyDownCapture?.(event);
					const target = resolveRippleTarget(event.target);
					if (
						target &&
						!event.defaultPrevented &&
						!event.repeat &&
						(event.key === "Enter" || event.key === " ")
					)
						showRipple(target.element, undefined, target.squareClip);
				}}
				onKeyUpCapture={(event) => {
					props.onKeyUpCapture?.(event);
					if (event.key === "Enter" || event.key === " ") releaseRipple();
				}}
				onBlurCapture={(event) => {
					props.onBlurCapture?.(event);
					if (activeRipple?.target.contains(event.target)) releaseRipple();
				}}
			/>
			{/* Menu owns its selection pseudo-element; the project ripple uses a separate, non-interactive child. */}
			<PressRipple ripples={ripples} onFinish={finishRipple} />
		</ConfigProvider>
	);
}
