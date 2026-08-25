import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConfigProvider } from "antd";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { i18n } from "../../i18n";
import { AdvancedFormPage } from "./AdvancedFormPage";
import { BasicFormPage } from "./BasicFormPage";
import { StepFormPage } from "./StepFormPage";

const mocks = vi.hoisted(() => ({
	getAdvancedFormDraft: vi.fn(),
	saveAdvancedFormDraft: vi.fn(),
	submitAdvancedForm: vi.fn(),
	submitBasicForm: vi.fn(),
	submitStepForm: vi.fn(),
	validateAdvancedProjectCode: vi.fn(),
}));

vi.mock("#src/api/form-examples", () => ({
	getAdvancedFormDraft: mocks.getAdvancedFormDraft,
	saveAdvancedFormDraft: mocks.saveAdvancedFormDraft,
	submitAdvancedForm: mocks.submitAdvancedForm,
	submitBasicForm: mocks.submitBasicForm,
	submitStepForm: mocks.submitStepForm,
	validateAdvancedProjectCode: mocks.validateAdvancedProjectCode,
}));

beforeAll(async () => {
	await i18n.changeLanguage("zh-CN");
	HTMLElement.prototype.scrollIntoView = vi.fn();
});

beforeEach(() => {
	mocks.getAdvancedFormDraft.mockReset().mockResolvedValue({
		accessMode: "team",
		approvers: ["lead"],
		description: "沉淀可复用的跨部门协作表单资产。",
		enableApproval: true,
		endAt: "2026-09-30T00:00:00.000Z",
		members: [
			{
				email: "alex@example.com",
				name: "Alex",
				role: "owner",
				weight: 60,
			},
			{
				email: "casey@example.com",
				name: "Casey",
				role: "reviewer",
				weight: 40,
			},
		],
		notifyChannels: ["mail", "message"],
		notifyOwner: true,
		priority: "medium",
		projectCode: "FORM-ASSET-2026",
		projectName: "高级表单资产",
		rule: {
			action: "自动通知项目负责人复核提交材料。",
			condition: "amount",
			name: "预算超限复核",
		},
		startAt: "2026-09-01T00:00:00.000Z",
		teamScope: "platform",
		updatedAt: "2026-08-26T00:00:00.000Z",
	});
	mocks.saveAdvancedFormDraft.mockReset().mockResolvedValue({
		id: "advanced-draft-001",
		submittedAt: "2026-08-26T00:00:00.000Z",
	});
	mocks.submitAdvancedForm.mockReset().mockResolvedValue({
		id: "advanced-001",
		submittedAt: "2026-08-26T00:00:00.000Z",
	});
	mocks.validateAdvancedProjectCode
		.mockReset()
		.mockImplementation(({ projectCode }: { projectCode: string }) =>
			Promise.resolve(
				projectCode.trim().toUpperCase() === "OPS-LOCKED"
					? { available: false, message: "项目编码已被占用" }
					: { available: true },
			),
		);
	mocks.submitBasicForm.mockReset().mockResolvedValue({
		id: "basic-001",
		submittedAt: "2026-08-26T00:00:00.000Z",
	});
	mocks.submitStepForm.mockReset().mockResolvedValue({
		id: "step-001",
		submittedAt: "2026-08-26T00:00:00.000Z",
	});
});

function renderPage(page: React.ReactNode) {
	const queryClient = new QueryClient({
		defaultOptions: { mutations: { retry: false } },
	});
	const user = userEvent.setup();

	render(
		<ConfigProvider>
			<QueryClientProvider client={queryClient}>{page}</QueryClientProvider>
		</ConfigProvider>,
	);

	return user;
}

describe("form example pages", () => {
	it("renders the Ant Design Pro basic form fields and validation", async () => {
		const user = renderPage(<BasicFormPage />);

		expect(
			screen.getByRole("heading", { level: 1, name: "基础表单" }),
		).toBeVisible();
		expect(
			screen.getByText(
				"表单页用于向用户收集或验证信息，基础表单常见于数据项较少的表单场景。",
			),
		).toBeVisible();
		for (const field of [
			"标题",
			"起止日期",
			"目标描述",
			"衡量标准",
			"目标公开",
		]) {
			expect(screen.getByText(field, { exact: true })).toBeVisible();
		}
		expect(screen.getByLabelText("客户（选填）")).toBeVisible();
		expect(screen.getByLabelText("邀评人（选填）")).toBeVisible();
		expect(screen.getByLabelText("权重（选填）")).toBeVisible();
		expect(screen.getByLabelText("目标描述")).toHaveAttribute("rows", "3");
		expect(screen.getByLabelText("衡量标准")).toHaveAttribute("rows", "3");
		expect(
			screen.getByRole("combobox", { hidden: true, name: "公开范围" }),
		).not.toBeVisible();

		await user.click(screen.getByRole("radio", { name: "部分公开" }));
		expect(screen.getByRole("combobox", { name: "公开范围" })).toBeVisible();

		await user.click(screen.getByRole("button", { name: /提\s*交/ }));
		expect(await screen.findByText("请输入标题")).toBeInTheDocument();
		expect(screen.getByText("请选择起止日期")).toBeInTheDocument();
		expect(screen.getByText("请输入目标描述")).toBeInTheDocument();
		expect(screen.getByText("请输入衡量标准")).toBeInTheDocument();
		expect(mocks.submitBasicForm).not.toHaveBeenCalled();
	});

	it("matches the Ant Design Pro transfer steps and submits after confirmation", async () => {
		const user = renderPage(<StepFormPage />);

		expect(
			screen.getByRole("heading", { level: 1, name: "分步表单" }),
		).toBeVisible();
		expect(
			screen.getByText(
				"将一个冗长或用户不熟悉的表单任务分成多个步骤，指导用户完成。",
			),
		).toBeVisible();
		expect(screen.getByLabelText("付款账户")).toBeVisible();
		expect(screen.getByText("ant-design@alipay.com")).toBeVisible();
		expect(screen.getByLabelText("收款账户")).toHaveValue("test@example.com");
		expect(screen.getByLabelText("收款人姓名")).toHaveValue("Alex");
		expect(screen.getByLabelText("转账金额")).toHaveValue("500");
		await user.click(screen.getByRole("button", { name: "下一步" }));

		expect(
			await screen.findByText("确认转账后，资金将直接打入对方账户，无法退回。"),
		).toBeVisible();
		expect(screen.getByText("test@example.com", { exact: true })).toBeVisible();
		await user.type(screen.getByLabelText("支付密码"), "123456");
		await user.click(screen.getByRole("button", { name: /提\s*交/ }));

		await waitFor(() => {
			expect(mocks.submitStepForm.mock.calls[0]?.[0]).toEqual({
				amount: 500,
				password: "123456",
				payAccount: "ant-design@alipay.com",
				receiverAccount: "test@example.com",
				receiverMode: "alipay",
				receiverName: "Alex",
			});
		});
		expect(await screen.findByText("操作成功")).toBeVisible();
		expect(screen.getByText("预计两小时内到账")).toBeVisible();
		expect(screen.getByRole("button", { name: "再转一笔" })).toBeVisible();
		expect(screen.getByRole("button", { name: "查看账单" })).toBeVisible();
	});

	it("renders the advanced form sections, linked fields, dynamic members, and async validation", async () => {
		const user = renderPage(<AdvancedFormPage />);

		expect(
			await screen.findByRole("heading", { level: 1, name: "高级表单" }),
		).toBeVisible();
		for (const section of [
			"基础信息",
			"成员与规则",
			"触发规则",
			"通知与提交",
		]) {
			expect(
				await screen.findByRole("heading", { name: section }),
			).toBeVisible();
		}
		expect(screen.getByLabelText("项目名称")).toHaveValue("高级表单资产");
		expect(screen.getByLabelText("团队范围")).toBeVisible();
		expect(screen.getByLabelText("审批人")).toBeVisible();
		expect(screen.getAllByLabelText("成员姓名")).toHaveLength(2);

		await user.click(screen.getByRole("button", { name: "新增成员" }));
		expect(screen.getAllByLabelText("成员姓名")).toHaveLength(3);
		await user.click(screen.getByRole("button", { name: "删除第 3 位成员" }));
		expect(screen.getAllByLabelText("成员姓名")).toHaveLength(2);

		const projectCode = screen.getByLabelText("项目编码");
		await user.clear(projectCode);
		await user.type(projectCode, "OPS-LOCKED");
		await user.tab();
		expect(await screen.findByText("项目编码已被占用")).toBeInTheDocument();

		await user.click(screen.getByRole("button", { name: /提\s*交/ }));
		expect(
			await screen.findByText("请修正表单中的错误，已定位到第一个错误字段。"),
		).toBeVisible();
		expect(mocks.submitAdvancedForm).not.toHaveBeenCalled();
	});

	it("saves an advanced form draft and submits through the API payload", async () => {
		const user = renderPage(<AdvancedFormPage />);

		await screen.findByRole("heading", { name: "基础信息" });
		await user.click(screen.getByRole("button", { name: "保存草稿" }));
		await waitFor(() => {
			expect(mocks.saveAdvancedFormDraft.mock.calls[0]?.[0]).toMatchObject({
				accessMode: "team",
				approvers: ["lead"],
				members: [
					expect.objectContaining({ email: "alex@example.com", weight: 60 }),
					expect.objectContaining({ email: "casey@example.com", weight: 40 }),
				],
				projectCode: "FORM-ASSET-2026",
				teamScope: "platform",
			});
		});
		expect((await screen.findAllByText("草稿已保存")).length).toBeGreaterThan(
			0,
		);

		await user.click(screen.getByRole("button", { name: /提\s*交/ }));
		await waitFor(() => {
			const payload = mocks.submitAdvancedForm.mock.calls[0]?.[0] as
				| undefined
				| {
						notifyChannels: string[];
						notifyOwner: boolean;
						projectName: string;
						rule: { condition: string };
				  };
			expect(payload).toMatchObject({
				notifyChannels: ["mail", "message"],
				notifyOwner: true,
				projectName: "高级表单资产",
			});
			expect(payload?.rule.condition).toBe("amount");
		});
		expect((await screen.findAllByText("正式提交成功")).length).toBeGreaterThan(
			0,
		);
	});
});
