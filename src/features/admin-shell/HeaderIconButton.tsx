import { Button, type ButtonProps } from "antd";
import type {
	CSSProperties,
	FocusEvent,
	KeyboardEvent,
	PointerEvent,
} from "react";
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
	const [pressed, setPressed] = useState(false);
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
			setPressed(true);
			showRipple(createPointerRipple(event, event.currentTarget));
		}
	};

	const handlePointerRelease = (event: PointerEvent<HTMLElement>) => {
		onPointerUp?.(event);
		setPressed(false);
	};

	const handlePointerCancel = (event: PointerEvent<HTMLElement>) => {
		onPointerCancel?.(event);
		setPressed(false);
	};

	const handlePointerLeave = (event: PointerEvent<HTMLElement>) => {
		onPointerLeave?.(event);
		setPressed(false);
	};

	const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
		onKeyDown?.(event);
		if (!event.defaultPrevented && (event.key === "Enter" || event.key === " ")) {
			setPressed(true);
			showRipple(createCenteredRipple(event.currentTarget));
		}
	};

	const handleKeyUp = (event: KeyboardEvent<HTMLElement>) => {
		onKeyUp?.(event);
		if (event.key === "Enter" || event.key === " ") {
			setPressed(false);
		}
	};

	const handleBlur = (event: FocusEvent<HTMLElement>) => {
		onBlur?.(event);
		setPressed(false);
	};

	return (
		<Button
			{...buttonProps}
			className={mergeClassNames(styles.button, className)}
			{...(pressed ? { "data-pressed": "true" } : {})}
			{...(ripple ? { "data-rippling": "true" } : {})}
			{...(ripple ? { "data-ripple-phase": ripple.phase } : {})}
			{...(disabled === undefined ? {} : { disabled })}
			{...(loading === undefined ? {} : { loading })}
			onAnimationEnd={(event) => {
				onAnimationEnd?.(event);
				setRipple(null);
			}}
			onBlur={handleBlur}
			onKeyDown={handleKeyDown}
			onKeyUp={handleKeyUp}
			onPointerCancel={handlePointerCancel}
			onPointerDown={handlePointerDown}
			onPointerLeave={handlePointerLeave}
			onPointerUp={handlePointerRelease}
			ref={ref}
			style={ripple ? { ...style, ...rippleStyle(ripple) } : style}
		>
			{children}
		</Button>
	);
});
