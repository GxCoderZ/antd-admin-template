import { expect, type Page, test } from "@playwright/test";

async function signIn(page: Page) {
	await page.goto("/login");
	await page.locator('input[autocomplete="username"]').fill("admin");
	await page.locator('input[autocomplete="current-password"]').fill("admin");
	await page.locator('button[type="submit"]').click();
	await expect(page).toHaveURL(/\/dashboard$/);
	await expect(page.getByTestId("dashboard-stat-users")).toBeVisible();
}

test("工作台指标卡保留英文和深色主题（390px）", async ({ page }, testInfo) => {
	await page.setViewportSize({ width: 390, height: 1000 });
	await page.addInitScript(() => {
		localStorage.setItem("react-antd-admin.preference.language", "en");
		localStorage.setItem("react-antd-admin.preference.theme-mode", "dark");
	});
	await signIn(page);
	const metrics = page.getByTestId(/^dashboard-stat-/);
	await expect(metrics).toHaveCount(4);
	await expect(metrics.first()).toContainText("All platform accounts");
	for (const metric of await metrics.all()) {
		await expect(metric).toHaveCSS("background-color", "rgb(20, 20, 20)");
		await expect(metric.getByTestId("chart-card-total")).toHaveCSS(
			"color",
			"rgba(255, 255, 255, 0.85)",
		);
		for (const part of ["chart-card-content", "chart-card-footer"]) {
			expect(
				await metric
					.getByTestId(part)
					.evaluate(
						(node) =>
							node.scrollWidth <= node.clientWidth &&
							node.scrollHeight <= node.clientHeight,
					),
			).toBe(true);
		}
	}
	await page.screenshot({
		path: testInfo.outputPath("dashboard-en-dark-390.png"),
		animations: "disabled",
	});
	await metrics.first().screenshot({
		path: testInfo.outputPath("dashboard-en-dark-390-metric.png"),
		animations: "disabled",
	});
});

for (const width of [1440, 460, 390]) {
	test(`工作台布局和管理入口（${width}px）`, async ({ page }, testInfo) => {
		const errors: string[] = [];
		page.on("pageerror", (error) => errors.push(error.message));
		await page.setViewportSize({ width, height: 1000 });
		await signIn(page);
		const system = page.getByRole("region", { name: "系统概览" });
		const entries = page.getByRole("region", { name: "快捷入口" });
		const activity = page.getByRole("region", { name: "最近动态" });
		const announcements = page.getByRole("region", { name: "最新公告" });
		const metrics = page.getByTestId(/^dashboard-stat-/);
		await expect(metrics).toHaveCount(4);
		for (const metric of await metrics.all()) {
			await expect(metric.getByTestId("chart-card-total")).toHaveCSS(
				"font-size",
				"30px",
			);
			await expect(metric.getByTestId("chart-card-total")).toHaveCSS(
				"line-height",
				"38px",
			);
			await expect(metric.getByTestId("chart-card-content")).toHaveCSS(
				"height",
				"46px",
			);
			await expect(metric.getByTestId("chart-card-footer")).toHaveCSS(
				"border-top-width",
				"1px",
			);
			await expect(metric.getByTestId("chart-card-footer")).toHaveCSS(
				"padding-top",
				"9px",
			);
			const cardBox = (await metric.boundingBox())!;
			const totalBox = (await metric
				.getByTestId("chart-card-total")
				.boundingBox())!;
			expect(totalBox.x - cardBox.x).toBeCloseTo(24, 0);
			// Native Card's 56px header includes a -1px bottom margin.
			expect(totalBox.y - cardBox.y).toBeCloseTo(101, 0);
			expect(cardBox.height).toBeCloseTo(237, 0);
		}
		await expect(entries.getByRole("link")).toHaveCount(5);
		if (width === 390) {
			const links = entries.getByRole("link");
			const first = (await links.nth(0).boundingBox())!;
			const second = (await links.nth(1).boundingBox())!;
			const third = (await links.nth(2).boundingBox())!;
			expect(second.y).toBeCloseTo(first.y, 0);
			expect(third.y).toBeGreaterThan(first.y);
		}
		await expect(system).toContainText("预览正常");
		for (const region of [
			system,
			entries,
			activity,
			announcements,
			...(await metrics.all()),
		]) {
			await expect(region).toHaveCSS("background-color", "rgb(255, 255, 255)");
			await expect(region).toHaveCSS("border-top-left-radius", "8px");
			await expect(region).toHaveCSS("border-bottom-right-radius", "8px");
			await expect(region).toHaveCSS(
				"box-shadow",
				"rgba(0, 0, 0, 0.03) 0px 1px 2px 0px, rgba(0, 0, 0, 0.02) 0px 1px 6px -1px, rgba(0, 0, 0, 0.02) 0px 2px 4px 0px",
			);
		}
		await expect(page.getByText("登录趋势", { exact: true })).toHaveCount(0);
		await expect(page.getByRole("checkbox")).toHaveCount(0);

		const boxes = await metrics.evaluateAll((nodes) =>
			nodes.map((node) => {
				const { top, bottom, left, right } = node.getBoundingClientRect();
				return { top, bottom, left, right };
			}),
		);
		if (width === 1440) {
			for (const box of boxes.slice(1)) {
				expect(box.top).toBeCloseTo(boxes[0]!.top, 0);
				expect(box.bottom).toBeCloseTo(boxes[0]!.bottom, 0);
			}
			expect(boxes[1]!.left).toBeGreaterThanOrEqual(boxes[0]!.right);
		} else {
			for (let index = 1; index < boxes.length; index++) {
				expect(boxes[index]!.top).toBeGreaterThanOrEqual(
					boxes[index - 1]!.bottom,
				);
				expect(boxes[index]!.left).toBeCloseTo(boxes[0]!.left, 0);
			}
		}
		expect(
			(await system.boundingBox())!.y + (await system.boundingBox())!.height,
		).toBeLessThanOrEqual(boxes[0]!.top);
		expect((await entries.boundingBox())!.y).toBeGreaterThanOrEqual(
			boxes[3]!.bottom,
		);
		const activityBox = (await activity.boundingBox())!;
		const announcementBox = (await announcements.boundingBox())!;
		if (width === 1440) {
			expect(announcementBox.x).toBeGreaterThan(
				activityBox.x + activityBox.width,
			);
			expect(announcementBox.y).toBeCloseTo(activityBox.y, 0);
			expect(activityBox.width + 24).toBeCloseTo(
				(announcementBox.width + 24) * 2,
				0,
			);
		} else {
			expect(announcementBox.y).toBeGreaterThan(
				activityBox.y + activityBox.height,
			);
		}
		expect(
			await entries
				.getByRole("link")
				.evaluateAll((buttons) =>
					buttons.every(
						(button) =>
							button.scrollWidth <= button.clientWidth + 1 &&
							button.scrollHeight <= button.clientHeight + 1,
					),
				),
		).toBe(true);
		expect(
			await page
				.getByTestId("admin-shell-page-content")
				.evaluate((node) => node.scrollWidth <= node.clientWidth + 1),
		).toBe(true);
		await page.screenshot({
			path: testInfo.outputPath(`dashboard-${width}-top.png`),
			animations: "disabled",
		});
		await metrics.first().screenshot({
			path: testInfo.outputPath(`dashboard-${width}-metric.png`),
			animations: "disabled",
		});
		await page
			.getByTestId("dashboard-stat-logins")
			.getByRole("img", { name: "今日登录", exact: true })
			.focus();
		await expect(page.getByRole("tooltip")).toContainText(
			"按 Asia/Shanghai 统计今日成功登录次数",
		);
		await activity.scrollIntoViewIfNeeded();
		await page.getByRole("tab", { name: "最近操作", exact: true }).click();
		await expect(activity.getByRole("listitem")).toHaveCount(5);
		await page.screenshot({
			path: testInfo.outputPath(`dashboard-${width}-activity.png`),
			animations: "disabled",
		});
		await page
			.getByRole("region", { name: "轻量提醒" })
			.scrollIntoViewIfNeeded();
		await page.screenshot({
			path: testInfo.outputPath(`dashboard-${width}-reminders.png`),
			animations: "disabled",
		});

		for (const [name, path] of [
			["用户管理", "/organization/users"],
			["角色管理", "/access/roles"],
			["字典管理", "/system/dictionaries"],
			["系统设置", "/system/settings"],
			["操作日志", "/operations/audit-logs"],
		] as const) {
			await entries.getByRole("link", { name, exact: true }).click();
			await expect(page).toHaveURL(path);
			await expect(page.getByTestId("admin-shell-page-content")).toBeVisible();
			await page.goBack();
			await expect(page.getByTestId("dashboard-stat-users")).toBeVisible();
		}
		await page.getByRole("button", { name: "维护设置", exact: true }).click();
		await expect(page).toHaveURL("/system/settings?section=security");
		await expect(
			page.getByRole("tab", { name: "登录与安全", exact: true }),
		).toHaveAttribute("aria-selected", "true");
		expect(errors).toEqual([]);
	});
}
