import { expect, test, type Page } from "@playwright/test";

async function finishTransitions(page: Page) {
	await page.evaluate(async () => {
		await new Promise<void>((resolve) =>
			requestAnimationFrame(() => resolve()),
		);
		await Promise.allSettled(
			document
				.getAnimations()
				.filter(
					(animation) => animation.effect?.getTiming().iterations !== Infinity,
				)
				.map((animation) => animation.finished),
		);
	});
}

test("Pro-style preferences retain settings across layouts, themes and viewports", async ({
	page,
}, testInfo) => {
	test.setTimeout(60_000);
	const errors: string[] = [];
	page.on("pageerror", (error) => errors.push(error.message));
	page.on("console", (entry) => {
		if (entry.type() === "error") errors.push(entry.text());
	});
	page.on("requestfailed", (request) => {
		if (request.failure()?.errorText !== "net::ERR_ABORTED")
			errors.push(request.url());
	});
	page.on("response", (response) => {
		if (response.status() >= 400)
			errors.push(`${response.status()} ${response.url()}`);
	});
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto("/login");
	await page.locator('input[autocomplete="username"]').fill("admin");
	await page.locator('input[autocomplete="current-password"]').fill("admin");
	await page.locator('button[type="submit"]').click();
	await expect(page).toHaveURL(/\/dashboard$/);
	const account = page
		.getByRole("banner")
		.getByRole("button", { name: "Platform Admin", exact: true });
	const drawer = page.getByRole("dialog", { name: "偏好设置", exact: true });
	const timings = {
		open: [] as number[],
		resize: [] as number[],
		interaction: [] as number[],
	};

	for (const width of [1440, 768, 390, 1440]) {
		let started = performance.now();
		await page.setViewportSize({ width, height: 900 });
		await finishTransitions(page);
		timings.resize.push(performance.now() - started);
		await account.click();
		started = performance.now();
		await page.getByRole("menuitem", { name: "偏好设置", exact: true }).click();
		await expect(drawer).toBeVisible();
		await finishTransitions(page);
		timings.open.push(performance.now() - started);
		await page.screenshot({
			path: testInfo.outputPath(`preferences-light-${width}.png`),
			animations: "disabled",
		});
		await expect(drawer).toHaveCSS("width", `${width === 390 ? 390 : 300}px`);
		expect(
			await drawer.evaluate((node) => node.scrollWidth <= node.clientWidth),
		).toBe(true);
		expect(
			await page.evaluate(
				() => document.documentElement.scrollWidth <= innerWidth,
			),
		).toBe(true);
		const previews = drawer.getByRole("radiogroup", {
			name: "导航模式",
			exact: true,
		});
		await expect(
			drawer.getByRole("heading", { name: "外观", exact: true }),
		).toHaveCSS("font-size", "14px");
		await expect(
			drawer.getByRole("heading", { name: "外观", exact: true }),
		).toHaveCSS("line-height", "22px");
		await expect(previews).toHaveCSS("min-height", "42px");
		expect(
			await previews
				.locator('[data-preview="side"]')
				.evaluate((node) => getComputedStyle(node, "::before").backgroundColor),
		).toBe("rgb(0, 21, 41)");
		const sizes = await previews.locator("label").evaluateAll((labels) =>
			labels.map((label) => {
				const { width, height } = label.getBoundingClientRect();
				return { width, height };
			}),
		);
		expect(sizes).toEqual(
			Array.from({ length: 3 }, () => ({ width: 44, height: 36 })),
		);
		const swatch = drawer.getByRole("button", { name: "蓝", exact: true });
		await expect(swatch).toHaveCSS("width", "20px");
		await expect(swatch).toHaveCSS("height", "20px");
		await expect(swatch).toHaveCSS("border-radius", "2px");
		await expect(swatch).toHaveAttribute("aria-pressed", "true");
		await expect(
			drawer.getByRole("button", { name: "恢复默认设置" }),
		).toBeInViewport();

		started = performance.now();
		await drawer.getByRole("radio", { name: "深色模式", exact: true }).check();
		await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
		await finishTransitions(page);
		timings.interaction.push(performance.now() - started);
		await page.screenshot({
			path: testInfo.outputPath(`preferences-dark-${width}.png`),
			animations: "disabled",
		});
		await drawer.getByRole("radio", { name: "浅色模式", exact: true }).check();
		await drawer.getByRole("button", { name: "关闭", exact: true }).click();
		await expect(drawer).toBeHidden();
	}

	await account.click();
	await page.getByRole("menuitem", { name: "偏好设置", exact: true }).click();
	const themeChoices = drawer.getByRole("radiogroup", {
		name: "主题模式",
		exact: true,
	});
	await themeChoices
		.getByRole("radio", { name: "浅色模式", exact: true })
		.focus();
	await page.keyboard.press("ArrowRight");
	await expect(
		themeChoices.getByRole("radio", { name: "深色模式", exact: true }),
	).toBeChecked();
	await page.keyboard.press("ArrowRight");
	await expect(
		themeChoices.getByRole("radio", { name: "跟随系统", exact: true }),
	).toBeChecked();
	await page.emulateMedia({ colorScheme: "dark" });
	await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
	await page.emulateMedia({ colorScheme: "light" });
	await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
	await drawer
		.getByRole("radio", { name: "分栏双列菜单", exact: true })
		.check();
	await expect(
		page.getByTestId("admin-shell-two-column-sidebar"),
	).toBeVisible();
	await drawer.getByRole("radio", { name: "顶部菜单", exact: true }).check();
	await expect(
		drawer.getByRole("radiogroup", { name: "侧边菜单样式" }),
	).toHaveCount(0);
	await expect(page.getByTestId("admin-shell-top-navigation")).toBeVisible();
	await drawer.getByRole("radio", { name: "混合菜单", exact: true }).check();
	await expect(
		drawer.getByRole("radiogroup", { name: "侧边菜单样式" }).getByRole("radio"),
	).toHaveCount(2);
	await drawer.getByRole("radio", { name: "双列菜单", exact: true }).check();
	await drawer.getByRole("combobox", { name: "时区", exact: true }).fill("UTC");
	await drawer
		.getByRole("combobox", { name: "时区", exact: true })
		.press("Enter");
	await drawer.getByRole("combobox", { name: "界面语言", exact: true }).click();
	await page.getByText("English", { exact: true }).click();
	const english = page.getByRole("dialog", {
		name: "Preferences",
		exact: true,
	});
	await expect(english).toBeVisible();
	await page.screenshot({
		path: testInfo.outputPath("preferences-english.png"),
		animations: "disabled",
	});
	await english.getByRole("button", { name: "Close", exact: true }).click();
	await page
		.getByRole("banner")
		.getByRole("button", { name: "Search", exact: true })
		.click();
	const search = page.getByRole("dialog", { name: "Navigation search" });
	await search.getByRole("textbox").fill("Users");
	await search.getByRole("textbox").press("Enter");
	await expect(page).toHaveURL(/\/organization\/users$/);
	await account.click();
	await page
		.getByRole("menuitem", { name: "Preferences", exact: true })
		.click();
	await expect(
		english.getByRole("radio", { name: "Follow system", exact: true }),
	).toBeChecked();
	await expect(english.getByText("UTC", { exact: true })).toBeVisible();
	await english
		.getByRole("button", { name: "Restore defaults", exact: true })
		.click();
	await page.getByRole("button", { name: "Restore", exact: true }).click();
	await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
	await expect(
		drawer.getByRole("radio", { name: "浅色模式", exact: true }),
	).toBeChecked();
	await expect(
		drawer.getByRole("radio", { name: "侧边菜单", exact: true }),
	).toBeChecked();

	const percentile = (values: number[], ratio: number) =>
		[...values].sort((a, b) => a - b)[Math.ceil(values.length * ratio) - 1];
	const report = Object.fromEntries(
		Object.entries(timings).map(([name, samples]) => [
			name,
			{
				samples,
				p50: percentile(samples, 0.5),
				p95: percentile(samples, 0.95),
			},
		]),
	);
	await testInfo.attach("preferences-metrics", {
		body: JSON.stringify(report, null, 2),
		contentType: "application/json",
	});
	expect(errors).toEqual([]);
	expect(Math.max(...timings.open)).toBeLessThan(5000);
	expect(report.open?.p50).toBeLessThan(1500);
	expect(report.open?.p95).toBeLessThan(3000);
	expect(Math.max(...timings.resize)).toBeLessThan(800);
	expect(report.resize?.p95).toBeLessThan(700);
	expect(Math.max(...timings.interaction)).toBeLessThan(1000);
	expect(report.interaction?.p95).toBeLessThan(800);
});
