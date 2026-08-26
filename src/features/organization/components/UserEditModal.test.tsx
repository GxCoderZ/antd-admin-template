import { ConfigProvider } from "antd";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { i18n } from "../../../i18n";
import { UserEditModal } from "./UserEditModal";

const userRecord = {
	authSource: "local" as const,
	createdAt: "2026-08-01T00:00:00.000Z",
	department: "platform" as const,
	displayName: "Platform Admin",
	email: "admin@example.com",
	id: "user-admin",
	jobTitle: "平台管理员",
	lastLoginAt: "2026-08-25T08:30:00.000Z",
	lastLoginIp: "192.168.1.10",
	mfaEnabled: true,
	mustChangePassword: false,
	phone: "13800138000",
	roles: [],
	status: "active" as const,
	updatedAt: "2026-08-25T00:00:00.000Z",
	username: "admin",
	version: 3,
};

beforeAll(async () => {
	await i18n.changeLanguage("zh-CN");
});

describe("UserEditModal", () => {
	it("saves routine edits without typed-name confirmation", async () => {
		const onSubmit = vi.fn();
		const user = userEvent.setup();

		render(
			<ConfigProvider>
				<UserEditModal
					error={null}
					loading={false}
					onCancel={vi.fn()}
					onReloadConflict={vi.fn()}
					onSubmit={onSubmit}
					positionOptions={[
						{ label: "项目负责人", value: "项目负责人" },
						{ label: "运营经理", value: "运营经理" },
					]}
					positionsLoading={false}
					requestedStatus={undefined}
					user={userRecord}
				/>
			</ConfigProvider>,
		);

		const dialog = await screen.findByRole("dialog", {
			name: /编\s*辑 admin/,
		});
		expect(
			within(dialog).queryByText(/输入.*admin.*确认/),
		).not.toBeInTheDocument();

		const displayNameInput = within(dialog).getByLabelText("显示名称");
		await user.clear(displayNameInput);
		await user.type(displayNameInput, "平台管理员");
		const emailInput = within(dialog).getByLabelText("邮箱");
		await user.clear(emailInput);
		await user.type(emailInput, "platform@example.com");
		const phoneInput = within(dialog).getByLabelText("手机号");
		await user.clear(phoneInput);
		await user.type(phoneInput, "13900139000");
		expect(
			within(dialog).queryByRole("textbox", { name: "岗位" }),
		).not.toBeInTheDocument();
		const jobTitleSelect = within(dialog).getByRole("combobox", {
			name: "岗位",
		});
		await user.click(jobTitleSelect);
		await screen.findByRole("option", { name: "项目负责人" });
		await user.click(screen.getAllByText("项目负责人").at(-1)!);
		await user.click(within(dialog).getByRole("combobox", { name: "部门" }));
		await user.click(screen.getAllByText("运营部").at(-1)!);
		await user.click(within(dialog).getByRole("button", { name: /保\s*存/ }));

		expect(onSubmit).toHaveBeenCalledWith({
			department: "operations",
			displayName: "平台管理员",
			email: "platform@example.com",
			jobTitle: "项目负责人",
			phone: "13900139000",
			status: "active",
		});
	});
});
