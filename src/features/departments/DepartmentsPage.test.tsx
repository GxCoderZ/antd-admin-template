import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConfigProvider } from "antd";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { LocalePreferencesProvider } from "../../app/LocalePreferencesProvider";
import { i18n } from "../../i18n";
import { clickDropdownMenuItem } from "../../test/dropdown";
import { DepartmentsPage } from "./DepartmentsPage";

const mocks = vi.hoisted(() => ({
	createPlatformDepartment: vi.fn(),
	deletePlatformDepartment: vi.fn(),
	listPlatformDepartments: vi.fn(),
	updatePlatformDepartment: vi.fn(),
}));

vi.mock("#src/api/departments", () => ({
	createPlatformDepartment: mocks.createPlatformDepartment,
	deletePlatformDepartment: mocks.deletePlatformDepartment,
	listPlatformDepartments: mocks.listPlatformDepartments,
	platformDepartmentsQueryKey: ["platform-departments"],
	updatePlatformDepartment: mocks.updatePlatformDepartment,
}));

const department = {
	children: [
		{
			children: [],
			code: "content",
			createdAt: "2026-08-20T00:00:00.000Z",
			id: "dept-content",
			memberCount: 0,
			name: "内容运营组",
			parentId: "dept-operations",
			positionCount: 0,
			status: "active" as const,
			updatedAt: "2026-08-20T01:00:00.000Z",
		},
	],
	code: "operations",
	createdAt: "2026-08-20T00:00:00.000Z",
	id: "dept-operations",
	memberCount: 5,
	name: "运营中心",
	parentId: null,
	positionCount: 2,
	status: "active" as const,
	updatedAt: "2026-08-20T01:00:00.000Z",
};

beforeAll(async () => {
	await i18n.changeLanguage("zh-CN");
});

beforeEach(() => {
	mocks.listPlatformDepartments.mockReset().mockResolvedValue([department]);
	mocks.createPlatformDepartment.mockReset().mockResolvedValue(department);
	mocks.deletePlatformDepartment.mockReset().mockResolvedValue(undefined);
	mocks.updatePlatformDepartment.mockReset().mockResolvedValue(department);
});

function renderDepartmentsPage() {
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
					<DepartmentsPage />
				</QueryClientProvider>
			</LocalePreferencesProvider>
		</ConfigProvider>,
	);

	return userEvent.setup();
}

describe("DepartmentsPage", () => {
	it.each([0, 5])(
		"only expands departments with children, regardless of %i members",
		async (memberCount) => {
			mocks.listPlatformDepartments.mockResolvedValue([
				{ ...department, memberCount: 0 },
				{
					...department,
					children: [],
					id: "dept-leaf",
					name: "独立部门",
					memberCount,
				},
			]);
			const user = renderDepartmentsPage();
			const parent = (await screen.findByText("运营中心")).closest("tr");
			const leaf = screen.getByText("独立部门").closest("tr");
			if (!parent || !leaf) throw new Error("Missing department rows");
			expect(
				within(leaf).queryByRole("button", { name: "展开行" }),
			).not.toBeInTheDocument();
			await user.click(within(parent).getByRole("button", { name: "展开行" }));
			const child = (await screen.findByText("内容运营组")).closest("tr");
			if (!child) throw new Error("Missing child department row");
			expect(
				within(child).queryByRole("button", { name: "展开行" }),
			).not.toBeInTheDocument();
			expect(
				within(parent).getByRole("button", { name: "关闭行" }),
			).toHaveAttribute("aria-expanded", "true");
		},
	);

	it("removes the expand button when the last child disappears after reload", async () => {
		const user = renderDepartmentsPage();
		const parent = (await screen.findByText("运营中心")).closest("tr");
		if (!parent) throw new Error("Missing parent department row");
		await user.click(within(parent).getByRole("button", { name: "展开行" }));
		await screen.findByText("内容运营组");
		mocks.listPlatformDepartments.mockResolvedValue([
			{ ...department, children: [] },
		]);
		await user.click(screen.getByRole("img", { name: "reload" }));
		await waitFor(() =>
			expect(screen.queryByText("内容运营组")).not.toBeInTheDocument(),
		);
		expect(
			within(parent).queryByRole("button", { name: /展开行|关闭行/ }),
		).not.toBeInTheDocument();
	});

	it("orders department comparison fields before status", async () => {
		renderDepartmentsPage();
		await screen.findByText("运营中心");
		expect(
			screen
				.getAllByRole("columnheader")
				.map((header) => header.textContent?.trim()),
		).toEqual(["部门名称", "部门标识", "成员数", "岗位数", "状态", "操作"]);
	});
	it("opens complete read-only department details from the name", async () => {
		const user = renderDepartmentsPage();
		await user.click(await screen.findByRole("button", { name: "运营中心" }));
		const dialog = await screen.findByRole("dialog");
		expect(within(dialog).getAllByRole("table")).toHaveLength(2);
		for (const label of [
			"基本信息",
			"时间与记录",
			"记录 ID",
			"部门名称",
			"部门标识",
			"上级部门 ID",
			"下级部门",
			"状态",
			"成员数",
			"岗位数",
			"创建时间",
			"更新时间",
		]) {
			expect(
				within(dialog).getByText(label, { exact: true }),
			).toBeInTheDocument();
		}
		expect(within(dialog).getByText(department.id)).toBeInTheDocument();
		expect(
			within(dialog).getByText("内容运营组 (content)"),
		).toBeInTheDocument();
		expect(within(dialog).queryByRole("textbox")).not.toBeInTheDocument();
		expect(mocks.updatePlatformDepartment).not.toHaveBeenCalled();
	});

	it("uses the standard query bar and management table toolbar", async () => {
		renderDepartmentsPage();

		await screen.findByText("运营中心");
		expect(screen.getByTestId("admin-departments-query-form")).toBeVisible();
		expect(
			within(screen.getByTestId("admin-departments-query-form")).getByRole(
				"button",
				{ name: /查\s*询/ },
			),
		).toBeVisible();
		for (const actionName of ["reload", "column-height", "setting"]) {
			expect(screen.getByRole("img", { name: actionName })).toBeVisible();
		}
	});

	it("submits name and status filters through the departments API", async () => {
		const user = renderDepartmentsPage();

		await screen.findByText("运营中心");
		await user.type(screen.getByPlaceholderText("搜索部门名称"), "运营");
		await user.click(screen.getByRole("button", { name: /查\s*询/ }));

		await waitFor(() => {
			expect(mocks.listPlatformDepartments).toHaveBeenLastCalledWith(
				expect.objectContaining({ name: "运营" }),
				expect.any(AbortSignal),
			);
		});
	});

	it("creates child departments and edits departments without confirmation", async () => {
		const user = renderDepartmentsPage();

		const row = within((await screen.findByText("运营中心")).closest("tr")!);
		expect(
			row.queryByRole("button", { name: "新增下级" }),
		).not.toBeInTheDocument();
		await user.click(row.getByText("更多").closest("button")!);
		await clickDropdownMenuItem(user, "新增下级");
		const createDrawer = await screen.findByRole("dialog");
		const createForm = within(createDrawer);
		await user.type(
			createForm.getByPlaceholderText("请输入部门名称"),
			"质量组",
		);
		await user.type(
			createForm.getByPlaceholderText("请输入部门标识"),
			"quality",
		);
		await user.click(createForm.getByText(/^保\s*存$/).closest("button")!);

		await waitFor(() => {
			expect(mocks.createPlatformDepartment).toHaveBeenCalledWith({
				code: "quality",
				name: "质量组",
				parentId: department.id,
				status: "active",
			});
		});

		await waitFor(() => expect(createDrawer).not.toBeInTheDocument());
		await user.click(row.getByText("编辑").closest("button")!);
		const editDrawer = await screen.findByRole("dialog");
		const editForm = within(editDrawer);
		await user.clear(editForm.getByPlaceholderText("请输入部门名称"));
		await user.type(
			editForm.getByPlaceholderText("请输入部门名称"),
			"运营管理中心",
		);
		await user.click(editForm.getByText(/^保\s*存$/).closest("button")!);

		await waitFor(() => {
			expect(mocks.updatePlatformDepartment).toHaveBeenCalledWith({
				departmentId: department.id,
				input: {
					code: department.code,
					name: "运营管理中心",
					parentId: department.parentId,
					status: department.status,
				},
			});
		});
		await waitFor(() => expect(editDrawer).not.toBeInTheDocument());
	});

	it("disables departments and deletes departments after explicit confirmation", async () => {
		const user = renderDepartmentsPage();

		const row = within((await screen.findByText("运营中心")).closest("tr")!);
		await user.click(row.getByText("更多").closest("button")!);
		await clickDropdownMenuItem(user, /停用/);
		await waitFor(() => {
			expect(mocks.updatePlatformDepartment).toHaveBeenCalledWith({
				departmentId: department.id,
				input: {
					code: department.code,
					name: department.name,
					parentId: department.parentId,
					status: "disabled",
				},
			});
		});
		await screen.findByText("部门状态已更新");

		await user.click(row.getByText("更多").closest("button")!);
		await clickDropdownMenuItem(user, /删除/);
		const confirmation = await screen.findByRole("dialog");
		await user.click(
			within(confirmation).getByText("确认删除").closest("button")!,
		);
		await waitFor(() => {
			expect(mocks.deletePlatformDepartment.mock.calls[0]?.[0]).toBe(
				department.id,
			);
		});
		await screen.findByText("部门已删除");
	});
});
