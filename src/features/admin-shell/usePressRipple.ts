import type { AnimationEvent, CSSProperties } from "react";
import { useRef, useState } from "react";

import styles from "./PressRipple.module.css";

interface RippleState {
	phase: "alternate" | "primary";
	squareClip: boolean;
	state: "pressed" | "released";
	target: HTMLElement;
	size: number;
	x: number;
	y: number;
}

export function usePressRipple(disabled = false) {
	const [ripple, setRipple] = useState<RippleState | null>(null);
	const phase = useRef<RippleState["phase"]>("alternate");
	const showRipple = (
		target: HTMLElement,
		pointer?: { clientX: number; clientY: number },
		squareClip = false,
	) => {
		if (disabled) return;
		const rect = target.getBoundingClientRect();
		phase.current = phase.current === "primary" ? "alternate" : "primary";
		setRipple({
			phase: phase.current,
			squareClip,
			state: "pressed",
			target,
			size: Math.max(rect.width, rect.height) * 2,
			x: pointer ? pointer.clientX - rect.left : rect.width / 2,
			y: pointer ? pointer.clientY - rect.top : rect.height / 2,
		});
	};
	const releaseRipple = () => {
		setRipple((current) =>
			current?.state === "pressed"
				? { ...current, state: "released" }
				: current,
		);
	};
	const finishRipple = (event: AnimationEvent<HTMLElement>) => {
		if (
			event.target === event.currentTarget &&
			event.animationName === styles.rippleFadeOut
		) {
			setRipple((current) => (current?.state === "released" ? null : current));
		}
	};
	const rippleProps = ripple
		? {
				"data-rippling": "true",
				"data-ripple-phase": ripple.phase,
				"data-ripple-state": ripple.state,
				style: {
					"--press-ripple-size": `${ripple.size}px`,
					"--press-ripple-x": `${ripple.x}px`,
					"--press-ripple-y": `${ripple.y}px`,
				} as CSSProperties,
			}
		: undefined;

	return { ripple, rippleProps, showRipple, releaseRipple, finishRipple };
}
