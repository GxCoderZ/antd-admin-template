import { useCallback, useRef, useState } from "react";

export interface PressRippleState {
	id: number;
	squareClip: boolean;
	state: "pressed" | "released";
	target: HTMLElement;
	size: number;
	x: number;
	y: number;
}

export function usePressRipple(disabled = false) {
	const [ripples, setRipples] = useState<PressRippleState[]>([]);
	const nextId = useRef(0);
	const showRipple = (
		target: HTMLElement,
		pointer?: { clientX: number; clientY: number },
		squareClip = false,
	) => {
		if (
			disabled ||
			window.matchMedia("(prefers-reduced-motion: reduce)").matches
		)
			return;
		const rect = target.getBoundingClientRect();
		const ripple: PressRippleState = {
			id: nextId.current++,
			squareClip,
			state: "pressed",
			target,
			size: Math.max(rect.width, rect.height) * 2,
			x: pointer ? pointer.clientX - rect.left : rect.width / 2,
			y: pointer ? pointer.clientY - rect.top : rect.height / 2,
		};
		setRipples((current) => [
			...current.map((item): PressRippleState =>
				item.state === "pressed" ? { ...item, state: "released" } : item,
			),
			ripple,
		]);
	};
	const releaseRipple = () => {
		setRipples((current) =>
			current.some((item) => item.state === "pressed")
				? current.map((item) =>
						item.state === "pressed"
							? { ...item, state: "released" as const }
							: item,
					)
				: current,
		);
	};
	const finishRipple = useCallback((id: number) => {
		setRipples((current) => current.filter((item) => item.id !== id));
	}, []);
	const latestRipple = ripples.at(-1);
	const rippleProps = latestRipple
		? {
				"data-rippling": "true",
				"data-ripple-state": latestRipple.state,
			}
		: undefined;

	return {
		ripples,
		activeRipple: ripples.find((item) => item.state === "pressed"),
		rippleProps,
		showRipple,
		releaseRipple,
		finishRipple,
	};
}
