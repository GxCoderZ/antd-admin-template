import { expect, test, type Locator } from "@playwright/test";

async function expectHeldBrandRipple(brand: Locator) {
	const state = await brand.evaluate(async (element) => {
		const animations = element.getAnimations({ subtree: true });
		const [animation] = animations;
		if (animations.length !== 1 || !(animation instanceof CSSAnimation))
			throw new Error("Expected one brand ripple animation");
		const running = animation.playState;
		await animation.finished;
		const circle = element.querySelector("[data-ripple-id]");
		if (!circle) throw new Error("Missing brand ripple circle");
		const ripple = getComputedStyle(circle);
		return {
			name: animation.animationName,
			running,
			held: element.getAttribute("data-ripple-state"),
			opacity: Number(ripple.opacity),
			radius: ripple.borderRadius,
			background: getComputedStyle(element).backgroundColor,
			shadow: getComputedStyle(element).boxShadow,
			overlay: getComputedStyle(element, "::before").content,
		};
	});
	expect(state.name).toContain("press-ripple");
	expect(state.running).toBe("running");
	expect(state.held).toBe("pressed");
	expect(state.opacity).toBeGreaterThan(0);
	expect(state.radius).toBe("50%");
	expect(state.background).toBe("rgba(0, 0, 0, 0)");
	expect(state.shadow).toBe("none");
	expect(state.overlay).toBe("none");
}

async function expectBrandRippleRelease(brand: Locator) {
	await brand.evaluate(async (element) => {
		const fades = element
			.getAnimations({ subtree: true })
			.filter(
				(animation) =>
					animation instanceof CSSAnimation &&
					animation.animationName.includes("rippleFadeOut"),
			);
		if (!fades.length) throw new Error("Missing brand ripple fade animation");
		await Promise.all(fades.map((fade) => fade.finished));
	});
	await expect(brand).not.toHaveAttribute("data-rippling");
}

test("侧边导航品牌沿用统一的字号、Logo 和对齐规格", async ({
	page,
}, testInfo) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto("/login");
	await page.locator('input[autocomplete="username"]').fill("admin");
	await page.locator('input[autocomplete="current-password"]').fill("admin");
	await page.locator('button[type="submit"]').click();
	await expect(page).toHaveURL(/\/dashboard$/);

	const brand = page.getByTestId("admin-shell-sidebar-logo");
	await expect(brand).toBeVisible();
	await expect(brand.getByText("React Antd Admin", { exact: true })).toHaveCSS(
		"font-size",
		"16px",
	);
	await expect(brand.getByText("React Antd Admin", { exact: true })).toHaveCSS(
		"line-height",
		"24px",
	);
	const logo = await brand.locator("svg, img").first().boundingBox();
	expect(logo?.width).toBe(22);
	expect(logo?.height).toBe(22);
	expect(logo?.x).toBe(16);
	expect(logo?.y).toBe(16.5);
	const title = await brand
		.getByTitle("React Antd Admin", { exact: true })
		.boundingBox();
	expect(title?.x).toBe(44);
	expect(title?.y).toBe(15.5);
	await page.screenshot({
		path: testInfo.outputPath("sidebar-brand.png"),
	});
	const link = page.getByRole("link", { name: "仪表盘", exact: true });
	const bounds = await link.boundingBox();
	expect(bounds?.x).toBe(0);
	expect(bounds?.y).toBe(0);
	expect(bounds?.height).toBe(56);
	expect(bounds).toEqual(await brand.boundingBox());
	for (const target of [
		brand.locator("svg, img").first(),
		brand.getByTitle("React Antd Admin"),
	]) {
		await target.hover();
		await expect(link).not.toHaveAttribute("data-rippling");
		await page.mouse.down();
		await expectHeldBrandRipple(link);
		expect(await link.boundingBox()).toEqual(bounds);
		await page.screenshot({
			path: testInfo.outputPath("sidebar-brand-held.png"),
		});
		await page.mouse.up();
		await expectBrandRippleRelease(link);
	}
});

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
					.flatMap((tooltip) =>
						(tooltip.parentElement ?? tooltip).getAnimations({ subtree: true }),
					)
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
			await expect(title).toHaveCSS("line-height", "24px");
			const logo = await brand.locator("svg, img").first().boundingBox();
			expect(logo?.width).toBe(22);
			expect(logo?.height).toBe(22);
			expect(logo?.x).toBe(16);
			expect(logo?.y).toBe(16.5);
			const titleBox = await title.boundingBox();
			expect(titleBox?.x).toBe(44);
			expect(titleBox?.y).toBe(15.5);
		}
		if (width >= 768) {
			const activeBrand = page.getByRole("link", {
				name: "仪表盘",
				exact: true,
			});
			const bounds = await activeBrand.boundingBox();
			expect(bounds?.x).toBe(0);
			expect(bounds?.y).toBe(0);
			expect(bounds?.height).toBe(width >= 992 ? 55 : 56);
			await activeBrand.hover({ position: { x: 2, y: 2 } });
			started = performance.now();
			await page.mouse.down();
			await expect(activeBrand).toHaveAttribute("data-ripple-state", "pressed");
			timings.interaction.push(performance.now() - started);
			await expectHeldBrandRipple(activeBrand);
			expect(await activeBrand.boundingBox()).toEqual(bounds);
			await page.screenshot({
				path: testInfo.outputPath(`brand-held-${width}.png`),
			});
			await page.mouse.up();
			await expectBrandRippleRelease(activeBrand);
		} else {
			await expect(
				page.getByRole("link", { name: "仪表盘", exact: true }),
			).toHaveCount(0);
			await expect(
				page.getByTestId("admin-shell-mobile-title"),
			).not.toHaveAttribute("data-rippling");
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
	const starts: Animation["startTime"][] = [];
	for (let click = 0; click < 3; click += 1) {
		await title.click();
		starts.push(
			await brand.evaluate(async (element) => {
				const fade = element
					.getAnimations({ subtree: true })
					.findLast(
						(animation) =>
							animation instanceof CSSAnimation &&
							animation.animationName.includes("rippleFadeOut"),
					);
				if (!fade) throw new Error("Missing repeated brand ripple");
				await fade.ready;
				return fade.startTime;
			}),
		);
	}
	expect(starts).not.toContain(null);
	expect(new Set(starts).size).toBe(3);
	await expectBrandRippleRelease(brand);
	await brand.focus();
	await page.keyboard.down("Enter");
	await expectHeldBrandRipple(brand);
	await expect(brand).toBeFocused();
	await expect(brand).not.toHaveCSS("outline-style", "none");
	await page.keyboard.up("Enter");
	await expectBrandRippleRelease(brand);
	await page.emulateMedia({ reducedMotion: "reduce" });
	await brand.hover();
	await page.mouse.down();
	await expect(brand.locator("[data-ripple-id]")).toHaveCount(0);
	await page.mouse.up();
	await page.emulateMedia({ reducedMotion: "no-preference" });
	await header
		.getByRole("button", { name: "Platform Admin", exact: true })
		.click();
	await page.getByRole("menuitem", { name: "偏好设置", exact: true }).click();
	for (const mode of ["侧边菜单", "顶部菜单", "侧边菜单", "顶部菜单"]) {
		started = performance.now();
		await preferences.getByRole("radio", { name: mode, exact: true }).check();
		const navigationBrand =
			mode === "顶部菜单"
				? brand
				: page.getByTestId("admin-shell-sidebar-logo");
		await expect(navigationBrand).toBeVisible();
		const logo = await navigationBrand
			.locator("svg, img")
			.first()
			.boundingBox();
		expect(logo?.width).toBe(22);
		expect(logo?.height).toBe(22);
		expect(logo?.x).toBe(16);
		expect(logo?.y).toBe(16.5);
		const titleBox = await (
			mode === "顶部菜单"
				? navigationBrand.getByRole("heading", {
						name: "React Antd Admin",
						exact: true,
					})
				: navigationBrand.getByTitle("React Antd Admin", { exact: true })
		).boundingBox();
		expect(titleBox?.x).toBe(44);
		expect(titleBox?.y).toBe(15.5);
		await expect(header).toHaveCSS("height", "56px");
		timings.interaction.push(performance.now() - started);
	}
	await preferences.getByRole("button", { name: "关闭", exact: true }).click();
	await expect(preferences).toBeHidden();

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

test("自定义 Logo 在侧边和顶部导航保持相同尺寸与比例", async ({
	page,
}, testInfo) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto("/login");
	await page.locator('input[autocomplete="username"]').fill("admin");
	await page.locator('input[autocomplete="current-password"]').fill("admin");
	await page.locator('button[type="submit"]').click();
	await expect(page).toHaveURL(/\/dashboard$/);
	await page.getByRole("menuitem", { name: "系统管理", exact: true }).click();
	await page.getByRole("menuitem", { name: "系统设置", exact: true }).click();
	await expect(page).toHaveURL(/\/system\/settings$/);
	const image = await page.evaluate(() => {
		const canvas = document.createElement("canvas");
		canvas.width = 48;
		canvas.height = 32;
		const context = canvas.getContext("2d");
		if (!context) throw new Error("Canvas is unavailable");
		context.fillStyle = "steelblue";
		context.fillRect(0, 0, 48, 32);
		return canvas.toDataURL("image/png").split(",")[1];
	});
	if (!image) throw new Error("Missing logo image");
	await page.locator('input[type="file"]').setInputFiles({
		name: "navigation-logo.png",
		mimeType: "image/png",
		buffer: Buffer.from(image, "base64"),
	});
	await page.getByRole("button", { name: "保存", exact: true }).click();
	await expect(page.getByText("系统设置已保存", { exact: true })).toBeVisible();
	const header = page.getByRole("banner");
	for (const mode of ["侧边菜单", "顶部菜单", "混合菜单", "顶部菜单"]) {
		await header
			.getByRole("button", { name: "Platform Admin", exact: true })
			.click();
		await page.getByRole("menuitem", { name: "偏好设置", exact: true }).click();
		const preferences = page.getByRole("dialog", {
			name: "偏好设置",
			exact: true,
		});
		await preferences.getByRole("radio", { name: mode, exact: true }).check();
		await preferences
			.getByRole("button", { name: "关闭", exact: true })
			.click();
		await expect(preferences).toBeHidden();
		const brand =
			mode === "顶部菜单"
				? header.getByRole("link", { name: "仪表盘", exact: true })
				: page.getByTestId("admin-shell-sidebar-logo");
		const logo = brand.locator("img");
		await expect(logo).toBeVisible();
		await expect(logo).toHaveCSS("width", "22px");
		await expect(logo).toHaveCSS("height", "22px");
		await expect(logo).toHaveCSS("object-fit", "contain");
		const logoBox = await logo.boundingBox();
		expect(logoBox?.x).toBe(16);
		expect(logoBox?.y).toBe(16.5);
		const titleBox = await (
			mode === "顶部菜单"
				? brand.getByRole("heading", { name: "React Antd Admin", exact: true })
				: brand.getByTitle("React Antd Admin", { exact: true })
		).boundingBox();
		expect(titleBox?.x).toBe(44);
		expect(titleBox?.y).toBe(15.5);
		expect(
			await logo.evaluate((element: HTMLImageElement) => ({
				loaded: element.complete,
				width: element.naturalWidth,
				height: element.naturalHeight,
			})),
		).toEqual({ loaded: true, width: 48, height: 32 });
		await page.screenshot({
			path: testInfo.outputPath(`custom-logo-${mode}.png`),
		});
	}
});
