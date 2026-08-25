import { render, screen } from "@testing-library/react";
import type { ComponentType } from "react";
import { MemoryRouter } from "react-router";
import { beforeAll, describe, expect, it } from "vitest";

import { i18n } from "../../i18n";
import { ForbiddenPage, NotFoundPage, ServerErrorPage } from "./ExceptionPages";

beforeAll(async () => {
	await i18n.changeLanguage("zh-CN");
});

function renderPage(Page: ComponentType) {
	return render(
		<MemoryRouter>
			<Page />
		</MemoryRouter>,
	);
}

describe("exception pages", () => {
	it("renders the dedicated 403 state", () => {
		renderPage(ForbiddenPage);

		expect(screen.getByText("403")).toBeVisible();
		expect(screen.getByText("抱歉，您无权访问此页面。")).toBeVisible();
		expect(screen.getByRole("button", { name: "返回首页" })).toBeVisible();
	});

	it("renders the dedicated 404 state", () => {
		renderPage(NotFoundPage);

		expect(screen.getByText("404")).toBeVisible();
		expect(screen.getByText("抱歉，您访问的页面不存在。")).toBeVisible();
		expect(screen.getByRole("button", { name: "返回首页" })).toBeVisible();
	});

	it("renders the original 500 state", () => {
		renderPage(ServerErrorPage);

		expect(screen.getByText("500")).toBeVisible();
		expect(screen.getByText("抱歉，服务器出错了。")).toBeVisible();
		expect(screen.getByRole("button", { name: "返回首页" })).toBeVisible();
		expect(
			screen.queryByRole("button", { name: "重新加载" }),
		).not.toBeInTheDocument();
	});
});
