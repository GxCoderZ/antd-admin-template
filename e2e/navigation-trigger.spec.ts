import { expect, test } from "@playwright/test";

for (const width of [1440, 768, 390]) {
	test(`导航按钮铺满顶栏且边缘可点击（${width}px）`, async ({ page }) => {
		await page.setViewportSize({ height: 900, width });
		await page.goto("/login");
		await page.locator('input[autocomplete="username"]').fill("admin");
		await page.locator('input[autocomplete="current-password"]').fill("admin");
		await page.locator('button[type="submit"]').click();
		await expect(page).toHaveURL(/\/dashboard$/);

		const header = page.getByRole("banner");
		const mobile = width === 390;
		const trigger = mobile
			? header.getByRole("button", { name: "打开菜单", exact: true })
			: page.getByTestId("admin-shell-sidebar-toggle");
		await expect(trigger).toBeVisible();
		const geometry = await trigger.evaluate((button) => {
			const header = button.closest("header");
			if (!header) throw new Error("Navigation trigger has no header");
			const buttonBox = button.getBoundingClientRect();
			const headerBox = header.getBoundingClientRect();
			return {
				leftGap: buttonBox.left - headerBox.left,
				topGap: buttonBox.top - headerBox.top,
				width: buttonBox.width,
				height: buttonBox.height,
				headerHeight: headerBox.height,
				headerContentHeight: header.clientHeight,
			};
		});
		expect(geometry.leftGap).toBe(0);
		expect(geometry.topGap).toBe(0);
		expect(geometry.width).toBe(geometry.headerHeight);
		expect(geometry.height).toBe(geometry.headerContentHeight);
		await expect(trigger).toHaveCSS("font-size", "16px");
		await trigger.focus();
		await trigger.press("Tab");
		await page.keyboard.press("Shift+Tab");
		await expect(trigger).toBeFocused();
		const focusOutline = await trigger.evaluate((button) => {
			const style = getComputedStyle(button);
			return {
				visible: button.matches(":focus-visible"),
				width: Number.parseFloat(style.outlineWidth),
				offset: Number.parseFloat(style.outlineOffset),
			};
		});
		expect(focusOutline.visible).toBe(true);
		expect(focusOutline.width).toBeGreaterThan(0);
		expect(focusOutline.width + focusOutline.offset).toBeLessThanOrEqual(0);
		await trigger.hover();
		await expect(trigger).toHaveCSS("box-shadow", "none");
		await expect(
			header.getByRole("button", {
				name: "搜索",
				exact: true,
			}),
		).toHaveCSS("height", width >= 768 ? "32px" : "28px");

		if (mobile) {
			await trigger.click({ position: { x: geometry.width / 2, y: 2 } });
			const drawer = page.getByRole("dialog");
			await expect(drawer).toBeVisible();
			await drawer
				.getByRole("menuitem", { name: "系统管理", exact: true })
				.click();
			await drawer
				.getByRole("menuitem", { name: "字典管理", exact: true })
				.click();
			await expect(page).toHaveURL(/\/system\/dictionaries$/);
			await expect(drawer).not.toBeVisible();
			await trigger.click({
				position: { x: geometry.width / 2, y: geometry.height - 2 },
			});
			await expect(drawer).toBeVisible();
			await drawer
				.getByRole("menuitem", { name: "仪表盘", exact: true })
				.click();
			await expect(page).toHaveURL(/\/dashboard$/);
			await expect(drawer).not.toBeVisible();
		} else {
			let collapsed = width === 768;
			for (const y of [2, geometry.height - 2]) {
				await trigger.click({ position: { x: geometry.width / 2, y } });
				collapsed = !collapsed;
				await expect(trigger).toHaveAccessibleName(
					collapsed ? "展开菜单" : "折叠菜单",
				);
				await expect(page.locator("aside")).toHaveCSS(
					"width",
					collapsed ? "80px" : "232px",
				);
			}
			await trigger.press("Space");
			await expect(trigger).toHaveAccessibleName(
				collapsed ? "折叠菜单" : "展开菜单",
			);
			await trigger.press("Enter");
			await expect(trigger).toHaveAccessibleName(
				collapsed ? "展开菜单" : "折叠菜单",
			);
		}

		expect(
			await page.evaluate(
				() => document.documentElement.scrollWidth <= window.innerWidth,
			),
		).toBe(true);
	});
}
