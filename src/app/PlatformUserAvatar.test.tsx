import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PlatformUserAvatar } from "./PlatformUserAvatar";

vi.mock("#src/api/users", () => ({
	getPlatformUserAvatar: vi.fn().mockResolvedValue({ dataUrl: null }),
	platformUserAvatarQueryKey: (userId: string, revision: string) => [
		"platform-users",
		"avatar",
		userId,
		revision,
	],
}));

function renderAvatar(fallback: "icon" | "initial", size?: number) {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false } },
	});

	return render(
		<QueryClientProvider client={queryClient}>
			<PlatformUserAvatar
				displayName="Olivia"
				fallback={fallback}
				revision="1"
				size={size}
				userId="user-1"
			/>
		</QueryClientProvider>,
	);
}

describe("PlatformUserAvatar", () => {
	it("uses the Ant Design user icon when the current user has no avatar", async () => {
		const { container } = renderAvatar("icon", 144);

		await waitFor(() =>
			expect(
				container.querySelector(".ant-avatar img"),
			).not.toBeInTheDocument(),
		);
		expect(container.querySelector(".ant-avatar")).toHaveClass(
			"ant-avatar-icon",
		);
		expect(container.querySelector(".ant-avatar")).toHaveStyle({
			fontSize: "72px",
		});
		expect(container.querySelector(".anticon-user")).toBeInTheDocument();
	});

	it("keeps initials for list users", async () => {
		const { container } = renderAvatar("initial");

		await waitFor(() =>
			expect(
				container.querySelector(".ant-avatar img"),
			).not.toBeInTheDocument(),
		);
		expect(container).toHaveTextContent("O");
	});
});
