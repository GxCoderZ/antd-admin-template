import { Button, type ButtonProps } from "antd";
import type { CSSProperties, KeyboardEvent, PointerEvent } from "react";
import { forwardRef, useRef, useState } from "react";

import styles from "./HeaderIconButton.module.css";

interface RippleState {
	phase: "alternate" | "primary";
	size: number;
	x: number;
	y: number;
}

type RipplePosition = Omit<RippleState, "phase">;

function mergeClassNames(...classNames: Array<string | undefined>) {
	return classNames.filter(Boolean).join(" ");
}

function createCenteredRipple(target: HTMLElement): RipplePosition {
	const { height, width } = target.getBoundingClientRect();
	return {
		size: Math.max(width, height) * 2,
		x: width / 2,
		y: height / 2,
	};
}

function createPointerRipple(
	event: PointerEvent<HTMLElement>,
	target: HTMLElement,
): RipplePosition {
	const rect = target.getBoundingClientRect();
	return {
		size: Math.max(rect.width, rect.height) * 2,
		x: event.clientX - rect.left,
		y: event.clientY - rect.top,
	};
}

function rippleStyle(ripple: RippleState): CSSProperties {
	return {
		"--header-icon-button-ripple-size": `${ripple.size}px`,
		"--header-icon-button-ripple-x": `${ripple.x}px`,
		"--header-icon-button-ripple-y": `${ripple.y}px`,
	} as CSSProperties;
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
		onKeyDown,
		onPointerDown,
		style,
		...buttonProps
	},
	ref,
) {
	const [ripple, setRipple] = useState<RippleState | null>(null);
	const ripplePhaseRef = useRef<RippleState["phase"]>("alternate");
	const isUnavailable = disabled === true || Boolean(loading);

	const showRipple = (nextRipple: RipplePosition) => {
		if (!isUnavailable) {
			ripplePhaseRef.current =
				ripplePhaseRef.current === "primary" ? "alternate" : "primary";
			setRipple({ ...nextRipple, phase: ripplePhaseRef.current });
		}
	};

	const handlePointerDown = (event: PointerEvent<HTMLElement>) => {
		onPointerDown?.(event);
		if (!event.defaultPrevented && event.button === 0) {
			showRipple(createPointerRipple(event, event.currentTarget));
		}
	};

	const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
		onKeyDown?.(event);
		if (!event.defaultPrevented && (event.key === "Enter" || event.key === " ")) {
			showRipple(createCenteredRipple(event.currentTarget));
		}
	};

	return (
		<Button
			{...buttonProps}
			className={mergeClassNames(styles.button, className)}
			{...(ripple ? { "data-rippling": "true" } : {})}
			{...(ripple ? { "data-ripple-phase": ripple.phase } : {})}
			{...(disabled === undefined ? {} : { disabled })}
			{...(loading === undefined ? {} : { loading })}
			onAnimationEnd={(event) => {
				onAnimationEnd?.(event);
				setRipple(null);
			}}
			onKeyDown={handleKeyDown}
			onPointerDown={handlePointerDown}
			ref={ref}
			style={ripple ? { ...style, ...rippleStyle(ripple) } : style}
		>
			{children}
		</Button>
	);
});
