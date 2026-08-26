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
		expect(button).toHaveAttribute("data-ripple-phase", "primary");
		expect(button).toHaveStyle({
			"--header-icon-button-ripple-size": "64px",
			"--header-icon-button-ripple-x": "8px",
			"--header-icon-button-ripple-y": "10px",
		});
	});

	it("shows a centered keyboard ripple", () => {
		const button = renderButton();

		fireEvent.keyDown(button, { key: "Enter" });

		expect(button).toHaveAttribute("data-rippling", "true");
		expect(button).toHaveStyle({
			"--header-icon-button-ripple-x": "16px",
			"--header-icon-button-ripple-y": "16px",
		});
	});

	it("restarts the ripple when pressed repeatedly before animation ends", () => {
		const button = renderButton();

		fireEvent.pointerDown(button, { button: 0, clientX: 8, clientY: 10 });
		expect(button).toHaveAttribute("data-ripple-phase", "primary");

		fireEvent.pointerDown(button, { button: 0, clientX: 12, clientY: 14 });

		expect(button).toHaveAttribute("data-rippling", "true");
		expect(button).toHaveAttribute("data-ripple-phase", "alternate");
		expect(button).toHaveStyle({
			"--header-icon-button-ripple-x": "12px",
			"--header-icon-button-ripple-y": "14px",
		});
	});

	it("does not show a ripple when disabled", () => {
		const button = renderButton(true);

		fireEvent.pointerDown(button, { button: 0, clientX: 8, clientY: 10 });

		expect(button).not.toHaveAttribute("data-rippling");
	});
});
