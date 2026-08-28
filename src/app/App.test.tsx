import {
	act,
	cleanup,
	fireEvent,
	render,
	screen,
} from "@testing-library/react";
import { Button } from "antd";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { i18n } from "../i18n";
import { App } from "./App";
import {
	clearStoredPreferences,
	readThemeModePreference,
	writeThemeModePreference,
} from "./preferenceStorage";
import { useThemeMode } from "./themeMode";

vi.mock("./PlatformBrand", () => ({
	PlatformBrandProvider: ({ children }: { children: ReactNode }) => children,
}));

vi.mock("../features/auth/login/LoginPage", () => ({
	LoginPage: () => <ThemeControls />,
}));

vi.mock("../features/admin-shell/AdminShellPage", () => ({
	AdminShellPage: () => null,
}));

function ThemeControls() {
	const { isDarkMode, onChangeThemeMode, themeMode } = useThemeMode();

	return (
		<>
			<Button onClick={() => onChangeThemeMode(isDarkMode ? "light" : "dark")}>
				Toggle theme
			</Button>
			<output aria-label="Theme preference">{themeMode}</output>
			<output aria-label="Resolved theme">
				{isDarkMode ? "dark" : "light"}
			</output>
		</>
	);
}

const originalTransition = Object.getOwnPropertyDescriptor(
	document,
	"startViewTransition",
);
const originalAnimate = Object.getOwnPropertyDescriptor(
	document.documentElement,
	"animate",
);
let pendingThemeUpdates: (() => void)[];

beforeEach(async () => {
	clearStoredPreferences();
	window.history.replaceState(null, "", "/login");
	await i18n.changeLanguage("en");
	pendingThemeUpdates = [];
	// A snapshot may defer its update callback while another transition is active.
	Object.defineProperty(document, "startViewTransition", {
		configurable: true,
		value: (update: () => void) => {
			pendingThemeUpdates.push(update);
			return { ready: new Promise<void>(() => {}), skipTransition: vi.fn() };
		},
	});
	Object.defineProperty(document.documentElement, "animate", {
		configurable: true,
		value: vi.fn(),
	});
});

afterEach(() => {
	cleanup();
	if (originalTransition) {
		Object.defineProperty(document, "startViewTransition", originalTransition);
	} else {
		Reflect.deleteProperty(document, "startViewTransition");
	}
	if (originalAnimate) {
		Object.defineProperty(document.documentElement, "animate", originalAnimate);
	} else {
		Reflect.deleteProperty(document.documentElement, "animate");
	}
	clearStoredPreferences();
});

describe("App theme switching", () => {
	it("applies every rapid toggle without waiting for a page snapshot", async () => {
		render(<App />);
		await screen.findByRole("button", { name: "Toggle theme" });

		for (let click = 0; click < 21; click += 1) {
			const nextMode = click % 2 === 0 ? "dark" : "light";
			fireEvent.click(screen.getByRole("button", { name: "Toggle theme" }));
			expect(screen.getByLabelText("Theme preference")).toHaveTextContent(
				nextMode,
			);
			expect(screen.getByLabelText("Resolved theme")).toHaveTextContent(
				nextMode,
			);
			expect(document.documentElement).toHaveAttribute("data-theme", nextMode);
			expect(readThemeModePreference()).toBe(nextMode);
		}

		act(() => pendingThemeUpdates.forEach((update) => update()));
		expect(screen.getByLabelText("Resolved theme")).toHaveTextContent("dark");
	});

	it("restores the saved mode and switches when View Transitions are unavailable", async () => {
		Reflect.deleteProperty(document, "startViewTransition");
		writeThemeModePreference("dark");
		const firstRender = render(<App />);
		await screen.findByRole("button", { name: "Toggle theme" });
		expect(screen.getByLabelText("Resolved theme")).toHaveTextContent("dark");
		fireEvent.click(screen.getByRole("button", { name: "Toggle theme" }));
		expect(readThemeModePreference()).toBe("light");
		expect(screen.getByLabelText("Resolved theme")).toHaveTextContent("light");
		firstRender.unmount();
		render(<App />);
		expect(await screen.findByLabelText("Theme preference")).toHaveTextContent(
			"light",
		);
		expect(screen.getByLabelText("Resolved theme")).toHaveTextContent("light");
	});
});
