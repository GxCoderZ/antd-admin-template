import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { beforeAll, describe, expect, it } from "vitest";

import { i18n } from "../../i18n";
import { ForbiddenPage, NotFoundPage, ServerErrorPage } from "./ExceptionPages";

beforeAll(async () => {
	await i18n.changeLanguage("zh-CN");
});

function renderPage(Page: () => React.JSX.Element) {
	return render(
		<MemoryRouter>
			<Page />
		</MemoryRouter>,
	);
}

describe("exception pages", () => {
	it("renders the dedicated 403 state", () => {
		renderPage(ForbiddenPage);

		expect(screen.getByRole("heading", { name: "403" })).toBeVisible();
		expect(screen.getByRole("button", { name: "返回首页" })).toBeVisible();
	});

	it("renders the dedicated 404 state", () => {
		renderPage(NotFoundPage);

		expect(screen.getByRole("heading", { name: "404" })).toBeVisible();
		expect(screen.getByRole("button", { name: "返回首页" })).toBeVisible();
	});

	it("renders reload and home actions for 500", () => {
		renderPage(ServerErrorPage);

		expect(screen.getByRole("heading", { name: "500" })).toBeVisible();
		expect(screen.getByRole("button", { name: "重新加载" })).toBeVisible();
		expect(screen.getByRole("button", { name: "返回首页" })).toBeVisible();
	});
});
