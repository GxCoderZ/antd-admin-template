import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConfigProvider } from "antd";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { LocalePreferencesProvider } from "../../app/LocalePreferencesProvider";
import { i18n } from "../../i18n";
import { clickDropdownMenuItem } from "../../test/dropdown";
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
	it("orders position identity and organization before status", async () => {
		renderPositionsPage();
		await screen.findByText("运营专员");
		expect(
			screen
				.getAllByRole("columnheader")
				.map((header) => header.textContent?.trim()),
		).toEqual(["岗位名称", "岗位标识", "所属部门", "成员数", "状态", "操作"]);
	});
	it("opens complete read-only position details from the name", async () => {
		const user = renderPositionsPage();
		await user.click(await screen.findByRole("button", { name: "运营专员" }));
		const dialog = await screen.findByRole("dialog");
		expect(within(dialog).getAllByRole("table")).toHaveLength(2);
		for (const label of [
			"基本信息",
			"时间与记录",
			"记录 ID",
			"岗位名称",
			"岗位标识",
			"所属部门",
			"部门 ID",
			"状态",
			"成员数",
			"创建时间",
			"更新时间",
		]) {
			expect(
				within(dialog).getByText(label, { exact: true }),
			).toBeInTheDocument();
		}
		expect(within(dialog).getByText(position.id)).toBeInTheDocument();
		expect(within(dialog).getByText(position.departmentId)).toBeInTheDocument();
		expect(within(dialog).queryByRole("textbox")).not.toBeInTheDocument();
		expect(mocks.updatePlatformPosition).not.toHaveBeenCalled();
	});

	it("uses the standard query bar, table toolbar and expected page sizes", async () => {
		renderPositionsPage();

		await screen.findByText("运营专员");
		expect(screen.getByTestId("admin-positions-query-form")).toBeVisible();
		expect(
			within(screen.getByTestId("admin-positions-query-form")).getByRole(
				"button",
				{ name: /查\s*询/ },
			),
		).toBeVisible();
		for (const actionName of ["reload", "column-height", "setting"]) {
			expect(screen.getByRole("img", { name: actionName })).toBeVisible();
		}
		expect(screen.getByRole("combobox", { name: "页码" })).toBeVisible();
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

		const row = within((await screen.findByText("运营专员")).closest("tr")!);
		await user.click(screen.getByText("新建岗位").closest("button")!);
		const createDrawer = await screen.findByRole("dialog");
		const createForm = within(createDrawer);
		await user.type(
			createForm.getByPlaceholderText("请输入岗位名称"),
			"质量专员",
		);
		await user.type(
			createForm.getByPlaceholderText("请输入岗位标识"),
			"quality",
		);
		await user.click(createForm.getByText(/^保\s*存$/).closest("button")!);

		await waitFor(() => {
			expect(mocks.createPlatformPosition).toHaveBeenCalledWith({
				code: "quality",
				departmentId: "dept-operations",
				name: "质量专员",
				status: "active",
			});
		});

		await waitFor(() => expect(createDrawer).not.toBeInTheDocument());
		await user.click(row.getByText("编辑").closest("button")!);
		const editDrawer = await screen.findByRole("dialog");
		const editForm = within(editDrawer);
		await user.clear(editForm.getByPlaceholderText("请输入岗位名称"));
		await user.type(
			editForm.getByPlaceholderText("请输入岗位名称"),
			"高级运营专员",
		);
		await user.click(editForm.getByText(/^保\s*存$/).closest("button")!);

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
		await waitFor(() => expect(editDrawer).not.toBeInTheDocument());
	});

	it("disables positions and deletes positions after explicit confirmation", async () => {
		const user = renderPositionsPage();

		const row = within((await screen.findByText("运营专员")).closest("tr")!);
		await user.click(row.getByText("更多").closest("button")!);
		await clickDropdownMenuItem(user, /停用/);
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
		await screen.findByText("岗位状态已更新");

		await user.click(row.getByText("更多").closest("button")!);
		await clickDropdownMenuItem(user, /删除/);
		const confirmation = await screen.findByRole("dialog");
		await user.click(
			within(confirmation).getByText("确认删除").closest("button")!,
		);
		await waitFor(() => {
			expect(mocks.deletePlatformPosition.mock.calls[0]?.[0]).toBe(position.id);
		});
		await screen.findByText("岗位已删除");
	});
});
