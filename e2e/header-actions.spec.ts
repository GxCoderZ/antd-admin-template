import { expect, test, type Page } from "@playwright/test";

async function signIn(page: Page) {
	await page.goto("/login");
	await page.locator('input[autocomplete="username"]').fill("admin");
	await page.locator('input[autocomplete="current-password"]').fill("admin");
	const started = performance.now();
	await page.locator('button[type="submit"]').click();
	await expect(page).toHaveURL(/\/dashboard$/);
	await expect(page.getByRole("banner")).toBeVisible();
	return performance.now() - started;
}

for (const width of [1440, 768, 390]) {
	test(`顶栏操作区使用 Pro 头像和按钮尺寸（${width}px）`, async ({
		page,
	}, testInfo) => {
		await page.setViewportSize({ height: 900, width });
		await signIn(page);

		const header = page.getByRole("banner");
		const names = ["搜索", "语言", "切换为深色模式", "通知"];
		for (const name of ["设置", "更多操作"]) {
			await expect(
				header.getByRole("button", { name, exact: true }),
			).toHaveCount(0);
		}
		for (const name of names) {
			const button = header.getByRole("button", { name, exact: true });
			await expect(button).toHaveCSS("height", "36px");
			await expect(button).toHaveCSS("width", "36px");
			await expect(button).toHaveCSS("padding-block", "0px");
			await expect(button).toHaveCSS("padding-inline", "8px");
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
			if (previous !== undefined) expect(center - previous).toBe(36);
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
		const profile = page.getByRole("menuitem", {
			name: "个人资料",
			exact: true,
		});
		await account.hover();
		await expect(profile).toBeVisible();
		for (let click = 0; click < 3; click += 1) {
			await account.click();
			// A closing menu is still visible until its finite animation finishes.
			await page.evaluate(async () => {
				await Promise.allSettled(
					document
						.getAnimations()
						.filter(
							(animation) =>
								animation.effect?.getTiming().iterations !== Infinity,
						)
						.map((animation) => animation.finished),
				);
			});
			await expect(profile).toBeVisible();
		}
		await page.screenshot({
			path: testInfo.outputPath(`header-menu-${width}.png`),
			animations: "disabled",
		});
		await page.getByTestId("admin-shell-page-content").hover({
			position: { x: 4, y: 4 },
		});
		await expect(profile).not.toBeVisible();
		await account.hover();
		await profile.click();
		await expect(page).toHaveURL(/\/account\/profile$/);
		expect(
			await page.evaluate(
				() => document.documentElement.scrollWidth <= innerWidth,
			),
		).toBe(true);
	});
}

test("语言菜单响应式切换不刷新页面并保留原生动画", async ({
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
			errors.push(request.url());
	});
	await page.setViewportSize({ width: 1440, height: 900 });
	const opening = [await signIn(page)];
	const originalDocument = await page.evaluateHandle(() => document);
	const resizing: number[] = [];
	const interactions: number[] = [];
	const header = page.getByRole("banner");
	const language = header
		.getByRole("button")
		.filter({
			has: page.getByRole("img", { name: "global", includeHidden: true }),
		});
	const languages = [
		{ width: 1440, code: "en", label: "English", previous: "简体中文" },
		{ width: 768, code: "fa-IR", label: "فارسی", previous: "English" },
		{ width: 390, code: "ja-JP", label: "日本語", previous: "فارسی" },
		{ width: 1440, code: "pt-BR", label: "Português", previous: "日本語" },
		{
			width: 768,
			code: "id-ID",
			label: "Bahasa Indonesia",
			previous: "Português",
		},
		{ width: 390, code: "bn-BD", label: "বাংলা", previous: "Bahasa Indonesia" },
		{ width: 1440, code: "zh-TW", label: "繁體中文", previous: "বাংলা" },
		{ width: 1440, code: "zh-CN", label: "简体中文", previous: "繁體中文" },
	];
	for (const entry of languages) {
		let started = performance.now();
		await page.setViewportSize({ width: entry.width, height: 900 });
		await expect(language).toBeInViewport();
		await expect(
			header.getByRole("button", { name: "Platform Admin" }),
		).toBeInViewport();
		resizing.push(performance.now() - started);

		started = performance.now();
		await language.hover();
		const menu = page.getByRole("menu").filter({
			has: page.getByRole("menuitem", { name: "English", exact: true }),
		});
		await expect(menu).toBeVisible();
		// Observe rc-motion's actual start and completion, not its initial visible frame.
		await page.waitForFunction(() =>
			Array.from(document.querySelectorAll(".ant-dropdown")).some((node) =>
				/ant-slide-up-(appear|enter)-active/.test(node.className),
			),
		);
		await page.waitForFunction(() =>
			Array.from(document.querySelectorAll(".ant-dropdown")).every(
				(node) => !/ant-slide-up-(appear|enter)-active/.test(node.className),
			),
		);
		interactions.push(performance.now() - started);
		await expect(menu.getByRole("menuitem")).toHaveText([
			/বাংলা/,
			/English/,
			/فارسی/,
			/Bahasa Indonesia/,
			/日本語/,
			/Português/,
			/简体中文/,
			/繁體中文/,
		]);
		await expect(
			menu.getByRole("menuitem", { name: entry.previous, exact: true }),
		).toHaveAttribute("aria-current", "true");
		const box = await menu.boundingBox();
		if (!box) throw new Error("Missing language menu");
		expect(box.width).toBeGreaterThanOrEqual(180);
		expect(box.x).toBeGreaterThanOrEqual(0);
		expect(box.x + box.width).toBeLessThanOrEqual(entry.width);
		expect(box.y + box.height).toBeLessThanOrEqual(900);
		await page.screenshot({
			path: testInfo.outputPath(
				`language-menu-${entry.width}-${entry.code}.png`,
			),
		});

		started = performance.now();
		await menu
			.getByRole("menuitem", { name: entry.label, exact: true })
			.click();
		await expect(page.locator("html")).toHaveAttribute("lang", entry.code);
		await expect(page.locator("html")).toHaveAttribute(
			"dir",
			entry.code === "fa-IR" ? "rtl" : "ltr",
		);
		await expect(menu).not.toBeVisible();
		interactions.push(performance.now() - started);
		await expect(language).toBeEnabled();
		await expect(language.getByRole("img", { name: "loading" })).toHaveCount(0);
		await expect(page).toHaveURL(/\/dashboard$/);
		expect(
			await originalDocument.evaluate((original) => original === document),
		).toBe(true);
		expect(
			await page.evaluate(
				() => document.documentElement.scrollWidth <= innerWidth,
			),
		).toBe(true);
	}
	const summarize = (samples: number[]) => {
		const sorted = [...samples].sort((a, b) => a - b);
		return {
			samples,
			p50: sorted[Math.ceil(sorted.length * 0.5) - 1],
			p95: sorted[Math.ceil(sorted.length * 0.95) - 1],
		};
	};
	const timings = {
		opening: summarize(opening),
		resizing: summarize(resizing),
		interactions: summarize(interactions),
	};
	await testInfo.attach("language-timings", {
		body: JSON.stringify(timings, null, 2),
		contentType: "application/json",
	});
	console.log("language-timings", JSON.stringify(timings));
	expect(timings.opening.p50).toBeLessThan(1500);
	expect(timings.opening.p95).toBeLessThan(3000);
	expect(Math.max(...opening)).toBeLessThan(5000);
	expect(timings.resizing.p95).toBeLessThan(700);
	expect(Math.max(...resizing)).toBeLessThan(800);
	expect(timings.interactions.p95).toBeLessThan(800);
	expect(Math.max(...interactions)).toBeLessThan(1000);
	expect(errors).toEqual([]);
});

for (const width of [1440, 390]) {
	test(`头像菜单打开偏好设置并保留语言和主题偏好（${width}px）`, async ({
		page,
	}) => {
		await page.setViewportSize({ height: 900, width });
		await signIn(page);
		const header = page.getByRole("banner");
		const account = header.getByRole("button", {
			name: "Platform Admin",
			exact: true,
		});
		await account.click();
		await expect(
			page.getByRole("menuitem", { name: "账号设置", exact: true }),
		).toBeVisible();
		await page.getByRole("menuitem", { name: "偏好设置", exact: true }).click();
		const drawer = page.getByRole("dialog", { name: "偏好设置", exact: true });
		await expect(drawer).toBeVisible();
		if (width === 390) await expect(drawer).toHaveCSS("width", "390px");
		await expect(page).toHaveURL(/\/dashboard$/);
		await drawer.getByRole("radio", { name: "深色模式", exact: true }).check();
		await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
		await drawer
			.getByRole("combobox", { name: "界面语言", exact: true })
			.click();
		await page.getByText("English", { exact: true }).click();
		await expect(page.locator("html")).toHaveAttribute("lang", "en");
		const preferences = page.getByRole("dialog", {
			name: "Preferences",
			exact: true,
		});
		await expect(preferences).toBeVisible();
		await expect(
			preferences.getByRole("radio", { name: "Dark mode", exact: true }),
		).toBeChecked();
		await preferences
			.getByRole("button", { name: "Close", exact: true })
			.click();
		await expect(preferences).not.toBeVisible();
		await header.getByRole("button", { name: "Search", exact: true }).click();
		const search = page.getByRole("dialog");
		await search.getByRole("textbox").fill("用户管理");
		await search.getByRole("menuitem", { name: "Users", exact: true }).click();
		await expect(page).toHaveURL(/\/organization\/users$/);
		await page.reload();
		const login = page.locator('input[autocomplete="username"]');
		await expect(header.or(login)).toBeVisible();
		// Production preview recreates its in-memory Fake login on document reload.
		if (await login.isVisible()) await signIn(page);
		await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
		await expect(page.locator("html")).toHaveAttribute("lang", "en");
		await account.click();
		await page
			.getByRole("menuitem", { name: "Preferences", exact: true })
			.click();
		await expect(
			preferences.getByRole("radio", { name: "Dark mode", exact: true }),
		).toBeChecked();
		await expect(
			preferences.getByRole("combobox", {
				name: "Display language",
				exact: true,
			}),
		).toBeVisible();
	});
}

test.describe("触摸屏顶栏菜单", () => {
	test.use({
		hasTouch: true,
		isMobile: true,
		viewport: { width: 390, height: 844 },
	});

	test("语言菜单支持触摸选择和点击外部关闭", async ({ page }) => {
		await signIn(page);
		await page
			.getByRole("banner")
			.getByRole("button", { name: "语言", exact: true })
			.tap();
		const english = page.getByRole("menuitem", {
			name: "English",
			exact: true,
		});
		await expect(english).toBeVisible();
		await english.tap();
		await expect(page.locator("html")).toHaveAttribute("lang", "en");
		await expect(english).not.toBeVisible();
		await page
			.getByRole("banner")
			.getByRole("button", { name: "Language", exact: true })
			.tap();
		await expect(english).toHaveAttribute("aria-current", "true");
		await page
			.getByTestId("admin-shell-page-content")
			.tap({ position: { x: 8, y: 250 } });
		await expect(english).not.toBeVisible();
	});

	test("原生触摸触发支持打开、导航与点击外部关闭", async ({ page }) => {
		await signIn(page);
		const account = page.getByRole("banner").getByRole("button", {
			name: "Platform Admin",
			exact: true,
		});
		await account.tap();
		const profile = page.getByRole("menuitem", {
			name: "个人资料",
			exact: true,
		});
		await expect(profile).toBeVisible();
		await profile.tap();
		await expect(page).toHaveURL(/\/account\/profile$/);
		await expect(profile).not.toBeVisible();

		await account.tap();
		await expect(profile).toBeVisible();
		await page.getByTestId("admin-shell-page-content").tap({
			position: { x: 8, y: 8 },
		});
		await expect(profile).not.toBeVisible();
	});
});
