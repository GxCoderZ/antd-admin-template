import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConfigProvider } from "antd";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { i18n } from "../../i18n";
import { BasicFormPage } from "./BasicFormPage";
import { StepFormPage } from "./StepFormPage";

const mocks = vi.hoisted(() => ({
	submitBasicForm: vi.fn(),
	submitStepForm: vi.fn(),
}));

vi.mock("#src/api/form-examples", () => ({
	submitBasicForm: mocks.submitBasicForm,
	submitStepForm: mocks.submitStepForm,
}));

beforeAll(async () => {
	await i18n.changeLanguage("zh-CN");
});

beforeEach(() => {
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
});
