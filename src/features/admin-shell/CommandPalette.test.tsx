import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfigProvider } from "antd";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { writeNavigationSearchHistory } from "../../app/preferenceStorage";
import { i18n } from "../../i18n";
import { CommandPalette } from "./CommandPalette";

const items = [
	{ key: "/users", label: "用户管理", searchTerms: ["用户管理", "Users"] },
	{ key: "/roles", label: "角色管理", searchTerms: ["角色管理", "Roles"] },
];

function renderPalette() {
	const onNavigate = vi.fn();
	function Harness() {
		const [open, setOpen] = useState(true);
		// JSDOM does not run CSS keyframes; animated opening is covered in Playwright.
		return (
			<ConfigProvider theme={{ token: { motion: false } }}>
				<CommandPalette
					historyScope="palette-test"
					items={items}
					onNavigate={onNavigate}
					onOpenChange={setOpen}
					open={open}
				/>
			</ConfigProvider>
		);
	}
	render(<Harness />);
	return { user: userEvent.setup(), onNavigate };
}

beforeEach(async () => {
	Element.prototype.scrollIntoView = vi.fn();
	await i18n.changeLanguage("zh-CN");
	writeNavigationSearchHistory("palette-test", []);
});

describe("CommandPalette", () => {
	it("searches authorized routes with the keyboard and restores recent destinations", async () => {
		const { user, onNavigate } = renderPalette();
		await waitFor(() => expect(screen.getByText("暂无最近访问")).toBeVisible());
		await user.type(screen.getByRole("textbox"), "管理");
		await user.keyboard("{ArrowDown}{Enter}");
		expect(onNavigate).toHaveBeenCalledWith("/roles");
		await waitFor(() =>
			expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
		);
		await user.keyboard("{Control>}k{/Control}");
		await waitFor(() =>
			expect(screen.getByRole("menuitem", { name: /角色管理/ })).toBeVisible(),
		);
		expect(
			screen.queryByRole("menuitem", { name: /用户管理/ }),
		).not.toBeInTheDocument();
	});

	it("removes history without navigating and filters routes no longer permitted", async () => {
		writeNavigationSearchHistory("palette-test", ["/forbidden", "/users"]);
		const { user, onNavigate } = renderPalette();
		expect(screen.queryByText("/forbidden")).not.toBeInTheDocument();
		await user.click(
			screen.getByRole("button", { name: "移除最近访问：用户管理" }),
		);
		await waitFor(() => expect(screen.getByText("暂无最近访问")).toBeVisible());
		expect(onNavigate).not.toHaveBeenCalled();
	});

	it("removes recent destinations with the keyboard without opening their route", async () => {
		writeNavigationSearchHistory("palette-test", ["/users"]);
		const { user, onNavigate } = renderPalette();
		const remove = screen.getByRole("button", {
			name: "移除最近访问：用户管理",
		});
		remove.focus();
		await user.keyboard("{Enter}");
		expect(onNavigate).not.toHaveBeenCalled();
		await waitFor(() => expect(screen.getByText("暂无最近访问")).toBeVisible());
	});
});
