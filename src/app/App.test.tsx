import {
	act,
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { Button } from "antd";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import * as accountApi from "#src/api/account";
import * as authApi from "#src/api/auth";
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
	AdminShellPage: ({ currentUsername }: { currentUsername: string }) => (
		<header>{currentUsername}</header>
	),
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
	vi.restoreAllMocks();
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

describe("App deployment base path", () => {
	it("renders routes below the configured Vite base URL", async () => {
		window.history.replaceState(null, "", "/antd-admin-template/login");

		render(<App basename="/antd-admin-template/" />);

		await waitFor(() => {
			expect(screen.getByRole("button", { name: "Toggle theme" })).toBeVisible();
		});
		expect(window.location.pathname).toBe("/antd-admin-template/login");
		fireEvent.click(screen.getByRole("button", { name: "Toggle theme" }));
		expect(screen.getByLabelText("Resolved theme")).toHaveTextContent("dark");
	});
});

describe("App header identity", () => {
	beforeEach(() => {
		window.history.replaceState(null, "", "/dashboard");
		vi.spyOn(authApi, "getPlatformSession").mockResolvedValue({
			permissions: [],
			user: { id: "preview-admin", username: "admin", email: "" },
		});
	});

	it.each([
		["Platform Admin", "Platform Admin"],
		["", "admin"],
	])(
		"waits for account identity before rendering the header (%s)",
		async (displayName, expectedName) => {
			let resolveAccount!: (account: accountApi.PlatformAccount) => void;
			const pendingAccount = new Promise<accountApi.PlatformAccount>(
				(resolve) => {
					resolveAccount = resolve;
				},
			);
			const getAccount = vi
				.spyOn(accountApi, "getPlatformAccount")
				.mockReturnValue(pendingAccount);
			render(<App />);
			await waitFor(() => expect(getAccount).toHaveBeenCalled());
			expect(screen.queryByRole("banner")).not.toBeInTheDocument();

			await act(async () => {
				resolveAccount({
					address: "",
					bio: "",
					city: "",
					country: "",
					createdAt: "2026-08-28T00:00:00Z",
					displayName,
					email: "",
					id: "preview-admin",
					phoneAreaCode: "",
					phoneNumber: "",
					province: "",
					roles: [],
					username: "admin",
				});
				await pendingAccount;
			});
			expect(await screen.findByRole("banner")).toHaveTextContent(expectedName);
		},
	);

	it("shows the existing error page when account identity cannot load", async () => {
		vi.spyOn(accountApi, "getPlatformAccount").mockRejectedValue(
			new Error("Preview account unavailable"),
		);
		render(<App />);
		expect(await screen.findByText("500", { exact: true })).toBeVisible();
		expect(screen.queryByRole("banner")).not.toBeInTheDocument();
	});
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
