import { QueryClientProvider } from "@tanstack/react-query";
import {
	fireEvent,
	render,
	screen,
	waitFor,
	within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";
import { MemoryRouter } from "react-router";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import type { request } from "#src/api/client";
import type { PlatformSession } from "#src/api/auth";
import type { PlatformDictionaryType } from "#src/api/dictionaries";
import { RolesPage } from "../features/access/RolesPage";
import { AnnouncementsPage } from "../features/announcements/AnnouncementsPage";
import { DepartmentsPage } from "../features/departments/DepartmentsPage";
import { DictionariesPage } from "../features/dictionaries/DictionariesPage";
import { AuditLogPage } from "../features/operations/AuditLogPage";
import { LoginLogPage } from "../features/operations/LoginLogPage";
import { UsersPage } from "../features/organization/UsersPage";
import { PositionsPage } from "../features/positions/PositionsPage";
import { i18n, i18nReady } from "../i18n";
import { LocalePreferencesProvider } from "./LocalePreferencesProvider";
import { PermissionContext, platformPermissions } from "./permissions";
import { createAppQueryClient } from "./queryClient";

const mocks = vi.hoisted(() => ({
	request: vi.fn<(...args: Parameters<typeof request>) => Promise<unknown>>(),
}));

vi.mock("#src/api/client", async (importOriginal) => ({
	...(await importOriginal<typeof import("#src/api/client")>()),
	request: mocks.request,
}));

const dictionaryType: PlatformDictionaryType = {
	code: "test_status",
	createdAt: "2026-08-20T00:00:00.000Z",
	description: "Test status",
	id: "test-status",
	itemCount: 0,
	name: "Test status",
	status: "active",
	updatedAt: "2026-08-20T00:00:00.000Z",
};

const tables = [
	{
		name: "users",
		Page: UsersPage,
		formId: "admin-users-query-form",
		path: "/platform/users",
		field: "q",
	},
	{
		name: "roles",
		Page: RolesPage,
		formId: "admin-roles-query-form",
		path: "/platform/roles",
		field: "q",
	},
	{
		name: "departments",
		Page: DepartmentsPage,
		formId: "admin-departments-query-form",
		path: "/platform/departments",
		field: "name",
	},
	{
		name: "positions",
		Page: PositionsPage,
		formId: "admin-positions-query-form",
		path: "/platform/positions",
		field: "name",
	},
	{
		name: "dictionary types",
		Page: DictionariesPage,
		formId: "admin-dictionaries-type-query-form",
		path: "/platform/dictionaries/types",
		field: "q",
	},
	{
		name: "dictionary items",
		Page: DictionariesPage,
		formId: "admin-dictionaries-item-query-form",
		path: "/platform/dictionaries/types/test-status/items",
		field: "q",
	},
	{
		name: "announcements",
		Page: AnnouncementsPage,
		formId: "admin-announcements-query-form",
		path: "/platform/announcements",
		field: "q",
	},
	{
		name: "audit logs",
		Page: AuditLogPage,
		formId: "audit-log-query-form",
		path: "/platform/audit-logs",
		field: "action",
	},
	{
		name: "login logs",
		Page: LoginLogPage,
		formId: "login-log-query-form",
		path: "/platform/login-logs",
		field: "result",
	},
];

beforeAll(async () => {
	await i18nReady;
	await i18n.changeLanguage("zh-CN");
});

beforeEach(() => {
	sessionStorage.clear();
	localStorage.clear();
	mocks.request.mockReset().mockImplementation((path, options) => {
		if (path === "/platform/auth/session")
			return Promise.resolve({
				user: {
					id: "test-user",
					username: "test-user",
					email: "test@example.test",
				},
				permissions: [],
			} satisfies PlatformSession);
		if (path === "/platform/departments") return Promise.resolve([]);
		if (!tables.some((table) => table.path === path))
			throw new Error(`Unexpected request: ${path}`);
		const items =
			path === "/platform/dictionaries/types" ? [dictionaryType] : [];
		return Promise.resolve({
			items,
			total: items.length,
			page: options?.query?.page ?? 1,
			page_size: options?.query?.page_size ?? 10,
		});
	});
});

async function renderTable(entry: (typeof tables)[number]) {
	const queryClient = createAppQueryClient();
	const user = userEvent.setup();
	const { Page } = entry;
	const view = render(
		<ConfigProvider locale={zhCN}>
			<LocalePreferencesProvider
				value={{
					currency: "CNY",
					language: "zh-CN",
					onChangeCurrency: vi.fn(),
					onChangeTimeZone: vi.fn(),
					timeZone: "Asia/Shanghai",
				}}
			>
				<MemoryRouter>
					<QueryClientProvider client={queryClient}>
						<PermissionContext.Provider
							value={new Set(Object.values(platformPermissions))}
						>
							<Page />
						</PermissionContext.Provider>
					</QueryClientProvider>
				</MemoryRouter>
			</LocalePreferencesProvider>
		</ConfigProvider>,
	);
	if (entry.name === "dictionary items") {
		fireEvent.click(await screen.findByRole("tab", { name: /字典项/ }));
	}
	const form = within(await screen.findByTestId(entry.formId));
	await waitFor(() => expect(queryClient.isFetching()).toBe(0));
	const requests = () =>
		mocks.request.mock.calls.filter(([path]) => path === entry.path);
	expect(requests()).toHaveLength(1);
	const changeDraft = async () => {
		if (entry.field === "result") {
			await user.click(form.getAllByRole("combobox")[0]!);
			await user.click(
				await screen.findByText(
					i18n.t("adminShell.logs.common.results.success"),
					{ selector: ".ant-select-item-option-content" },
				),
			);
			expect(
				form.getByTitle(i18n.t("adminShell.logs.common.results.success")),
			).toBeVisible();
		} else {
			fireEvent.change(form.getAllByRole("textbox")[0]!, {
				target: { value: "test" },
			});
		}
	};
	return { ...view, form, queryClient, requests, user, changeDraft };
}

describe.each(tables)("$name reset", (entry) => {
	it("clears an unsubmitted draft without requesting default data again", async () => {
		const { form, queryClient, requests, changeDraft } =
			await renderTable(entry);
		await changeDraft();
		// Match the existing dictionary tests: avoid jsdom's costly Pro form accessibility scan.
		const reset = form.getByText(/重\s*置/);
		for (let click = 0; click < 3; click += 1) {
			fireEvent.click(reset);
			await waitFor(() => expect(queryClient.isFetching()).toBe(0));
			expect(requests()).toHaveLength(1);
			expect(reset.closest("button")).toBeEnabled();
		}
		if (entry.field !== "result")
			expect(form.getAllByRole("textbox")[0]).toHaveValue("");
	});

	it("resets applied filters once and keeps explicit query and refresh available", async () => {
		const { form, queryClient, requests, changeDraft } =
			await renderTable(entry);
		await changeDraft();
		const query = form.getByText(/查\s*询/);
		fireEvent.click(query);
		await waitFor(() => expect(requests()).toHaveLength(2));
		expect(requests().at(-1)?.[1]?.query).toMatchObject({
			[entry.field]: entry.field === "result" ? "success" : "test",
		});
		await waitFor(() => expect(queryClient.isFetching()).toBe(0));
		fireEvent.click(query);
		await waitFor(() => expect(requests()).toHaveLength(3));
		await waitFor(() => expect(queryClient.isFetching()).toBe(0));
		const reset = form.getByText(/重\s*置/);
		fireEvent.click(reset);
		await waitFor(() => expect(requests()).toHaveLength(4));
		expect(requests().at(-1)?.[1]?.query?.[entry.field]).toBeUndefined();
		await waitFor(() => expect(queryClient.isFetching()).toBe(0));
		fireEvent.click(reset);
		fireEvent.click(reset);
		await waitFor(() => expect(queryClient.isFetching()).toBe(0));
		expect(requests()).toHaveLength(4);
		fireEvent.click(screen.getAllByLabelText("reload")[0]!);
		await waitFor(() => expect(requests()).toHaveLength(5));
	});
});
