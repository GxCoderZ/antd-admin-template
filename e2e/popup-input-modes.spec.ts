import { expect, test, type Locator, type Page } from "@playwright/test";

test.use({ hasTouch: true, viewport: { width: 390, height: 900 } });

async function signIn(page: Page) {
	await page.goto("/login");
	await page.locator('input[autocomplete="username"]').fill("admin");
	await page.locator('input[autocomplete="current-password"]').fill("admin");
	await page.locator('button[type="submit"]').click();
	await expect(page).toHaveURL(/\/dashboard$/);
}

async function switchToMouse(page: Page) {
	await page.setViewportSize({ width: 1440, height: 900 });
	const session = await page.context().newCDPSession(page);
	await session.send("Emulation.setTouchEmulationEnabled", { enabled: false });
	await session.detach();
}

test("语言菜单在触摸后仍可由鼠标打开", async ({ page }) => {
	await signIn(page);
	const language = page.getByRole("button", { name: "语言", exact: true });
	const english = page.getByRole("menuitem", { name: "English", exact: true });
	await language.tap();
	await expect(english).toBeVisible();
	await language.tap();
	await expect(english).toBeHidden();
	await switchToMouse(page);
	await language.click();
	await expect(english).toBeVisible();
});

test("提示气泡在触摸后仍可由鼠标悬停打开", async ({ page }) => {
	await signIn(page);
	const theme = page.getByRole("button", { name: /切换为.*色模式/ });
	await theme.tap();
	await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
	await page
		.getByTestId("admin-shell-page-content")
		.tap({ position: { x: 8, y: 8 } });
	await expect(page.getByRole("tooltip")).toBeHidden();
	await switchToMouse(page);
	await theme.hover();
	await expect(
		page.getByRole("tooltip", { name: "切换为浅色模式" }),
	).toBeVisible();
	await page.mouse.move(0, 899);
	await expect(page.getByRole("tooltip")).toBeHidden();
});

test("横向子菜单在触摸后仍可由鼠标悬停打开", async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await signIn(page);
	await page.getByRole("button", { name: "Platform Admin" }).tap();
	await page.getByRole("menuitem", { name: "偏好设置", exact: true }).tap();
	const preferences = page.getByRole("dialog", { name: "偏好设置" });
	await preferences
		.getByRole("radio", { name: "顶部菜单", exact: true })
		.check();
	await preferences.getByRole("button", { name: "关闭", exact: true }).tap();
	await expect(preferences).toBeHidden();
	const system = page
		.getByRole("banner")
		.getByRole("menuitem", { name: "系统管理", exact: true });
	const settings = page.getByRole("menuitem", {
		name: "系统设置",
		exact: true,
	});
	await system.tap();
	await expect(settings).toBeVisible();
	await page
		.getByTestId("admin-shell-page-content")
		.tap({ position: { x: 8, y: 8 } });
	await expect(settings).toBeHidden();
	await switchToMouse(page);
	await system.hover();
	await expect(settings).toBeVisible();
	await page.mouse.move(0, 899);
	await expect(settings).toBeHidden();
});

interface PopupCase {
	name: string;
	route?: string;
	preferences?: boolean;
	trigger: (page: Page) => Locator;
	surface: (page: Page) => Locator;
}

const popupCases: PopupCase[] = [
	{
		name: "头像菜单",
		trigger: (page) => page.getByRole("button", { name: "Platform Admin" }),
		surface: (page) =>
			page.locator(".ant-dropdown").filter({
				has: page.getByRole("menuitem", { name: "个人资料", exact: true }),
			}),
	},
	{
		name: "通知弹层",
		trigger: (page) => page.getByRole("button", { name: "通知", exact: true }),
		surface: (page) =>
			page.locator(".ant-popover").filter({
				has: page.getByTestId("notification-popover"),
			}),
	},
	{
		name: "标签工具菜单",
		trigger: (page) => page.getByRole("button", { name: "更多标签操作" }),
		surface: (page) =>
			page.locator(".ant-dropdown").filter({
				has: page.getByRole("menuitem", {
					name: "关闭其它标签页",
					exact: true,
				}),
			}),
	},
	{
		name: "表格行操作",
		route: "用户管理",
		trigger: (page) =>
			page.getByRole("button", { name: "更多", exact: true }).first(),
		surface: (page) =>
			page.locator(".ant-dropdown").filter({
				has: page.getByRole("menuitem", { name: "角色", exact: true }),
			}),
	},
	{
		name: "角色行操作",
		route: "角色管理",
		trigger: (page) =>
			page.getByRole("button", { name: "更多", exact: true }).first(),
		surface: (page) =>
			page.locator(".ant-dropdown").filter({
				has: page.getByRole("menuitem", { name: "权限配置", exact: true }),
			}),
	},
	{
		name: "表格密度",
		route: "用户管理",
		trigger: (page) =>
			page.getByRole("img", { name: "column-height", exact: true }),
		surface: (page) =>
			page.locator(".ant-dropdown").filter({
				has: page.getByRole("menuitem", { name: "宽松", exact: true }),
			}),
	},
	{
		name: "列设置",
		route: "用户管理",
		trigger: (page) =>
			page
				.getByTestId("admin-users-table-card")
				.getByRole("img", { name: "setting", exact: true }),
		surface: (page) =>
			page.locator(".ant-popover").filter({
				has: page.getByRole("tree"),
			}),
	},
	{
		name: "恢复默认确认",
		preferences: true,
		trigger: (page) => page.getByRole("button", { name: "恢复默认设置" }),
		surface: (page) => page.locator(".ant-popconfirm"),
	},
];

function summarize(samples: number[]) {
	const sorted = [...samples].sort((a, b) => a - b);
	return {
		p50: sorted[Math.ceil(sorted.length * 0.5) - 1],
		p95: sorted[Math.ceil(sorted.length * 0.95) - 1],
		max: Math.max(...samples),
	};
}

for (const popup of popupCases) {
	test(`${popup.name}支持触摸与鼠标反复切换`, async ({ page }, testInfo) => {
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
		let started = performance.now();
		await signIn(page);
		if (popup.route) {
			await page.getByRole("button", { name: "搜索", exact: true }).click();
			const search = page.getByRole("dialog", { name: "导航搜索" });
			await search.getByRole("textbox").fill(popup.route);
			started = performance.now();
			await search
				.getByRole("menuitem", { name: popup.route, exact: true })
				.click();
			await expect(search).toBeHidden();
		}
		if (popup.preferences) {
			await page.getByRole("button", { name: "Platform Admin" }).click();
			started = performance.now();
			await page
				.getByRole("menuitem", { name: "偏好设置", exact: true })
				.click();
		}
		const trigger = popup.trigger(page);
		const surface = popup.surface(page);
		await expect(trigger).toBeVisible();
		const opening = [performance.now() - started];
		const resizing: number[] = [];
		const interactions: number[] = [];
		const session = await page.context().newCDPSession(page);
		for (const [index, width] of [390, 768, 1440, 390, 1440].entries()) {
			const touch = width !== 1440;
			started = performance.now();
			await page.setViewportSize({ width, height: 900 });
			await session.send("Emulation.setTouchEmulationEnabled", {
				enabled: touch,
				maxTouchPoints: 1,
			});
			await trigger.scrollIntoViewIfNeeded();
			await expect(trigger).toBeInViewport();
			resizing.push(performance.now() - started);
			expect(
				await trigger.evaluate((element) => {
					const box = element.getBoundingClientRect();
					return element.contains(
						document.elementFromPoint(
							box.x + box.width / 2,
							box.y + box.height / 2,
						),
					);
				}),
			).toBe(true);

			started = performance.now();
			if (touch) await trigger.tap();
			else await trigger.click();
			await expect(surface).toBeVisible();
			await surface.evaluate(async (element) => {
				await new Promise<void>((resolve) =>
					requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
				);
				await Promise.all(
					element
						.getAnimations({ subtree: true })
						.filter(
							(animation) =>
								animation.effect?.getTiming().iterations !== Infinity,
						)
						.map((animation) => animation.finished),
				);
			});
			await expect(surface).toHaveCSS("opacity", "1");
			const action = surface
				.locator(
					'button:not([disabled]), [role="menuitem"]:not([aria-disabled="true"]), [role="checkbox"], a',
				)
				.first();
			expect(
				await action.evaluate((element) => {
					const box = element.getBoundingClientRect();
					return element.contains(
						document.elementFromPoint(
							box.x + box.width / 2,
							box.y + box.height / 2,
						),
					);
				}),
			).toBe(true);
			interactions.push(performance.now() - started);
			const bounds = await surface.boundingBox();
			if (!bounds) throw new Error("Missing popup bounds");
			expect(bounds.x).toBeGreaterThanOrEqual(-1);
			expect(bounds.x + bounds.width).toBeLessThanOrEqual(width + 1);
			expect(bounds.y).toBeGreaterThanOrEqual(-1);
			expect(bounds.y + bounds.height).toBeLessThanOrEqual(901);
			expect(
				await page.evaluate(
					() => document.documentElement.scrollWidth <= innerWidth,
				),
			).toBe(true);
			if (index < 3)
				await page.screenshot({
					path: testInfo.outputPath(`popup-${width}.png`),
				});

			started = performance.now();
			if (popup.preferences) {
				const cancel = surface.getByRole("button", { name: /^取\s*消$/ });
				if (touch) await cancel.tap();
				else await cancel.click();
			} else if (touch) {
				await page.touchscreen.tap(4, 896);
			} else {
				await page.mouse.click(4, 896);
			}
			await expect(surface).toBeHidden();
			interactions.push(performance.now() - started);
		}
		await session.detach();
		const timings = {
			opening: summarize(opening),
			resizing: summarize(resizing),
			interactions: summarize(interactions),
		};
		await testInfo.attach("popup-input-timings", {
			body: JSON.stringify(timings),
			contentType: "application/json",
		});
		console.log(popup.name, JSON.stringify(timings));
		expect(timings.opening.p50).toBeLessThan(1500);
		expect(timings.opening.p95).toBeLessThan(3000);
		expect(timings.opening.max).toBeLessThan(5000);
		expect(timings.resizing.p95).toBeLessThan(700);
		expect(timings.resizing.max).toBeLessThan(800);
		expect(timings.interactions.p95).toBeLessThan(800);
		expect(timings.interactions.max).toBeLessThan(1000);
		expect(errors).toEqual([]);
	});
}
