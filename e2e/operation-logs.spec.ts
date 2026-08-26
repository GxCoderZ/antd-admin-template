import { expect, type Page, test } from "@playwright/test";

const auditDetailLabels = [
	"日志 ID",
	"请求 ID",
	"操作人",
	"操作人 ID",
	"动作",
	"功能模块",
	"目标",
	"目标类型",
	"目标 ID",
	"结果",
	"IP 地址",
	"请求方法",
	"请求路径",
	"失败原因",
	"设备",
	"浏览器",
	"操作系统",
	"耗时",
	"变更前",
	"变更后",
	"User-Agent",
	"发生时间",
];

const loginDetailLabels = [
	"日志 ID",
	"请求 ID",
	"用户 ID",
	"登录标识",
	"认证方式",
	"多因素认证",
	"结果",
	"IP 地址",
	"登录地点",
	"设备",
	"浏览器",
	"操作系统",
	"语言",
	"Accept-Language",
	"时区",
	"耗时",
	"失败原因",
	"会话 ID",
	"User-Agent",
	"登录时间",
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
	await page
		.getByRole("menuitem", { name: menuItemName, exact: true })
		.click();
	await expect(page.getByTestId(tableTestId)).toBeVisible();
	await page.getByRole("button", { name: /查看日志/ }).first().click();

	const drawer = page.locator(".ant-drawer");
	await expect(drawer).toBeVisible();
	await expect(drawer.locator(".ant-descriptions-item-label")).toHaveText(
		expectedLabels,
	);

	await drawer.locator(".ant-drawer-close").click();
}

test("操作审计和登录日志详情展示全部字段", async ({ page }) => {
	await login(page);
	await page
		.getByRole("menuitem", { name: "审计日志", exact: true })
		.click();
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
	await page
		.getByRole("menuitem", { name: "审计日志", exact: true })
		.click();
	await page
		.getByRole("menuitem", { name: "操作审计", exact: true })
		.click();

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
