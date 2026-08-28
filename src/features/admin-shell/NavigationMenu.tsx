import { ConfigProvider, Menu, type MenuProps } from "antd";
import { createPortal } from "react-dom";

import styles from "./PressRipple.module.css";
import { usePressRipple } from "./usePressRipple";

function getRippleTarget(target: EventTarget | null) {
	const item =
		target instanceof Element ? target.closest('[role="menuitem"]') : null;
	return item instanceof HTMLElement &&
		item.getAttribute("aria-disabled") !== "true"
		? item
		: null;
}

export function NavigationMenu(props: MenuProps) {
	const { ripple, rippleProps, showRipple, releaseRipple, finishRipple } =
		usePressRipple(props.disabled);
	return (
		<ConfigProvider
			theme={{
				components: {
					Menu: {
						itemActiveBg: "transparent",
						dangerItemActiveBg: "transparent",
					},
				},
			}}
		>
			<Menu
				{...props}
				onPointerDownCapture={(event) => {
					props.onPointerDownCapture?.(event);
					const target = getRippleTarget(event.target);
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
					const target = getRippleTarget(event.target);
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
