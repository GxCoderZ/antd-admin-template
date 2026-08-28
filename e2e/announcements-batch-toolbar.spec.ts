import { expect, test } from "@playwright/test";

for (const width of [1440, 768, 390]) {
	test(`公告批量栏跟随内容区且支持批量发布（${width}px）`, async ({
		page,
	}, testInfo) => {
		await page.setViewportSize({ height: 900, width });
		await page.goto("/login");
		await page.locator('input[autocomplete="username"]').fill("admin");
		await page.locator('input[autocomplete="current-password"]').fill("admin");
		await page.locator('button[type="submit"]').click();
		await expect(page).toHaveURL(/\/dashboard$/);
		await page.goto("/system/announcements");
		await page.getByRole("checkbox").nth(1).check();
		const toolbar = page.getByTestId("admin-announcements-batch-toolbar");
		await expect(toolbar).toBeVisible();

		const expectAligned = async () => {
			await expect(async () => {
				const box = await toolbar.boundingBox();
				const headerBox = await page.getByRole("banner").boundingBox();
				if (!box || !headerBox) throw new Error("Batch toolbar is missing");
				expect(Math.abs(box.x - headerBox.x)).toBeLessThanOrEqual(1);
				expect(Math.abs(box.x + box.width - width)).toBeLessThanOrEqual(1);
				expect(Math.abs(box.y + box.height - 900)).toBeLessThanOrEqual(1);
			}).toPass();
		};

		await expectAligned();
		if (width >= 768) {
			await page.getByTestId("admin-shell-sidebar-toggle").click();
			await expectAligned();
			await page.getByTestId("admin-shell-sidebar-toggle").click();
			await expectAligned();
		}
		await toolbar
			.getByRole("button", { name: "批量发布", exact: true })
			.scrollIntoViewIfNeeded();
		await page.screenshot({
			path: testInfo.outputPath(`announcement-batch-${width}.png`),
			animations: "disabled",
		});
		expect(
			await page.evaluate(
				() => document.documentElement.scrollWidth <= window.innerWidth,
			),
		).toBe(true);
		await toolbar
			.getByRole("button", { name: "批量发布", exact: true })
			.click();
		await expect(toolbar).not.toBeVisible();
		await expect(page.getByRole("checkbox").nth(1)).not.toBeChecked();
	});
}
