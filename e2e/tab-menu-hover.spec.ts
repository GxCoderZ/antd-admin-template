import { expect, test, type Page } from "@playwright/test";

async function signIn(page: Page) {
	await page.goto("/login");
	await page.locator('input[autocomplete="username"]').fill("admin");
	await page.locator('input[autocomplete="current-password"]').fill("admin");
	const started = performance.now();
	await page.locator('button[type="submit"]').click();
	await expect(page.getByTestId("dashboard-stat-users")).toBeVisible();
	return performance.now() - started;
}

function summarize(samples: number[]) {
	const sorted = [...samples].sort((a, b) => a - b);
	return {
		p50: sorted[Math.ceil(sorted.length * 0.5) - 1],
		p95: sorted[Math.ceil(sorted.length * 0.95) - 1],
		max: Math.max(...samples),
	};
}

test.use({
	hasTouch: true,
	isMobile: true,
	viewport: { width: 390, height: 900 },
});

for (const closeWith of ["trigger", "outside", "action"]) {
	test(`mobile tab menu clears its background after ${closeWith}`, async ({
		page,
	}, testInfo) => {
		await signIn(page);
		const button = page.getByRole("button", {
			name: "更多标签操作",
			exact: true,
		});
		const menu = page.getByRole("menu").filter({
			has: page.getByRole("menuitem", { name: "关闭其它标签页", exact: true }),
		});
		const idleBackground = await button.evaluate(
			(element) => getComputedStyle(element).backgroundColor,
		);
		await button.tap();
		await expect(menu).toBeVisible();
		if (closeWith === "trigger") await button.tap();
		else if (closeWith === "outside") await page.touchscreen.tap(10, 450);
		else
			await menu.getByRole("menuitem", { name: "重新加载", exact: true }).tap();
		await expect(menu).toBeHidden();
		await expect(button).not.toHaveAttribute("data-rippling", "true");
		await expect(page.getByTestId("dashboard-stat-users")).toBeVisible();
		await expect(button).toHaveCSS("background-color", idleBackground);
		await page.screenshot({ path: testInfo.outputPath("closed.png") });
	});
}

for (const mode of ["light", "dark"]) {
	test(`tab button preserves input-specific backgrounds and keyboard focus (${mode})`, async ({
		page,
	}, testInfo) => {
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
		const opening = [await signIn(page)];
		if (mode === "dark") {
			await page
				.getByRole("button", { name: "切换为深色模式", exact: true })
				.tap();
			await expect(
				page.getByRole("button", { name: "切换为浅色模式", exact: true }),
			).toBeVisible();
		}
		const button = page.getByRole("button", {
			name: "更多标签操作",
			exact: true,
		});
		const menu = page.getByRole("menu").filter({
			has: page.getByRole("menuitem", { name: "关闭其它标签页", exact: true }),
		});
		const popup = page.locator(".ant-dropdown").filter({ has: menu });
		const idleBackground = await button.evaluate(
			(element) => getComputedStyle(element).backgroundColor,
		);
		const resizing: number[] = [];
		const interactions: number[] = [];
		const session = await page.context().newCDPSession(page);
		for (const [index, width] of [390, 768, 1440, 390].entries()) {
			const touch = width !== 1440;
			let started = performance.now();
			await page.setViewportSize({ width, height: 900 });
			await session.send("Emulation.setTouchEmulationEnabled", {
				enabled: touch,
				maxTouchPoints: 1,
			});
			await expect
				.poll(() => page.evaluate(() => matchMedia("(hover: hover)").matches))
				.toBe(!touch);
			await expect(button).toBeInViewport();
			resizing.push(performance.now() - started);
			started = performance.now();
			if (touch) await button.tap();
			else await button.click();
			await expect(menu).toBeVisible();
			await expect(popup).toHaveCSS("opacity", "1");
			await expect(popup).toHaveCSS("transform", "none");
			interactions.push(performance.now() - started);
			const bounds = await popup.boundingBox();
			if (!bounds) throw new Error("Missing tab menu bounds");
			expect(bounds.x).toBeGreaterThanOrEqual(0);
			expect(bounds.x + bounds.width).toBeLessThanOrEqual(width + 1);
			expect(bounds.y + bounds.height).toBeLessThanOrEqual(901);
			await page.screenshot({
				path: testInfo.outputPath(`open-${index}-${width}.png`),
			});
			started = performance.now();
			if (touch) await button.tap();
			else await button.click();
			await expect(menu).toBeHidden();
			interactions.push(performance.now() - started);
			await expect(button).not.toHaveAttribute("data-rippling", "true");
			// Keep :hover active to reproduce browsers that retain it after a touch.
			await button.hover();
			expect(
				await button.evaluate((element) => element.matches(":hover")),
			).toBe(true);
			if (touch)
				await expect(button).toHaveCSS("background-color", idleBackground);
			else
				await expect(button).not.toHaveCSS("background-color", idleBackground);
			await button.evaluate(async (element) => {
				await Promise.all(
					element.getAnimations().map((animation) => animation.finished),
				);
			});
			await page.screenshot({
				path: testInfo.outputPath(`closed-${index}-${width}.png`),
			});
			expect(
				await page.evaluate(
					() => document.documentElement.scrollWidth <= innerWidth,
				),
			).toBe(true);
			expect(
				await button.evaluate((element) => {
					const box = element.getBoundingClientRect();
					return element.contains(
						document.elementFromPoint(
							box.x + box.width / 2,
							box.y + box.height / 2,
						),
					);
				}),
			).toBe(true);
			await page.mouse.move(0, 0);
			await expect(button).toHaveCSS("background-color", idleBackground);
			if (!touch) {
				await page.getByRole("button", { name: "全屏", exact: true }).focus();
				await page.keyboard.press("Tab");
				await expect(button).toBeFocused();
				await expect(button).toHaveCSS("outline-style", "solid");
				await page.keyboard.press("Enter");
				await expect(menu).toBeVisible();
				await page.keyboard.press("Escape");
				await expect(menu).toBeHidden();
			}
		}
		await session.detach();
		expect(errors).toEqual([]);
		const timings = {
			opening: summarize(opening),
			resizing: summarize(resizing),
			interactions: summarize(interactions),
		};
		console.info(`tab-menu-hover-${mode}`, JSON.stringify(timings));
		await testInfo.attach("tab-menu-hover-metrics", {
			body: JSON.stringify(timings, null, 2),
			contentType: "application/json",
		});
		expect(timings.opening.max).toBeLessThan(5000);
		expect(timings.opening.p50).toBeLessThan(1500);
		expect(timings.opening.p95).toBeLessThan(3000);
		expect(timings.resizing.max).toBeLessThan(800);
		expect(timings.resizing.p95).toBeLessThan(700);
		expect(timings.interactions.max).toBeLessThan(1000);
		expect(timings.interactions.p95).toBeLessThan(800);
	});
}
