import { SearchOutlined } from "@ant-design/icons";
import { fireEvent, render, screen } from "@testing-library/react";
import { ConfigProvider } from "antd";
import { afterEach, describe, expect, it, vi } from "vitest";

import { HeaderIconButton } from "./HeaderIconButton";
import styles from "./PressRipple.module.css";

afterEach(() => vi.restoreAllMocks());

function renderButton(disabled = false) {
	render(
		<ConfigProvider>
			<HeaderIconButton
				aria-label="搜索"
				disabled={disabled}
				icon={<SearchOutlined aria-hidden />}
				type="text"
			/>
		</ConfigProvider>,
	);

	const button = screen.getByRole("button", { name: "搜索" });
	Object.defineProperty(button, "getBoundingClientRect", {
		configurable: true,
		value: () => ({
			bottom: 32,
			height: 32,
			left: 0,
			right: 32,
			top: 0,
			width: 32,
			x: 0,
			y: 0,
			toJSON: () => undefined,
		}),
	});
	return button;
}

function finishFade(layer: HTMLElement) {
	// jsdom has no AnimationEvent constructor, so React registers the WebKit event.
	const event = new Event("webkitAnimationEnd", { bubbles: true });
	Object.defineProperty(event, "animationName", {
		value: styles.rippleFadeOut,
	});
	fireEvent(layer, event);
}

describe("HeaderIconButton", () => {
	it("keeps successive ripples visible at their own press positions", () => {
		const button = renderButton();
		fireEvent.pointerDown(button, { button: 0, clientX: 8, clientY: 10 });
		fireEvent.pointerUp(button);
		fireEvent.pointerDown(button, { button: 0, clientX: 24, clientY: 20 });
		const ripples = button.querySelectorAll("[data-ripple-id]");
		expect(ripples).toHaveLength(2);
		expect(ripples[0]).toHaveAttribute("data-ripple-state", "released");
		expect(ripples[0]).toHaveStyle({
			"--press-ripple-x": "8px",
			"--press-ripple-y": "10px",
		});
		expect(ripples[1]).toHaveAttribute("data-ripple-state", "pressed");
		expect(ripples[1]).toHaveStyle({
			"--press-ripple-x": "24px",
			"--press-ripple-y": "20px",
		});
	});

	it("finishes an older ripple without removing the next held ripple", () => {
		const button = renderButton();
		fireEvent.pointerDown(button, { button: 0 });
		fireEvent.pointerUp(button);
		fireEvent.pointerDown(button, { button: 0 });
		const ripples = button.querySelectorAll("[data-ripple-id]");
		expect(ripples).toHaveLength(2);
		const firstLayer = ripples[0]?.parentElement;
		const secondLayer = ripples[1]?.parentElement;
		if (!firstLayer || !secondLayer) throw new Error("Missing ripple layers");
		finishFade(firstLayer);
		expect(ripples[0]).not.toBeInTheDocument();
		expect(ripples[1]).toBeInTheDocument();
		expect(ripples[1]).toHaveAttribute("data-ripple-state", "pressed");
		fireEvent.pointerUp(button);
		finishFade(secondLayer);
		expect(button.querySelectorAll("[data-ripple-id]")).toHaveLength(0);
		expect(button).not.toHaveAttribute("data-rippling");
	});

	it("shows a pointer ripple from the pressed position", () => {
		const button = renderButton();

		fireEvent.pointerDown(button, { button: 0, clientX: 8, clientY: 10 });

		expect(button).toHaveAttribute("data-rippling", "true");
		expect(button).toHaveAttribute("data-ripple-state", "pressed");
		expect(button.querySelector("[data-ripple-id]")).toHaveStyle({
			"--press-ripple-size": "64px",
			"--press-ripple-x": "8px",
			"--press-ripple-y": "10px",
		});

		fireEvent.pointerUp(button);
		expect(button).toHaveAttribute("data-rippling", "true");
		expect(button).toHaveAttribute("data-ripple-state", "released");
	});

	it("shows a centered keyboard ripple", () => {
		const button = renderButton();

		fireEvent.keyDown(button, { key: "Enter" });

		expect(button).toHaveAttribute("data-rippling", "true");
		expect(button.querySelector("[data-ripple-id]")).toHaveStyle({
			"--press-ripple-x": "16px",
			"--press-ripple-y": "16px",
		});

		fireEvent.keyUp(button, { key: "Enter" });
		expect(button).toHaveAttribute("data-rippling", "true");
		expect(button).toHaveAttribute("data-ripple-state", "released");
	});

	it("keeps the ripple held across repeated keyboard events", () => {
		const button = renderButton();
		fireEvent.keyDown(button, { key: "Enter" });
		fireEvent.keyDown(button, { key: "Enter", repeat: true });
		expect(button.querySelectorAll("[data-ripple-id]")).toHaveLength(1);
		expect(button).toHaveAttribute("data-ripple-state", "pressed");
		fireEvent.keyUp(button, { key: "Enter" });
		fireEvent.keyDown(button, { key: "Enter" });
		expect(button.querySelectorAll("[data-ripple-id]")).toHaveLength(2);
		expect(button).toHaveAttribute("data-ripple-state", "pressed");
	});

	it.each(["pointerCancel", "pointerLeave", "blur"] as const)(
		"releases the held ripple on %s",
		(event) => {
			const button = renderButton();
			fireEvent.pointerDown(button, { button: 0, clientX: 8, clientY: 10 });
			fireEvent[event](button);
			expect(button).toHaveAttribute("data-ripple-state", "released");
		},
	);

	it("cleans up a ripple when hiding its host cancels the animation", () => {
		const button = renderButton();
		fireEvent.pointerDown(button, { button: 0, clientX: 8, clientY: 10 });
		const ripple = button.querySelector("[data-ripple-id]");
		if (!ripple) throw new Error("Missing ripple");
		fireEvent(ripple, new Event("animationcancel", { bubbles: true }));
		expect(button.querySelectorAll("[data-ripple-id]")).toHaveLength(0);
		expect(button).not.toHaveAttribute("data-rippling");
	});

	it("does not accumulate waves when reduced motion is requested", () => {
		const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
		vi.spyOn(window, "matchMedia").mockImplementation((query) => ({
			...mediaQuery,
			media: query,
			matches: query === "(prefers-reduced-motion: reduce)",
		}));
		const button = renderButton();
		for (let press = 0; press < 20; press += 1) {
			fireEvent.pointerDown(button, { button: 0 });
			fireEvent.pointerUp(button);
		}
		expect(button.querySelectorAll("[data-ripple-id]")).toHaveLength(0);
		expect(button).not.toHaveAttribute("data-rippling");
	});

	it("does not show a ripple when disabled", () => {
		const button = renderButton(true);

		fireEvent.pointerDown(button, { button: 0, clientX: 8, clientY: 10 });

		expect(button).not.toHaveAttribute("data-rippling");
	});
});
