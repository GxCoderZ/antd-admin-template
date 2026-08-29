import { Button, ConfigProvider, type ButtonProps } from "antd";
import type { KeyboardEvent, PointerEvent } from "react";
import { forwardRef } from "react";

import { appAntdCssVar } from "../../app/antdCssVar";
import styles from "./PressRipple.module.css";
import { usePressRipple } from "./usePressRipple";

function mergeClassNames(...classNames: Array<string | undefined>) {
	return classNames.filter(Boolean).join(" ");
}

export const HeaderIconButton = forwardRef<
	HTMLAnchorElement | HTMLButtonElement,
	ButtonProps
>(function HeaderIconButton(
	{
		children,
		className,
		disabled,
		loading,
		onAnimationEnd,
		onBlur,
		onKeyDown,
		onKeyUp,
		onPointerCancel,
		onPointerDown,
		onPointerLeave,
		onPointerUp,
		style,
		...buttonProps
	},
	ref,
) {
	const isUnavailable = disabled === true || Boolean(loading);
	const { rippleProps, showRipple, releaseRipple, finishRipple } =
		usePressRipple(isUnavailable);

	const handlePointerDown = (event: PointerEvent<HTMLElement>) => {
		onPointerDown?.(event);
		if (!event.defaultPrevented && event.button === 0) {
			showRipple(event.currentTarget, event);
		}
	};

	const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
		onKeyDown?.(event);
		if (
			!event.defaultPrevented &&
			!event.repeat &&
			(event.key === "Enter" || event.key === " ")
		) {
			showRipple(event.currentTarget);
		}
	};

	// Project enhancement, not Pro's default: ripple replaces the text Button's
	// active fill. The scoped public token preserves hover, focus and disabled states.
	return (
		<ConfigProvider
			theme={{
				cssVar: appAntdCssVar,
				components: { Button: { colorFill: "transparent" } },
			}}
		>
			<Button
				{...buttonProps}
				{...rippleProps}
				className={mergeClassNames(styles.button, className)}
				{...(disabled === undefined ? {} : { disabled })}
				{...(loading === undefined ? {} : { loading })}
				onAnimationEnd={(event) => {
					onAnimationEnd?.(event);
					finishRipple(event);
				}}
				onBlur={(event) => {
					onBlur?.(event);
					releaseRipple();
				}}
				onKeyDown={handleKeyDown}
				onKeyUp={(event) => {
					onKeyUp?.(event);
					if (event.key === "Enter" || event.key === " ") releaseRipple();
				}}
				onPointerCancel={(event) => {
					onPointerCancel?.(event);
					releaseRipple();
				}}
				onPointerDown={handlePointerDown}
				onPointerLeave={(event) => {
					onPointerLeave?.(event);
					releaseRipple();
				}}
				onPointerUp={(event) => {
					onPointerUp?.(event);
					releaseRipple();
				}}
				ref={ref}
				style={{ ...style, ...rippleProps?.style }}
			>
				{children}
			</Button>
		</ConfigProvider>
	);
});
