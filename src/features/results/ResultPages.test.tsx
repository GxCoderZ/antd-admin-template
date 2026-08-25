import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";

import { i18n } from "../../i18n";
import { FailureResultPage } from "./FailureResultPage";
import { SuccessResultPage } from "./SuccessResultPage";

beforeAll(async () => {
	await i18n.changeLanguage("zh-CN");
});

describe("Ant Design Pro result pages", () => {
	it("renders the original success result content", () => {
		render(<SuccessResultPage />);

		expect(screen.getByText("提交成功")).toBeVisible();
		expect(screen.getByRole("button", { name: "返回列表" })).toBeVisible();
		expect(screen.getByRole("button", { name: "查看项目" })).toBeVisible();
		expect(screen.getByRole("button", { name: /打\s*印/ })).toBeVisible();
		expect(screen.getByText("项目 ID")).toBeVisible();
		expect(screen.getByText("部门初审")).toBeVisible();
	});

	it("renders the original failure result content", () => {
		render(<FailureResultPage />);

		expect(screen.getByText("提交失败")).toBeVisible();
		expect(screen.getByText("您的账户已被冻结")).toBeVisible();
		expect(screen.getByText("您的账户还不具备申请资格")).toBeVisible();
		expect(screen.getByRole("button", { name: "返回修改" })).toBeVisible();
	});
});
