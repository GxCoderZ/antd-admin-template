import { expect, type Page, test } from "@playwright/test";

const auditDetailLabels = [
	"动作",
	"功能模块",
	"结果",
	"发生时间",
	"操作人",
	"操作人 ID",
	"目标",
	"目标类型",
	"目标 ID",
	"耗时",
	"失败原因",
	"请求 ID",
	"IP 地址",
	"请求方法",
	"请求路径",
	"设备",
	"浏览器",
	"操作系统",
	"变更前",
	"变更后",
	"日志 ID",
	"User-Agent",
];

const loginDetailLabels = [
	"登录标识",
	"结果",
	"登录时间",
	"认证方式",
	"多因素认证",
	"耗时",
	"失败原因",
	"日志 ID",
	"用户 ID",
	"请求 ID",
	"IP 地址",
	"登录地点",
	"设备",
	"浏览器",
	"操作系统",
	"语言",
	"Accept-Language",
	"时区",
	"会话 ID",
	"User-Agent",
];

async function login(page: Page) {
	await page.goto("/login");
	await page.locator('input[autocomplete="username"]').fill("admin");
	await page.locator('input[autocomplete="current-password"]').fill("admin");
	await page.locator('button[type="submit"]').click();
	await expect(page).toHaveURL(/\/dashboard$/);
}

async function expectDetailFields(
	page: Page,
	menuItemName: string,
	tableTestId: string,
	expectedLabels: string[],
) {
	await page.getByRole("menuitem", { name: menuItemName, exact: true }).click();
	await expect(page.getByTestId(tableTestId)).toBeVisible();
	await page
		.getByRole("button", { name: /查看日志/ })
		.first()
		.click();

	const drawer = page.locator(".ant-drawer");
	await expect(drawer).toBeVisible();
	await expect(drawer.locator(".ant-descriptions-item-label")).toHaveText(
		expectedLabels,
	);

	await drawer.locator(".ant-drawer-close").click();
}

for (const width of [1440, 390]) {
	test(`日志通过系统管理下的日志管理分组访问（${width}px）`, async ({
		page,
	}, testInfo) => {
		await page.setViewportSize({ height: 900, width });
		await login(page);
		const mobile = width === 390;
		const navigation = page.getByRole(mobile ? "dialog" : "complementary");
		if (mobile) {
			await page.getByRole("button", { name: "打开菜单" }).click();
		}
		await expect(navigation.getByRole("menuitem")).toHaveText([
			"仪表盘",
			"系统管理",
			"关于系统",
		]);
		await navigation
			.getByRole("menuitem", { name: "系统管理", exact: true })
			.click();
		await expect(
			navigation.getByRole("menuitem", { name: "审计日志", exact: true }),
		).toHaveCount(0);
		await expect(
			navigation.getByRole("menuitem", {
				name: /^(用户管理|角色管理|部门管理|岗位管理|字典管理|公告管理|日志管理|系统设置|关于系统)$/,
			}),
		).toHaveText([
			"用户管理",
			"角色管理",
			"部门管理",
			"岗位管理",
			"字典管理",
			"公告管理",
			"系统设置",
			"日志管理",
			"关于系统",
		]);
		const logGroup = navigation.getByRole("menuitem", {
			name: "日志管理",
			exact: true,
		});
		await expect(logGroup.getByLabel("file-search")).toBeVisible();
		await expect(logGroup).toHaveAttribute("aria-expanded", "false");
		await expect(
			navigation.getByRole("menuitem", { name: "登录日志", exact: true }),
		).toBeHidden();
		await logGroup.click();
		await expect(logGroup).toHaveAttribute("aria-expanded", "true");
		await expect(
			navigation.getByRole("menuitem", { name: "操作审计", exact: true }),
		).toBeVisible();
		await navigation
			.getByRole("menuitem", { name: "登录日志", exact: true })
			.click();
		await expect(page).toHaveURL(/\/operations\/login-logs$/);
		const loginTable = page.getByTestId("login-log-table-card");
		await expect(loginTable.getByRole("row").nth(1)).toBeVisible();
		await expect(loginTable.locator(".ant-table-placeholder")).toHaveCount(0);
		await expect(loginTable.locator(".ant-spin-spinning")).toHaveCount(0);
		if (mobile) {
			await expect(navigation).toBeHidden();
			await page.getByRole("button", { name: "打开菜单" }).click();
		} else {
			await expect(page.getByRole("banner").getByRole("navigation")).toHaveText(
				"系统管理/日志管理/登录日志",
			);
		}
		await expect(
			navigation.getByRole("menuitem", { name: "系统管理", exact: true }),
		).toHaveAttribute("aria-expanded", "true");
		await expect(logGroup).toHaveAttribute("aria-expanded", "true");
		await expect(
			navigation.getByRole("menuitem", { name: "登录日志", exact: true }),
		).toHaveClass(/ant-menu-item-selected/);
		await navigation
			.getByRole("menuitem", { name: "操作审计", exact: true })
			.click();
		await expect(page).toHaveURL(/\/operations\/audit-logs$/);
		await expect(page.getByTestId("audit-log-table-card")).toBeVisible();
		if (mobile) {
			await expect(navigation).toBeHidden();
			await page.getByRole("button", { name: "打开菜单" }).click();
		} else {
			await expect(page.getByRole("banner").getByRole("navigation")).toHaveText(
				"系统管理/日志管理/操作审计",
			);
		}
		await logGroup.click();
		await expect(
			navigation.getByRole("menuitem", { name: "操作审计", exact: true }),
		).toBeHidden();
		if (mobile) {
			await page.keyboard.press("Escape");
			await expect(navigation).toBeHidden();
		}
		await page.getByRole("tab", { name: /登录日志/ }).click();
		await expect(page).toHaveURL(/\/operations\/login-logs$/);
		if (mobile) {
			await page.getByRole("button", { name: "打开菜单" }).click();
		}
		await expect(logGroup).toHaveAttribute("aria-expanded", "true");
		await expect(
			navigation.getByRole("menuitem", { name: "登录日志", exact: true }),
		).toHaveClass(/ant-menu-item-selected/);
		await expect(loginTable.locator(".ant-spin-spinning")).toHaveCount(0);
		await expect(navigation).toBeInViewport({ ratio: 1 });
		await page.screenshot({
			animations: "disabled",
			path: testInfo.outputPath(`system-log-navigation-${width}.png`),
			fullPage: true,
		});
		expect(
			await page.evaluate(
				() => document.documentElement.scrollWidth <= window.innerWidth,
			),
		).toBe(true);
		await navigation
			.getByRole("menuitem", { name: "关于系统", exact: true })
			.click();
		await expect(page).toHaveURL(/\/system\/about$/);
		await expect(page.getByTestId("about-runtime-service")).toBeVisible();
		if (mobile) {
			await expect(navigation).toBeHidden();
			await expect(page.getByTestId("admin-shell-mobile-title")).toHaveText(
				"关于系统",
			);
		} else {
			await expect(page.getByRole("banner").getByRole("navigation")).toHaveText(
				"关于系统",
			);
		}
		await page.screenshot({
			animations: "disabled",
			path: testInfo.outputPath(`about-root-navigation-${width}.png`),
		});
		if (mobile) {
			await page.getByRole("button", { name: "打开菜单" }).click();
		}
		await navigation
			.getByRole("menuitem", { name: "仪表盘", exact: true })
			.click();
		await expect(page).toHaveURL(/\/dashboard$/);
		await page.getByRole("button", { name: "搜索", exact: true }).click();
		const search = page.getByRole("dialog");
		await search.getByRole("textbox").fill("关于系统");
		await search
			.getByRole("menuitem", { name: "关于系统", exact: true })
			.click();
		await expect(page).toHaveURL(/\/system\/about$/);
		await expect(search).toBeHidden();
	});
}

test("操作审计和登录日志详情展示全部字段", async ({ page }) => {
	await login(page);
	await page.getByRole("menuitem", { name: "系统管理", exact: true }).click();
	await page.getByRole("menuitem", { name: "日志管理", exact: true }).click();
	await expectDetailFields(
		page,
		"操作审计",
		"audit-log-table-card",
		auditDetailLabels,
	);
	await expectDetailFields(
		page,
		"登录日志",
		"login-log-table-card",
		loginDetailLabels,
	);
});

test("操作审计在临界宽度保持稳定的响应式列", async ({ page }) => {
	await page.setViewportSize({ height: 760, width: 1286 });
	await login(page);
	await page.getByRole("menuitem", { name: "系统管理", exact: true }).click();
	await page.getByRole("menuitem", { name: "日志管理", exact: true }).click();
	await page.getByRole("menuitem", { name: "操作审计", exact: true }).click();

	const tableCard = page.getByTestId("audit-log-table-card");
	await expect(tableCard).toBeVisible();
	await expect(tableCard.getByRole("row").nth(1)).toBeVisible();

	const scrollContainer = page.locator(".admin-shell-scroll-content");
	await expect
		.poll(() =>
			scrollContainer.evaluate(
				(element) => getComputedStyle(element).scrollbarGutter,
			),
		)
		.toBe("stable");

	const headerSignatures = await tableCard.evaluate(async (card) => {
		const signatures: string[] = [];
		for (let sample = 0; sample < 30; sample += 1) {
			signatures.push(
				Array.from(card.querySelectorAll("th"))
					.map((header) => header.textContent?.trim() ?? "")
					.filter(Boolean)
					.join("|"),
			);
			await new Promise(requestAnimationFrame);
		}
		return signatures;
	});

	expect(new Set(headerSignatures).size).toBe(1);
});
