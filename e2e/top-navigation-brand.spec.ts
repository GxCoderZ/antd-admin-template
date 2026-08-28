import { expect, test } from "@playwright/test";

test("顶部导航完整显示品牌并在宽窄屏切换后恢复", async ({ page }, testInfo) => {
	const errors: string[] = [];
	const timings = {
		open: [] as number[],
		resize: [] as number[],
		interaction: [] as number[],
	};
	page.on("pageerror", (error) => errors.push(error.message));
	page.on("console", (message) => {
		if (message.type() === "error") errors.push(message.text());
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
	let started = performance.now();
	await page.goto("/login");
	await expect(page.locator('input[autocomplete="username"]')).toBeVisible();
	timings.open.push(performance.now() - started);
	await page.locator('input[autocomplete="username"]').fill("admin");
	await page.locator('input[autocomplete="current-password"]').fill("admin");
	started = performance.now();
	await page.locator('button[type="submit"]').click();
	await expect(page).toHaveURL(/\/dashboard$/);
	const header = page.getByRole("banner");
	await expect(header).toBeVisible();
	timings.open.push(performance.now() - started);
	await header
		.getByRole("button", { name: "Platform Admin", exact: true })
		.click();
	await page.getByRole("menuitem", { name: "偏好设置", exact: true }).click();
	const preferences = page.getByRole("dialog", {
		name: "偏好设置",
		exact: true,
	});
	const brand = header.getByRole("link", { name: "仪表盘", exact: true });
	const title = brand.getByRole("heading", {
		name: "React Antd Admin",
		exact: true,
	});
	started = performance.now();
	await preferences
		.getByRole("radio", { name: "顶部菜单", exact: true })
		.check();
	await expect(title).toBeVisible();
	timings.interaction.push(performance.now() - started);
	await preferences.getByRole("button", { name: "关闭", exact: true }).click();
	await expect(preferences).toBeHidden();

	for (const width of [1440, 1024, 768, 390, 1440]) {
		started = performance.now();
		await page.setViewportSize({ width, height: 900 });
		if (width >= 992) {
			await expect(title).toBeVisible();
			await expect(brand).toHaveText("React Antd Admin");
			await expect(
				page.getByTestId("admin-shell-top-navigation"),
			).toBeVisible();
		} else {
			await expect(page.getByTestId("admin-shell-top-navigation")).toHaveCount(
				0,
			);
			await expect(
				header.getByRole("button", {
					name: width === 390 ? "打开菜单" : "展开菜单",
					exact: true,
				}),
			).toBeVisible();
		}
		await page.getByRole("tooltip").evaluateAll(async (tooltips) => {
			await new Promise(requestAnimationFrame);
			await Promise.allSettled(
				tooltips
					.flatMap((tooltip) => tooltip.getAnimations({ subtree: true }))
					.map((animation) => animation.finished),
			);
		});
		timings.resize.push(performance.now() - started);
		const layout = await page.evaluate(() => ({
			viewport: innerWidth,
			content: document.documentElement.scrollWidth,
		}));
		expect(layout.content, JSON.stringify(layout)).toBeLessThanOrEqual(
			layout.viewport,
		);
		const buttons = await header.getByRole("button").evaluateAll((elements) =>
			elements.map((element) => {
				const box = element.getBoundingClientRect();
				return (
					box.left >= 0 &&
					box.right <= innerWidth &&
					element.contains(
						document.elementFromPoint(
							box.x + box.width / 2,
							box.y + box.height / 2,
						),
					)
				);
			}),
		);
		expect(buttons.every(Boolean)).toBe(true);
		if (width >= 992) {
			const geometry = await title.evaluate((element) => {
				const box = element.getBoundingClientRect();
				const style = getComputedStyle(element);
				return {
					fits: element.scrollWidth <= element.clientWidth,
					oneLine: box.height <= Number.parseFloat(style.lineHeight) + 1,
					unobstructed: element.contains(
						document.elementFromPoint(
							box.x + box.width / 2,
							box.y + box.height / 2,
						),
					),
				};
			});
			expect(geometry).toEqual({
				fits: true,
				oneLine: true,
				unobstructed: true,
			});
			await expect(title).toHaveCSS("font-size", "16px");
			const logo = await brand.locator("svg, img").first().boundingBox();
			expect(logo?.width).toBe(32);
			expect(logo?.height).toBe(32);
		}
		await page.screenshot({
			path: testInfo.outputPath(`top-brand-${width}.png`),
			animations: "disabled",
		});
	}

	const lightColor = await title.evaluate(
		(element) => getComputedStyle(element).color,
	);
	started = performance.now();
	await header
		.getByRole("button", { name: "切换为深色模式", exact: true })
		.click();
	await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
	await expect(title).not.toHaveCSS("color", lightColor);
	timings.interaction.push(performance.now() - started);
	await page.screenshot({
		path: testInfo.outputPath("top-brand-dark.png"),
		animations: "disabled",
	});
	started = performance.now();
	await header.getByRole("menuitem", { name: "关于系统", exact: true }).click();
	await expect(page).toHaveURL(/\/system\/about$/);
	timings.interaction.push(performance.now() - started);
	started = performance.now();
	await brand.click();
	await expect(page).toHaveURL(/\/dashboard$/);
	timings.interaction.push(performance.now() - started);
	await expect(title).toBeVisible();

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
	console.log("top-navigation-brand-timings", JSON.stringify(report));
	expect(errors).toEqual([]);
	expect(Math.max(...timings.open)).toBeLessThan(5000);
	expect(report.open?.p50).toBeLessThan(1500);
	expect(report.open?.p95).toBeLessThan(3000);
	expect(Math.max(...timings.resize)).toBeLessThan(800);
	expect(report.resize?.p95).toBeLessThan(700);
	expect(Math.max(...timings.interaction)).toBeLessThan(1000);
	expect(report.interaction?.p95).toBeLessThan(800);
});
