import { ConfigProvider, Menu, type MenuProps, type MenuRef } from "antd";
import { useRef } from "react";
import { createPortal } from "react-dom";

import { appAntdCssVar } from "../../app/antdCssVar";
import styles from "./PressRipple.module.css";
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

	const parent = item.parentElement;
	if (
		alignHorizontalRoot &&
		item.closest('[role="menu"]') === rootMenu &&
		parent instanceof HTMLElement &&
		parent.getAttribute("role") === "none"
	)
		return parent;

	return item;
}

export function NavigationMenu(props: MenuProps) {
	const menuRef = useRef<MenuRef>(null);
	const { ripple, rippleProps, showRipple, releaseRipple, finishRipple } =
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
						// Horizontal group titles use itemBorderRadius; popup items have their own token.
						...(props.mode === "horizontal"
							? { itemBorderRadius: 0, horizontalItemBorderRadius: 0 }
							: {}),
						itemActiveBg: "transparent",
						dangerItemActiveBg: "transparent",
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
						showRipple(target, event);
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
						ripple &&
						(!(event.relatedTarget instanceof Node) ||
							!ripple.target.contains(event.relatedTarget))
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
						showRipple(target);
				}}
				onKeyUpCapture={(event) => {
					props.onKeyUpCapture?.(event);
					if (event.key === "Enter" || event.key === " ") releaseRipple();
				}}
				onBlurCapture={(event) => {
					props.onBlurCapture?.(event);
					if (ripple?.target.contains(event.target)) releaseRipple();
				}}
			/>
			{/* Menu owns its selection pseudo-element; the project ripple uses a separate, non-interactive child. */}
			{ripple
				? createPortal(
						<span aria-hidden className={styles.menuRipple}>
							<span
								{...rippleProps}
								className={styles.ripple}
								onAnimationEnd={finishRipple}
							/>
						</span>,
						ripple.target,
					)
				: null}
		</ConfigProvider>
	);
}
