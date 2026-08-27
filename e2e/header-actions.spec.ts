import { expect, test } from "@playwright/test";

for (const width of [1440, 768, 390]) {
	test(`顶栏操作区使用 Pro 头像和按钮尺寸（${width}px）`, async ({ page }) => {
		await page.setViewportSize({ height: 900, width });
		await page.goto("/login");
		await page.locator('input[autocomplete="username"]').fill("admin");
		await page.locator('input[autocomplete="current-password"]').fill("admin");
		await page.locator('button[type="submit"]').click();
		await expect(page).toHaveURL(/\/dashboard$/);

		const header = page.getByRole("banner");
		const names =
			width === 390
				? ["更多操作", "通知"]
				: ["搜索", "切换语言", "主题模式", "设置", "通知"];
		for (const name of names) {
			const button = header.getByRole("button", { name, exact: true });
			await expect(button).toHaveCSS("height", "28px");
			await expect(button).toHaveCSS("width", "28px");
			await expect(button).toHaveCSS("font-size", "16px");
			await expect(button).toHaveCSS("padding", "6px");
		}
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
