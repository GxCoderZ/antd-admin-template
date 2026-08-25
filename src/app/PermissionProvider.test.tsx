import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";

import "../i18n";
import { PermissionBoundary, PermissionProvider } from "./PermissionProvider";
import { platformPermissions } from "./permissions";

function renderBoundary(
	permissions: readonly (typeof platformPermissions.usersManage)[],
) {
	return render(
		<MemoryRouter>
			<PermissionProvider permissions={permissions}>
				<PermissionBoundary permission={platformPermissions.usersManage}>
					<div>Protected controls</div>
				</PermissionBoundary>
			</PermissionProvider>
		</MemoryRouter>,
	);
}

describe("PermissionBoundary", () => {
	it("hides protected content when permission is missing", () => {
		renderBoundary([]);

		expect(screen.queryByText("Protected controls")).not.toBeInTheDocument();
		expect(screen.getByText("403")).toBeInTheDocument();
	});

	it("renders protected content when permission is present", () => {
		renderBoundary([platformPermissions.usersManage]);

		expect(screen.getByText("Protected controls")).toBeInTheDocument();
	});
});
