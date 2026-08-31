import { expect, test, type Locator } from "@playwright/test";
import { writeFile } from "node:fs/promises";

async function finishMenuMotion(surface: Locator) {
	await expect
		.poll(
			() =>
				surface.evaluate((node) => {
					// Popup motion is applied to an ancestor of the semantic menu.
					for (
						let element: Element | null = node;
						element;
						element = element.parentElement
					) {
						const style = getComputedStyle(element);
						if (
							style.visibility !== "visible" ||
							Number(style.opacity) !== 1 ||
							style.transform !== "none"
						)
							return false;
						if (
							element
								.getAnimations()
								.some(
									(animation) =>
										animation.pending || animation.playState === "running",
								)
						)
							return false;
					}
					return true;
				}),
			{ intervals: [16, 32, 50] },
		)
		.toBe(true);
}

function summarize(samples: number[]) {
	const sorted = [...samples].sort((a, b) => a - b);
	return {
		samples,
		p50: sorted[Math.ceil(sorted.length * 0.5) - 1],
		p95: sorted[Math.ceil(sorted.length * 0.95) - 1],
	};
}

test.use({ hasTouch: true });

test("触摸关闭顶栏菜单后不恢复悬停提示", async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 900 });
	await page.goto("/login");
	await page.locator('input[autocomplete="username"]').fill("admin");
	await page.locator('input[autocomplete="current-password"]').fill("admin");
	await page.locator('button[type="submit"]').click();
	await expect(page.getByTestId("dashboard-stat-users")).toBeVisible();
	await page.clock.install();
	for (const name of ["语言", "通知", "Platform Admin"]) {
		const button = page
			.getByRole("banner")
			.getByRole("button", { name, exact: true });
		// Exercise the previous hover timer before touch input on a hybrid device.
		await button.hover();
		await page.clock.runFor(500);
		await expect(button).toHaveAttribute("aria-expanded", "false");
		for (let press = 0; press < 4; press++) {
			await button.tap();
			await expect(button).toHaveAttribute(
				"aria-expanded",
				press % 2 === 0 ? "true" : "false",
			);
			await page.clock.runFor(500);
			await expect(
				page.getByRole("tooltip", { name, exact: true }),
			).toBeHidden();
		}
	}
});

test("顶栏三个菜单统一点击、互斥和关闭行为", async ({ page }, testInfo) => {
	test.setTimeout(60_000);
	const errors: string[] = [];
	page.on("pageerror", (error) => errors.push(error.message));
	page.on("console", (entry) => {
		if (entry.type() === "error") errors.push(entry.text());
	});
	page.on("response", (response) => {
		if (response.status() >= 400)
			errors.push(`${response.status()} ${response.url()}`);
	});
	page.on("requestfailed", (request) => {
		if (request.failure()?.errorText !== "net::ERR_ABORTED")
			errors.push(request.url());
	});
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto("/login");
	await page.locator('input[autocomplete="username"]').fill("admin");
	await page.locator('input[autocomplete="current-password"]').fill("admin");
	let started = performance.now();
	await page.locator('button[type="submit"]').click();
	await expect(page.getByTestId("dashboard-stat-users")).toBeVisible();
	const opening = [performance.now() - started];
	const resizing: number[] = [];
	const interactions: number[] = [];
	const header = page.getByRole("banner");
	const entries = [
		{
			name: "语言",
			surface: page.getByRole("menu").filter({
				has: page.getByRole("menuitem", { name: "English", exact: true }),
			}),
		},
		{ name: "通知", surface: page.getByTestId("notification-popover") },
		{
			name: "Platform Admin",
			surface: page.getByRole("menu").filter({
				has: page.getByRole("menuitem", { name: "个人资料", exact: true }),
			}),
		},
	] as const;
	for (const width of [1440, 768, 390, 1440]) {
		started = performance.now();
		await page.setViewportSize({ width, height: 900 });
		await finishMenuMotion(header);
		resizing.push(performance.now() - started);
		for (const { name, surface } of entries) {
			const button = header.getByRole("button", { name, exact: true });
			await button.hover();
			await expect(
				page.getByRole("tooltip", { name, exact: true }),
			).toBeHidden();
			await expect(surface).toBeHidden();
			for (let press = 0; press < 4; press++) {
				started = performance.now();
				if (width === 390) await button.tap();
				else await button.click();
				if (press % 2 === 0) {
					await expect(surface).toBeVisible();
					await finishMenuMotion(surface);
					await expect(
						page.getByRole("tooltip", { name, exact: true }),
					).toBeHidden();
					interactions.push(performance.now() - started);
					await expect(surface).toBeInViewport({ ratio: 1 });
					await expect(button).toHaveAttribute("aria-expanded", "true");
					if (press === 0)
						await page.screenshot({
							path: testInfo.outputPath(`${width}-${name}.png`),
						});
				} else {
					await expect(button).toHaveAttribute("aria-expanded", "false");
					await expect(surface).toBeHidden();
					await expect(
						page.getByRole("tooltip", { name, exact: true }),
					).toBeHidden();
					if (press === 3)
						await page.screenshot({
							path: testInfo.outputPath(`${width}-${name}-closed.png`),
						});
				}
			}
		}
		// Keyboard activation has no outside pointer event to close the previous popup.
		for (const entry of entries) {
			await header
				.getByRole("button", { name: entry.name, exact: true })
				.focus();
			await page.keyboard.press("Enter");
			await expect(entry.surface).toBeVisible();
			for (const other of entries.filter((item) => item !== entry))
				await expect(other.surface).toBeHidden();
		}
		await page.keyboard.press("Escape");
		await expect(entries[2].surface).toBeHidden();
		const notification = header.getByRole("button", {
			name: "通知",
			exact: true,
		});
		await notification.click();
		await entries[1].surface
			.getByRole("button", { name: "查看全部消息" })
			.focus();
		await page.keyboard.press("Escape");
		await expect(entries[1].surface).toBeHidden();
		await expect(notification).toBeFocused();
		for (const { name, surface } of entries) {
			await header.getByRole("button", { name, exact: true }).click();
			await expect(surface).toBeVisible();
			await header.getByText("仪表盘", { exact: true }).click();
			await expect(surface).toBeHidden();
		}
		expect(
			await page.evaluate(
				() => document.documentElement.scrollWidth <= innerWidth,
			),
		).toBe(true);
	}
	const metrics = {
		opening: summarize(opening),
		resizing: summarize(resizing),
		interactions: summarize(interactions),
	};
	const path = testInfo.outputPath("header-menu-metrics.json");
	await writeFile(path, JSON.stringify(metrics, null, 2));
	await testInfo.attach("header-menu-metrics", {
		path,
		contentType: "application/json",
	});
	expect(errors).toEqual([]);
	expect(metrics.opening.p50).toBeLessThan(1500);
	expect(metrics.opening.p95).toBeLessThan(3000);
	expect(Math.max(...opening)).toBeLessThan(5000);
	expect(metrics.resizing.p95).toBeLessThan(700);
	expect(Math.max(...resizing)).toBeLessThan(800);
	expect(metrics.interactions.p95).toBeLessThan(800);
	expect(Math.max(...interactions)).toBeLessThan(1000);
});
