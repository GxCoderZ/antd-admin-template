import { expect, test, type Locator, type Page } from "@playwright/test";
import { writeFile } from "node:fs/promises";

async function settleSurface(surface: Locator) {
	await surface.evaluate(async (node) => {
		// Include rc-motion's first active frame, then await only this surface.
		await new Promise<void>((resolve) =>
			requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
		);
		await Promise.allSettled(
			document
				.getAnimations()
				.filter((animation) => {
					const target =
						animation.effect instanceof KeyframeEffect
							? animation.effect.target
							: null;
					return (
						target instanceof Element &&
						(target.contains(node) || node.contains(target)) &&
						animation.effect?.getTiming().iterations !== Infinity
					);
				})
				.map((animation) => animation.finished),
		);
	});
}

async function expectSurfaceFits(page: Page, dialog: Locator) {
	await expect(dialog).toBeInViewport({ ratio: 1 });
	expect(
		await page.evaluate(
			() => document.documentElement.scrollWidth <= innerWidth,
		),
	).toBe(true);
	expect(
		await dialog.evaluate((node) => node.scrollWidth <= node.clientWidth),
	).toBe(true);
	for (const button of await dialog.getByRole("button").all()) {
		if (await button.isVisible())
			await expect(button).toBeInViewport({ ratio: 1 });
	}
}

function summarize(samples: number[]) {
	const sorted = [...samples].sort((a, b) => a - b);
	return {
		samples,
		p50: sorted[Math.ceil(sorted.length * 0.5) - 1],
		p95: sorted[Math.ceil(sorted.length * 0.95) - 1],
	};
}

for (const entry of [
	{ name: "角色管理", table: "admin-roles-table-card", action: "权限配置" },
	{ name: "用户管理", table: "admin-users-table-card", action: "角色" },
]) {
	test(`${entry.name}角色配置抽屉宽窄切换与恢复`, async ({
		page,
	}, testInfo) => {
		const errors: string[] = [];
		page.on("pageerror", (error) => errors.push(error.message));
		page.on("console", (message) => {
			if (message.type() === "error") errors.push(message.text());
		});
		page.on("response", (response) => {
			if (response.status() >= 400)
				errors.push(`${response.status()} ${response.url()}`);
		});
		page.on("requestfailed", (request) => {
			if (request.failure()?.errorText !== "net::ERR_ABORTED")
				errors.push(`${request.url()} ${request.failure()?.errorText}`);
		});
		await page.setViewportSize({ width: 1440, height: 900 });
		await page.goto("/login");
		await page.locator('input[autocomplete="username"]').fill("admin");
		await page.locator('input[autocomplete="current-password"]').fill("admin");
		await page.locator('button[type="submit"]').click();
		await expect(page.getByTestId("dashboard-stat-users")).toBeVisible();
		await page.getByRole("menuitem", { name: "系统管理", exact: true }).click();
		let started = performance.now();
		await page.getByRole("menuitem", { name: entry.name, exact: true }).click();
		const table = page.getByTestId(entry.table);
		await expect(
			table.getByRole("button", { name: "更多", exact: true }).first(),
		).toBeVisible();
		const openTimes = [performance.now() - started];
		const resizeTimes: number[] = [];
		const interactionTimes: number[] = [];
		await table
			.getByRole("button", { name: "更多", exact: true })
			.first()
			.click();
		const action = page.getByRole("menuitem", {
			name: entry.action,
			exact: true,
		});
		await expect(action).toBeVisible();
		await settleSurface(action);
		started = performance.now();
		await action.click();
		const dialog = page.getByRole("dialog");
		await expect(dialog).toBeVisible();
		await settleSurface(dialog);
		if (entry.action === "角色")
			await expect(
				dialog.getByRole("combobox", { name: "角色选择" }),
			).toBeVisible();
		interactionTimes.push(performance.now() - started);

		for (const width of [1440, 768, 390, 1440]) {
			started = performance.now();
			await page.setViewportSize({ width, height: 900 });
			await settleSurface(dialog);
			resizeTimes.push(performance.now() - started);
			await expectSurfaceFits(page, dialog);
			await expect(dialog).toHaveCSS("width", `${width === 390 ? 390 : 560}px`);
			if (entry.action === "权限配置") {
				const buttons = await Promise.all(
					["展开所有", "收起全部", "全选", "清空"].map((name) =>
						dialog.getByRole("button", { name, exact: true }).boundingBox(),
					),
				);
				if (buttons.some((box) => !box))
					throw new Error("Missing permission toolbar action");
				const tops = buttons.map((box) => box!.y);
				expect(Math.max(...tops) - Math.min(...tops)).toBeLessThan(1);
				const status = await dialog
					.getByRole("switch", { name: "父子联动" })
					.boundingBox();
				if (!status || !buttons[0]) throw new Error("Missing selection status");
				expect(status.y).toBeGreaterThanOrEqual(
					buttons[0].y + buttons[0].height,
				);
			} else {
				await expect(dialog.getByText("暂无未保存变更")).toBeVisible();
				await expect(dialog.getByText("保存变更", { exact: true })).toHaveCount(
					0,
				);
			}
			await page.screenshot({
				path: testInfo.outputPath(`drawer-${width}.png`),
			});
		}
		started = performance.now();
		await dialog.getByRole("button", { name: "关闭", exact: true }).click();
		// Measure actual removal each frame, not the assertion retry interval.
		await page.waitForFunction(
			() => document.querySelector('[role="dialog"]') === null,
		);
		interactionTimes.push(performance.now() - started);
		await expect(dialog).toBeHidden();
		await expect(table).toBeVisible();
		const metrics = {
			open: summarize(openTimes),
			resize: summarize(resizeTimes),
			interaction: summarize(interactionTimes),
		};
		const metricsPath = testInfo.outputPath("role-drawer-metrics.json");
		await writeFile(metricsPath, JSON.stringify(metrics, null, 2));
		await testInfo.attach("role-drawer-metrics", {
			path: metricsPath,
			contentType: "application/json",
		});
		expect(errors).toEqual([]);
		expect(Math.max(...openTimes)).toBeLessThan(5000);
		expect(metrics.open.p50).toBeLessThan(1500);
		expect(metrics.open.p95).toBeLessThan(3000);
		expect(Math.max(...resizeTimes)).toBeLessThan(800);
		expect(metrics.resize.p95).toBeLessThan(700);
		expect(Math.max(...interactionTimes)).toBeLessThan(1000);
		expect(metrics.interaction.p95).toBeLessThan(800);
	});
}
