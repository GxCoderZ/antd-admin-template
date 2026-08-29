import { expect, test, type Locator, type Page } from "@playwright/test";

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

async function expectHeldRipple(
	button: Locator,
	pseudoElement: string | null = "::after",
) {
	const result = await button.evaluate(async (target, pseudoElement) => {
		const animations = target
			.getAnimations({ subtree: true })
			.filter((animation) => animation instanceof CSSAnimation);
		const [ripple] = animations;
		if (animations.length !== 1 || !ripple)
			throw new Error(`Expected one press animation, got ${animations.length}`);
		await new Promise(requestAnimationFrame);
		const style = getComputedStyle(target, pseudoElement);
		const started = {
			name: ripple.animationName,
			opacity: Number(style.opacity),
			display: style.display,
			playState: ripple.playState,
		};
		await ripple.finished;
		return {
			started,
			finished: ripple.playState,
			opacity: Number(getComputedStyle(target, pseudoElement).opacity),
			pressOverlay: getComputedStyle(target, "::before").content,
		};
	}, pseudoElement);
	expect(result.started.name).toContain("press-ripple");
	expect(result.started.opacity).toBeGreaterThan(0);
	expect(result.started.display).toBe("block");
	expect(result.started.playState).toBe("running");
	expect(result.finished).toBe("finished");
	expect(result.opacity).toBeGreaterThan(0);
	expect(result.pressOverlay).toBe("none");
	await expect(button).toHaveAttribute("data-ripple-state", "pressed");
	if (pseudoElement)
		await expect(button).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
}

async function expectRippleRelease(button: Locator, removed = false) {
	const name = await button.evaluate(async (target) => {
		const fade = target
			.getAnimations({ subtree: true })
			.find(
				(animation) =>
					animation instanceof CSSAnimation &&
					animation.animationName.includes("rippleFadeOut"),
			);
		if (!(fade instanceof CSSAnimation) || fade.playState !== "running")
			throw new Error("Missing ripple release animation");
		await fade.finished;
		return fade.animationName;
	});
	expect(name).toContain("rippleFadeOut");
	if (removed) await expect(button).toHaveCount(0);
	else await expect(button).not.toHaveAttribute("data-rippling");
}

async function expectMenuRippleCorners(ripple: Locator, rounded: boolean) {
	const radius = await ripple.evaluate((element) => {
		const clip = element.parentElement;
		if (!clip) throw new Error("Missing menu ripple clipping layer");
		return getComputedStyle(clip).borderRadius;
	});
	if (rounded) expect(Number.parseFloat(radius)).toBeGreaterThan(0);
	else expect(radius).toBe("0px");
}

async function getMenuRippleBounds(ripple: Locator) {
	return ripple.evaluate((element) => {
		const clip = element.parentElement;
		if (!clip) throw new Error("Missing menu ripple clipping layer");
		const bounds = clip.getBoundingClientRect();
		return {
			height: bounds.height,
			width: bounds.width,
			x: bounds.x,
			y: bounds.y,
		};
	});
}

for (const width of [1440, 768, 390]) {
	test(`侧边栏整项水波纹保留选中与导航（${width}px）`, async ({
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
		await page.setViewportSize({ width, height: 900 });
		await signIn(page);
		if (width === 390)
			await page.getByRole("button", { name: "打开菜单", exact: true }).click();
		if (width === 768)
			await page.getByRole("button", { name: "展开菜单", exact: true }).click();
		const dashboard = page.getByRole("menuitem", {
			name: "仪表盘",
			exact: true,
		});
		await dashboard.hover({ position: { x: 4, y: 20 } });
		const selectedColor = await dashboard.evaluate(
			(item) => getComputedStyle(item).backgroundColor,
		);
		const bounds = await dashboard.boundingBox();
		await page.mouse.down();
		const ripple = dashboard.locator('[data-rippling="true"]');
		await expectHeldRipple(ripple, null);
		await expectMenuRippleCorners(ripple, true);
		await expect(dashboard).toHaveCSS("background-color", selectedColor);
		expect(await dashboard.boundingBox()).toEqual(bounds);
		const clipped = await ripple.evaluate((element) => {
			const layer = element.parentElement;
			const item = element.closest('[role="menuitem"]');
			if (!layer || !item) throw new Error("Missing menu ripple layer");
			const clip = layer.getBoundingClientRect();
			const host = item.getBoundingClientRect();
			return {
				width: clip.width === host.width,
				height: clip.height === host.height,
				overflow: getComputedStyle(layer).overflow,
				pointerEvents: getComputedStyle(layer).pointerEvents,
			};
		});
		expect(clipped).toEqual({
			width: true,
			height: true,
			overflow: "hidden",
			pointerEvents: "none",
		});
		await page.screenshot({
			path: testInfo.outputPath(`sidebar-ripple-${width}.png`),
		});
		await page.mouse.move(width - 2, 600);
		await page.mouse.up();
		await expectRippleRelease(ripple, true);

		const group = page.getByRole("menuitem", { name: "系统管理", exact: true });
		await group.hover({ position: { x: 4, y: 20 } });
		await page.mouse.down();
		const groupRipple = group.locator('[data-rippling="true"]');
		await expectHeldRipple(groupRipple, null);
		await expect(group).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
		await page.mouse.up();
		await expectRippleRelease(groupRipple, true);
		await expect(group).toHaveAttribute("aria-expanded", "true");
		await page.getByRole("menuitem", { name: "关于系统", exact: true }).click();
		await expect(page).toHaveURL(/\/system\/about$/);
		expect(
			await page.evaluate(
				() => document.documentElement.scrollWidth <= innerWidth,
			),
		).toBe(true);
		expect(errors).toEqual([]);
	});
}

test("横向导航及两级子菜单共享长按水波纹并保留原生交互", async ({
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
	await signIn(page);
	const header = page.getByRole("banner");
	await header.getByRole("button", { name: "Platform Admin" }).click();
	await page.getByRole("menuitem", { name: "偏好设置", exact: true }).click();
	const preferences = page.getByRole("dialog", { name: "偏好设置" });
	await preferences
		.getByRole("radio", { name: "顶部菜单", exact: true })
		.check();
	await preferences.getByRole("button", { name: "关闭", exact: true }).click();
	await expect(preferences).toBeHidden();
	const dashboard = header.getByRole("menuitem", {
		name: "仪表盘",
		exact: true,
	});
	const selection = await dashboard.evaluate((item) => ({
		background: getComputedStyle(item).backgroundColor,
		underline: getComputedStyle(item, "::after").borderBottom,
	}));
	expect(selection.underline).toContain("2px solid");
	const bounds = await dashboard.boundingBox();
	await dashboard.hover({ position: { x: 4, y: 20 } });
	await expect(page.locator('[data-rippling="true"]')).toHaveCount(0);
	await page.mouse.down();
	const ripple = dashboard.locator('[data-rippling="true"]');
	await expectHeldRipple(ripple, null);
	await expectMenuRippleCorners(ripple, false);
	expect(await getMenuRippleBounds(ripple)).toEqual(await dashboard.boundingBox());
	expect(await dashboard.boundingBox()).toEqual(bounds);
	expect(
		await dashboard.evaluate((item) => ({
			background: getComputedStyle(item).backgroundColor,
			underline: getComputedStyle(item, "::after").borderBottom,
		})),
	).toEqual(selection);
	await page.screenshot({
		path: testInfo.outputPath("top-navigation-held.png"),
	});
	await page.mouse.up();
	await expectRippleRelease(ripple, true);
	for (const key of ["Enter", "Space"]) {
		await dashboard.focus();
		await page.keyboard.down(key);
		await expectHeldRipple(ripple, null);
		await expect(dashboard).toBeFocused();
		await expect(dashboard).toHaveCSS("outline-style", "solid");
		await page.keyboard.up(key);
		await expectRippleRelease(ripple, true);
	}
	const starts: Animation["startTime"][] = [];
	for (let click = 0; click < 3; click += 1) {
		await dashboard.click();
		starts.push(
			await ripple.evaluate(async (element) => {
				const fade = element
					.getAnimations()
					.find(
						(animation) =>
							animation instanceof CSSAnimation &&
							animation.animationName.includes("rippleFadeOut"),
					);
				if (!fade) throw new Error("Missing repeated menu ripple");
				await fade.ready;
				return fade.startTime;
			}),
		);
	}
	expect(starts).not.toContain(null);
	expect(new Set(starts).size).toBe(3);
	await expectRippleRelease(ripple, true);
	const system = header.getByRole("menuitem", {
		name: "系统管理",
		exact: true,
	});
	await system.hover();
	const users = page.getByRole("menuitem", { name: "用户管理", exact: true });
	await expect(users).toBeVisible();
	await expect(page.locator('[data-rippling="true"]')).toHaveCount(0);
	for (const item of [system, users]) {
		await item.hover({ position: { x: 4, y: 20 } });
		await page.mouse.down();
		const itemRipple = page.locator('[data-rippling="true"]');
		await expectHeldRipple(itemRipple, null);
		await expectMenuRippleCorners(itemRipple, item !== system);
		if (item === system)
			expect(await getMenuRippleBounds(itemRipple)).toEqual(
				await item.locator("..").boundingBox(),
			);
		await expect(item).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
		await page.screenshot({
			path: testInfo.outputPath(
				item === system ? "top-group-held.png" : "top-popup-held.png",
			),
		});
		await page.mouse.up();
		await expectRippleRelease(itemRipple, true);
	}
	await expect(page).toHaveURL(/\/organization\/users$/);
	await system.hover();
	await users.hover({ position: { x: 4, y: 20 } });
	const selectedBackground = await users.evaluate(
		(item) => getComputedStyle(item).backgroundColor,
	);
	expect(selectedBackground).not.toBe("rgba(0, 0, 0, 0)");
	await page.mouse.down();
	const selectedRipple = users.locator('[data-rippling="true"]');
	await expectHeldRipple(selectedRipple, null);
	await expect(users).toHaveCSS("background-color", selectedBackground);
	await page.mouse.up();
	await expectRippleRelease(selectedRipple, true);
	await system.hover();
	const logs = page.getByRole("menuitem", { name: "日志管理", exact: true });
	await logs.hover();
	const audit = page.getByRole("menuitem", { name: "操作审计", exact: true });
	await expect(audit).toBeVisible();
	await expect(page.locator('[data-rippling="true"]')).toHaveCount(0);
	for (const item of [logs, audit]) {
		await item.hover({ position: { x: 4, y: 20 } });
		await page.mouse.down();
		const itemRipple = item.locator('[data-rippling="true"]');
		await expectHeldRipple(itemRipple, null);
		await expectMenuRippleCorners(itemRipple, true);
		await page.mouse.up();
		await expectRippleRelease(itemRipple, true);
	}
	await expect(page).toHaveURL(/\/operations\/audit-logs$/);
	expect(
		await page.evaluate(
			() => document.documentElement.scrollWidth <= innerWidth,
		),
	).toBe(true);
	expect(errors).toEqual([]);
});

for (const width of [1440, 768, 390]) {
	test(`顶栏保留 Pro 尺寸并使用单一项目水波纹（${width}px）`, async ({
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

		for (const name of [...names, "Platform Admin"]) {
			const button = header.getByRole("button", { name, exact: true });
			await button.hover();
			await expect(button).not.toHaveCSS(
				"background-color",
				"rgba(0, 0, 0, 0)",
			);
			const size = await button.boundingBox();
			await page.mouse.down();
			await expectHeldRipple(button);
			expect(await button.boundingBox()).toEqual(size);
			// Hold through animation completion, then release outside to avoid activation.
			await page.mouse.move(0, 0);
			await page.mouse.up();
			await expectRippleRelease(button);
		}
		const language = header.getByRole("button", { name: "语言", exact: true });
		await language.focus();
		await page.keyboard.down("Space");
		await expectHeldRipple(language);
		await expect(language).toBeFocused();
		await expect(language).toHaveCSS("outline-style", "solid");
		await page.keyboard.down("Space");
		await expect(language).toHaveAttribute("data-ripple-state", "pressed");
		await page.keyboard.up("Space");
		await expectRippleRelease(language);

		const profile = page.getByRole("menuitem", {
			name: "个人资料",
			exact: true,
		});
		await account.hover();
		await expect(profile).toBeVisible();
		const rippleStarts: Animation["startTime"][] = [];
		for (let click = 0; click < 3; click += 1) {
			await account.click();
			await expect(account).toHaveAttribute("data-ripple-state", "released");
			rippleStarts.push(
				await account.evaluate(async (button) => {
					const fade = button
						.getAnimations({ subtree: true })
						.find(
							(animation) =>
								animation instanceof CSSAnimation &&
								animation.animationName.includes("rippleFadeOut"),
						);
					if (!fade) throw new Error("Missing ripple for repeated press");
					await fade.ready;
					return fade.startTime;
				}),
			);
		}
		expect(rippleStarts).not.toContain(null);
		expect(new Set(rippleStarts).size).toBe(3);
		await expectRippleRelease(account);
		await expect(profile).toBeVisible();
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
		await page.emulateMedia({ reducedMotion: "reduce" });
		await language.hover();
		await page.mouse.down();
		expect(
			await language.evaluate(
				(button) => getComputedStyle(button, "::after").display,
			),
		).toBe("none");
		await page.mouse.move(0, 0);
		await page.mouse.up();
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
	const language = header.getByRole("button").filter({
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
