import { expect, test, type Page } from "@playwright/test";

async function signIn(page: Page) {
	await page.goto("/login");
	await page.locator('input[autocomplete="username"]').fill("admin");
	await page.locator('input[autocomplete="current-password"]').fill("admin");
	await page.locator('button[type="submit"]').click();
	await expect(page).toHaveURL(/\/dashboard$/);
}

for (const width of [1440, 768, 390]) {
	test(`顶栏操作区使用 Pro 头像和按钮尺寸（${width}px）`, async ({ page }) => {
		await page.setViewportSize({ height: 900, width });
		await signIn(page);

		const header = page.getByRole("banner");
		const names = ["语言", "切换为深色模式", "通知"];
		for (const name of ["设置", "更多操作"]) {
			await expect(
				header.getByRole("button", { name, exact: true }),
			).toHaveCount(0);
		}
		for (const name of names) {
			const button = header.getByRole("button", { name, exact: true });
			await expect(button).toHaveCSS("height", "28px");
			await expect(button).toHaveCSS("width", "28px");
			await expect(button).toHaveCSS("font-size", "16px");
			await expect(button).toHaveCSS("padding", "6px");
		}
		const searchTrigger = header.getByRole("button", {
			name: "搜索",
			exact: true,
		});
		await expect(searchTrigger).toBeVisible();
		await expect(searchTrigger).toHaveCSS(
			"height",
			width >= 768 ? "32px" : "28px",
		);
		// Measure relative spacing in one frame while the shell is mounting.
		const centers = await header.getByRole("button").evaluateAll(
			(buttons, names) =>
				names.map((name) => {
					const button = buttons.find(
						(button) => button.getAttribute("aria-label") === name,
					);
					if (!button) throw new Error(`Missing header action: ${name}`);
					const box = button.getBoundingClientRect();
					return box.x + box.width / 2;
				}),
			names,
		);
		for (const [index, center] of centers.entries()) {
			const previous = centers[index - 1];
			if (previous !== undefined) expect(center - previous).toBe(32);
		}

		const account = header.getByRole("button", {
			name: "Platform Admin",
			exact: true,
		});
		await expect(account).toHaveCSS("height", "44px");
		await expect(account).toHaveCSS("padding", "8px");
		await expect(account.locator(".ant-avatar")).toHaveCSS("width", "28px");
		await expect(account.locator(".ant-avatar")).toHaveCSS("height", "28px");
		const centered = await account.evaluate((button) => {
			const header = button.closest("header");
			if (!header) throw new Error("Missing header");
			const rect = button.getBoundingClientRect();
			return (
				rect.y +
				rect.height / 2 -
				header.getBoundingClientRect().y -
				header.clientHeight / 2
			);
		});
		expect(centered).toBe(0);
		await account.hover();
		await expect(
			page.getByRole("menuitem", { name: "个人资料", exact: true }),
		).toBeVisible();
		await page.getByRole("menuitem", { name: "个人资料", exact: true }).click();
		await expect(page).toHaveURL(/\/account\/profile$/);
		expect(
			await page.evaluate(
				() => document.documentElement.scrollWidth <= innerWidth,
			),
		).toBe(true);
	});
}

for (const width of [1440, 390]) {
	test(`头像菜单打开偏好设置并保留语言和主题偏好（${width}px）`, async ({
		page,
	}) => {
		await page.setViewportSize({ height: 900, width });
		await signIn(page);
		const header = page.getByRole("banner");
		const account = header.getByRole("button", {
			name: "Platform Admin",
			exact: true,
		});
		await account.click();
		await expect(
			page.getByRole("menuitem", { name: "账号设置", exact: true }),
		).toBeVisible();
		await page.getByRole("menuitem", { name: "偏好设置", exact: true }).click();
		const drawer = page.getByRole("dialog", { name: "偏好设置", exact: true });
		await expect(drawer).toBeVisible();
		if (width === 390) await expect(drawer).toHaveCSS("width", "390px");
		await expect(page).toHaveURL(/\/dashboard$/);
		await drawer.getByRole("radio", { name: "深色模式", exact: true }).check();
		await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
		await drawer
			.getByRole("combobox", { name: "界面语言", exact: true })
			.click();
		await page.getByText("English", { exact: true }).click();
		await expect(page.locator("html")).toHaveAttribute("lang", "en");
		const preferences = page.getByRole("dialog", {
			name: "Preferences",
			exact: true,
		});
		await expect(preferences).toBeVisible();
		await expect(
			preferences.getByRole("radio", { name: "Dark mode", exact: true }),
		).toBeChecked();
		await preferences
			.getByRole("button", { name: "Close", exact: true })
			.click();
		await expect(preferences).not.toBeVisible();
		await header.getByRole("button", { name: "Search", exact: true }).click();
		const search = page.getByRole("dialog");
		await search.getByRole("textbox").fill("用户管理");
		await search.getByRole("menuitem", { name: "Users", exact: true }).click();
		await expect(page).toHaveURL(/\/organization\/users$/);
		await page.reload();
		const login = page.locator('input[autocomplete="username"]');
		await expect(header.or(login)).toBeVisible();
		// Production preview recreates its in-memory Fake login on document reload.
		if (await login.isVisible()) await signIn(page);
		await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
		await expect(page.locator("html")).toHaveAttribute("lang", "en");
		await account.click();
		await page
			.getByRole("menuitem", { name: "Preferences", exact: true })
			.click();
		await expect(
			preferences.getByRole("radio", { name: "Dark mode", exact: true }),
		).toBeChecked();
		await expect(
			preferences.getByRole("combobox", {
				name: "Display language",
				exact: true,
			}),
		).toBeVisible();
	});
}
