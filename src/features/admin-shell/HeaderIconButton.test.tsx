import { SearchOutlined } from "@ant-design/icons";
import { fireEvent, render, screen } from "@testing-library/react";
import { ConfigProvider } from "antd";
import { describe, expect, it } from "vitest";

import { HeaderIconButton } from "./HeaderIconButton";

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

describe("HeaderIconButton", () => {
	it("shows a pointer ripple from the pressed position", () => {
		const button = renderButton();

		fireEvent.pointerDown(button, { button: 0, clientX: 8, clientY: 10 });

		expect(button).toHaveAttribute("data-rippling", "true");
		expect(button).toHaveAttribute("data-ripple-state", "pressed");
		expect(button).toHaveAttribute("data-ripple-phase", "primary");
		expect(button).toHaveStyle({
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
		expect(button).toHaveStyle({
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
		expect(button).toHaveAttribute("data-ripple-phase", "primary");
		expect(button).toHaveAttribute("data-ripple-state", "pressed");
		fireEvent.keyUp(button, { key: "Enter" });
		fireEvent.keyDown(button, { key: "Enter" });
		expect(button).toHaveAttribute("data-ripple-phase", "alternate");
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

	it("restarts the ripple when pressed repeatedly before animation ends", () => {
		const button = renderButton();

		fireEvent.pointerDown(button, { button: 0, clientX: 8, clientY: 10 });
		expect(button).toHaveAttribute("data-ripple-phase", "primary");
		fireEvent.pointerUp(button);
		expect(button).toHaveAttribute("data-ripple-state", "released");

		fireEvent.pointerDown(button, { button: 0, clientX: 12, clientY: 14 });

		expect(button).toHaveAttribute("data-rippling", "true");
		expect(button).toHaveAttribute("data-ripple-state", "pressed");
		expect(button).toHaveAttribute("data-ripple-phase", "alternate");
		expect(button).toHaveStyle({
			"--press-ripple-x": "12px",
			"--press-ripple-y": "14px",
		});
	});

	it("does not show a ripple when disabled", () => {
		const button = renderButton(true);

		fireEvent.pointerDown(button, { button: 0, clientX: 8, clientY: 10 });

		expect(button).not.toHaveAttribute("data-rippling");
	});
});
