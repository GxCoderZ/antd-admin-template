import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConfigProvider } from "antd";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { LocalePreferencesProvider } from "../../app/LocalePreferencesProvider";
import { i18n } from "../../i18n";
import { PositionsPage } from "./PositionsPage";

const mocks = vi.hoisted(() => ({
	createPlatformPosition: vi.fn(),
	deletePlatformPosition: vi.fn(),
	listPlatformDepartments: vi.fn(),
	listPlatformPositions: vi.fn(),
	updatePlatformPosition: vi.fn(),
}));

vi.mock("#src/api/positions", () => ({
	createPlatformPosition: mocks.createPlatformPosition,
	deletePlatformPosition: mocks.deletePlatformPosition,
	listPlatformPositions: mocks.listPlatformPositions,
	platformPositionsQueryKey: ["platform-positions"],
	updatePlatformPosition: mocks.updatePlatformPosition,
}));

vi.mock("#src/api/departments", () => ({
	listPlatformDepartments: mocks.listPlatformDepartments,
	platformDepartmentsQueryKey: ["platform-departments"],
}));

const departments = [
	{
		children: [],
		code: "operations",
		createdAt: "2026-08-20T00:00:00.000Z",
		id: "dept-operations",
		memberCount: 5,
		name: "运营中心",
		parentId: null,
		positionCount: 2,
		status: "active" as const,
		updatedAt: "2026-08-20T01:00:00.000Z",
	},
];

const position = {
	code: "operator",
	createdAt: "2026-08-20T00:00:00.000Z",
	departmentId: "dept-operations",
	departmentName: "运营中心",
	id: "position-operator",
	memberCount: 3,
	name: "运营专员",
	status: "active" as const,
	updatedAt: "2026-08-20T01:00:00.000Z",
};

beforeAll(async () => {
	await i18n.changeLanguage("zh-CN");
});

beforeEach(() => {
	sessionStorage.clear();
	mocks.listPlatformDepartments.mockReset().mockResolvedValue(departments);
	mocks.listPlatformPositions.mockReset().mockResolvedValue({
		items: [position],
		page: 1,
		pageSize: 20,
		total: 1,
	});
	mocks.createPlatformPosition.mockReset().mockResolvedValue(position);
	mocks.deletePlatformPosition.mockReset().mockResolvedValue(undefined);
	mocks.updatePlatformPosition.mockReset().mockResolvedValue(position);
});

function renderPositionsPage() {
	const queryClient = new QueryClient({
		defaultOptions: {
			mutations: { retry: false },
			queries: { retry: false },
		},
	});

	render(
		<ConfigProvider>
			<LocalePreferencesProvider
				value={{
					currency: "CNY",
					language: "zh-CN",
					onChangeCurrency: vi.fn(),
					onChangeTimeZone: vi.fn(),
					timeZone: "Asia/Shanghai",
				}}
			>
				<QueryClientProvider client={queryClient}>
					<PositionsPage />
				</QueryClientProvider>
			</LocalePreferencesProvider>
		</ConfigProvider>,
	);

	return userEvent.setup();
}

describe("PositionsPage", () => {
	it("uses the standard query bar, table toolbar and expected page sizes", async () => {
		renderPositionsPage();

		await screen.findByText("运营专员");
		expect(screen.getByTestId("admin-positions-query-form")).toBeVisible();
		expect(screen.getByTestId("admin-positions-query-actions")).toBeVisible();
		for (const actionName of ["刷新", "表格密度", "列设置"]) {
			expect(screen.getByRole("button", { name: actionName })).toBeVisible();
		}
		expect(screen.getByRole("combobox", { name: "Page Size" })).toBeVisible();
	});

	it("submits name filters through the positions API", async () => {
		const user = renderPositionsPage();

		await screen.findByText("运营专员");
		await user.type(screen.getByPlaceholderText("搜索岗位名称"), "运营");
		await user.click(screen.getByRole("button", { name: /查\s*询/ }));

		await waitFor(() => {
			expect(mocks.listPlatformPositions).toHaveBeenLastCalledWith(
				expect.objectContaining({ name: "运营" }),
				expect.any(AbortSignal),
			);
		});
	});

	it("creates and edits positions without confirmation", async () => {
		const user = renderPositionsPage();

		await screen.findByText("运营专员");
		await user.click(screen.getByRole("button", { name: "新建岗位" }));
		await user.type(
			await screen.findByPlaceholderText("请输入岗位名称"),
			"质量专员",
		);
		await user.type(screen.getByPlaceholderText("请输入岗位标识"), "quality");
		await user.click(screen.getByRole("button", { name: /保\s*存/ }));

		await waitFor(() => {
			expect(mocks.createPlatformPosition).toHaveBeenCalledWith({
				code: "quality",
				departmentId: "dept-operations",
				name: "质量专员",
				status: "active",
			});
		});

		await user.click(screen.getByRole("button", { name: "编辑" }));
		await user.clear(await screen.findByPlaceholderText("请输入岗位名称"));
		await user.type(
			screen.getByPlaceholderText("请输入岗位名称"),
			"高级运营专员",
		);
		await user.click(screen.getByRole("button", { name: /保\s*存/ }));

		await waitFor(() => {
			expect(mocks.updatePlatformPosition).toHaveBeenCalledWith({
				input: {
					code: position.code,
					departmentId: position.departmentId,
					name: "高级运营专员",
					status: position.status,
				},
				positionId: position.id,
			});
		});
	});

	it("disables positions and deletes positions after explicit confirmation", async () => {
		const user = renderPositionsPage();

		await screen.findByText("运营专员");
		await user.click(screen.getByRole("button", { name: "更多" }));
		await user.click(await screen.findByRole("menuitem", { name: /停用/ }));
		await waitFor(() => {
			expect(mocks.updatePlatformPosition).toHaveBeenCalledWith({
				input: {
					code: position.code,
					departmentId: position.departmentId,
					name: position.name,
					status: "disabled",
				},
				positionId: position.id,
			});
		});

		await user.click(screen.getByRole("button", { name: "更多" }));
		await user.click(await screen.findByRole("menuitem", { name: /删除/ }));
		await user.click(screen.getByRole("button", { name: "确认删除" }));
		await waitFor(() => {
			expect(mocks.deletePlatformPosition.mock.calls[0]?.[0]).toBe(position.id);
		});
	});
});
