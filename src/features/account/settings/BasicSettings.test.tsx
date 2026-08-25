import {
	platformAccountQueryKey,
	type PlatformAccount,
	uploadPlatformAccountAvatar,
} from "#src/api/account";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConfigProvider } from "antd";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { i18n } from "../../../i18n";
import { BasicSettings } from "./BasicSettings";

vi.mock("#src/api/account", () => ({
	platformAccountQueryKey: ["platform-account"],
	updatePlatformAccount: vi.fn(),
	uploadPlatformAccountAvatar: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("#src/api/users", () => ({
	getPlatformUserAvatar: vi.fn().mockResolvedValue({ dataUrl: null }),
	platformUserAvatarQueryKey: (userId: string, revision?: number | string) => [
		"platform-user-avatar",
		userId,
		revision,
	],
	platformUsersQueryKey: ["platform-users"],
}));

const account: PlatformAccount = {
	address: "西湖区工专路 77 号",
	bio: "专注于企业级产品设计与研发",
	city: "hangzhou",
	country: "china",
	createdAt: "2026-01-01T00:00:00.000Z",
	displayName: "Platform Admin",
	email: "admin@example.com",
	id: "user-admin",
	phoneAreaCode: "+86",
	phoneNumber: "18100000000",
	province: "zhejiang",
	roles: [],
	username: "admin",
	version: 1,
};

beforeAll(async () => {
	await i18n.changeLanguage("zh-CN");
});

describe("BasicSettings avatar upload", () => {
	it("opens the crop dialog before uploading a valid avatar", async () => {
		const queryClient = new QueryClient({
			defaultOptions: { queries: { retry: false } },
		});
		queryClient.setQueryData(platformAccountQueryKey, account);
		const user = userEvent.setup();
		const { container } = render(
			<ConfigProvider>
				<QueryClientProvider client={queryClient}>
					<BasicSettings account={account} />
				</QueryClientProvider>
			</ConfigProvider>,
		);
		const fileInput =
			container.querySelector<HTMLInputElement>('input[type="file"]');

		expect(fileInput).not.toBeNull();
		await user.upload(
			fileInput!,
			new File(["avatar"], "avatar.png", { type: "image/png" }),
		);

		expect(
			await screen.findByRole("dialog", { name: "修改头像" }),
		).toBeInTheDocument();
		expect(uploadPlatformAccountAvatar).not.toHaveBeenCalled();
	});
});
