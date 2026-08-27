import { ConfigProvider } from "antd";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";

import type { PlatformRole } from "#src/api/roles";
import type { PlatformUser } from "#src/api/users";
import { i18n } from "#src/i18n";
import { UserRolesDrawer } from "./UserRolesDrawer";

const currentUser: PlatformUser = {
	authSource: "local",
	createdAt: "2026-08-01T00:00:00.000Z",
	departmentId: "dept-platform",
	departmentName: "平台研发部",
	displayName: "Platform Admin",
	email: "admin@example.com",
	id: "user-admin",
	jobTitle: "平台管理员",
	lastLoginAt: "2026-08-25T08:30:00.000Z",
	lastLoginIp: "192.168.1.10",
	mfaEnabled: true,
	phone: "13800138000",
	roles: [],
	status: "active",
	updatedAt: "2026-08-25T00:00:00.000Z",
	username: "admin",
	version: 3,
};

const roles = [
	{
		builtIn: true,
		createdAt: "2026-07-01T00:00:00.000Z",
		description: "拥有所有后台配置和权限分配能力",
		displayName: "平台管理员",
		id: "role-admin",
		memberCount: 2,
		permissions: [
			"platform.users.manage",
			"platform.roles.manage",
			"platform.settings.manage",
		],
		roleKey: "platform_admin",
		updatedAt: "2026-08-25T00:00:00.000Z",
		version: 1,
	},
	{
		builtIn: false,
		createdAt: "2026-07-02T00:00:00.000Z",
		description: "负责日常内容与账号维护",
		displayName: "运营管理员",
		id: "role-operator",
		memberCount: 8,
		permissions: ["platform.users.read"],
		roleKey: "operator",
		updatedAt: "2026-08-24T00:00:00.000Z",
		version: 1,
	},
	{
		builtIn: false,
		createdAt: "2026-07-03T00:00:00.000Z",
		description: "已停用，仅保留历史成员可见",
		disabled: true,
		displayName: "旧审计员",
		id: "role-legacy-auditor",
		memberCount: 1,
		permissions: ["platform.logs.read"],
		roleKey: "legacy_auditor",
		updatedAt: "2026-08-23T00:00:00.000Z",
		version: 1,
	},
] satisfies Array<PlatformRole & { description: string; disabled?: boolean }>;

function renderDrawer(props?: Partial<Parameters<typeof UserRolesDrawer>[0]>) {
	const user = userEvent.setup();
	const onSaveRoles = vi.fn();
	render(
		<ConfigProvider>
			<UserRolesDrawer
				availableRoles={roles}
				canManageRoles
				detailError={null}
				detailLoading={false}
				mutationError={null}
				onClose={vi.fn()}
				onRetryDetail={vi.fn()}
				onRetryRoles={vi.fn()}
				onSaveRoles={onSaveRoles}
				rolesError={null}
				saving={false}
				user={currentUser}
				userRoles={[roles[0]!, roles[2]!]}
				{...props}
			/>
		</ConfigProvider>,
	);

	return { onSaveRoles, user };
}

function expectTextVisible(text: string) {
	expect(
		screen.getAllByText(text).some((element) => {
			try {
				expect(element).toBeVisible();
				return true;
			} catch {
				return false;
			}
		}),
	).toBe(true);
}

describe("UserRolesDrawer", () => {
	beforeAll(async () => {
		await i18n.changeLanguage("zh-CN");
	});

	it("uses a searchable multi select that shows role metadata and risk cues", async () => {
		const { user } = renderDrawer();

		const drawer = await screen.findByRole("dialog", { name: "admin 的角色" });
		const selector = within(drawer).getByRole("combobox", { name: "角色选择" });
		await user.click(selector);

		const operatorOption = await screen.findByRole("option", {
			name: /运营管理员/,
		});
		expect(operatorOption).toHaveAttribute("aria-disabled", "false");
		expect(operatorOption).toHaveAccessibleName(/operator/);
		expect(screen.getByText("负责日常内容与账号维护")).toBeInTheDocument();
		expect(screen.getByText("高权限")).toBeInTheDocument();
		expectTextVisible("旧审计员");
	});

	it("keeps disabled assigned roles visible, blocks newly selecting them, and saves the draft diff", async () => {
		const { onSaveRoles, user } = renderDrawer({
			userRoles: [roles[0]!],
		});

		const drawer = await screen.findByRole("dialog", { name: "admin 的角色" });
		const selector = within(drawer).getByRole("combobox", { name: "角色选择" });

		await user.click(selector);
		expect(screen.getByRole("option", { name: /旧审计员/ })).toHaveAttribute(
			"aria-disabled",
			"true",
		);
		await user.click(screen.getByRole("option", { name: /运营管理员/ }));

		expect(within(drawer).getByText("新增角色")).toBeVisible();
		expect(within(drawer).getByText("运营管理员")).toBeVisible();
		expect(within(drawer).getByText("移除角色")).toBeVisible();
		expect(within(drawer).getByText("无")).toBeVisible();

		await user.click(within(drawer).getByRole("button", { name: /保\s*存/ }));

		await waitFor(() => {
			expect(onSaveRoles).toHaveBeenCalledWith(["role-admin", "role-operator"]);
		});
	});
});
