import { type CSSProperties, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

import styles from "./PressRipple.module.css";
import type { PressRippleState } from "./usePressRipple";

interface PressRippleProps {
	ripples: readonly PressRippleState[];
	onFinish: (id: number) => void;
}

function RippleLayer({
	ripple,
	onFinish,
}: { ripple: PressRippleState } & Pick<PressRippleProps, "onFinish">) {
	const layerRef = useRef<HTMLSpanElement>(null);
	useEffect(() => {
		const layer = layerRef.current;
		if (!layer) return;
		// Hiding a submenu cancels its animations instead of firing animationend.
		const finishCancelledRipple = () => onFinish(ripple.id);
		layer.addEventListener("animationcancel", finishCancelledRipple);
		return () =>
			layer.removeEventListener("animationcancel", finishCancelledRipple);
	}, [onFinish, ripple.id]);

	return createPortal(
		<span
			aria-hidden
			className={`${styles.layer}${ripple.squareClip ? ` ${styles.squareLayer}` : ""}`}
			data-ripple-state={ripple.state}
			onAnimationEnd={(event) => {
				if (
					event.target === event.currentTarget &&
					event.animationName === styles.rippleFadeOut
				)
					onFinish(ripple.id);
			}}
			ref={layerRef}
		>
			<span
				className={styles.ripple}
				data-rippling="true"
				data-ripple-id={ripple.id}
				data-ripple-state={ripple.state}
				style={
					{
						"--press-ripple-size": `${ripple.size}px`,
						"--press-ripple-x": `${ripple.x}px`,
						"--press-ripple-y": `${ripple.y}px`,
					} as CSSProperties
				}
			/>
		</span>,
		ripple.target,
	);
}

// Like MUI TouchRipple, exiting waves stay mounted while subsequent waves enter.
export function PressRipple({ ripples, onFinish }: PressRippleProps) {
	return ripples.map((ripple) => (
		<RippleLayer key={ripple.id} ripple={ripple} onFinish={onFinish} />
	));
}
