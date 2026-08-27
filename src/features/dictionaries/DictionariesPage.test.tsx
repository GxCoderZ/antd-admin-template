import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConfigProvider } from "antd";
import {
	fireEvent,
	render,
	screen,
	waitFor,
	within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { LocalePreferencesProvider } from "../../app/LocalePreferencesProvider";
import { i18n } from "../../i18n";
import { DictionariesPage } from "./DictionariesPage";

const mocks = vi.hoisted(() => ({
	createPlatformDictionaryItem: vi.fn(),
	createPlatformDictionaryType: vi.fn(),
	deletePlatformDictionaryItem: vi.fn(),
	deletePlatformDictionaryType: vi.fn(),
	listPlatformDictionaryItems: vi.fn(),
	listPlatformDictionaryTypes: vi.fn(),
	updatePlatformDictionaryItem: vi.fn(),
	updatePlatformDictionaryType: vi.fn(),
}));

vi.mock("#src/api/dictionaries", () => ({
	createPlatformDictionaryItem: mocks.createPlatformDictionaryItem,
	createPlatformDictionaryType: mocks.createPlatformDictionaryType,
	deletePlatformDictionaryItem: mocks.deletePlatformDictionaryItem,
	deletePlatformDictionaryType: mocks.deletePlatformDictionaryType,
	listPlatformDictionaryItems: mocks.listPlatformDictionaryItems,
	listPlatformDictionaryTypes: mocks.listPlatformDictionaryTypes,
	platformDictionaryItemsQueryKey: ["platform-dictionary-items"],
	platformDictionaryTypesQueryKey: ["platform-dictionary-types"],
	updatePlatformDictionaryItem: mocks.updatePlatformDictionaryItem,
	updatePlatformDictionaryType: mocks.updatePlatformDictionaryType,
}));

const dictionaryType = {
	code: "user_status",
	createdAt: "2026-08-20T00:00:00.000Z",
	description: "用户状态选项",
	id: "dict-user-status",
	itemCount: 2,
	name: "用户状态",
	status: "active" as const,
	updatedAt: "2026-08-20T01:00:00.000Z",
};

const dictionaryItem = {
	color: "green",
	createdAt: "2026-08-20T00:00:00.000Z",
	description: "可登录用户",
	id: "dict-item-active",
	label: "启用",
	sort: 10,
	status: "active" as const,
	typeId: dictionaryType.id,
	updatedAt: "2026-08-20T01:00:00.000Z",
	value: "active",
};

beforeAll(async () => {
	i18n.addResourceBundle(
		"zh-CN",
		"translation",
		{
			adminShell: {
				dictionaries: {
					allStatuses: "全部状态",
					cancel: "取消",
					colors: {
						blue: "蓝色",
						cyan: "青色",
						default: "默认",
						green: "绿色",
						orange: "橙色",
						purple: "紫色",
						red: "红色",
					},
					columns: {
						actions: "操作",
						code: "编码",
						color: "颜色",
						description: "描述",
						itemCount: "字典项",
						label: "标签",
						name: "名称",
						sort: "排序值",
						status: "状态",
						updatedAt: "更新时间",
						value: "值",
					},
					confirmDelete: "确认删除",
					createItem: "新建字典项",
					createItemTitle: "新建字典项",
					createType: "新建字典类型",
					createTypeTitle: "新建字典类型",
					typeDetailTitle: "字典类型详情",
					delete: "删除",
					deleteItemDescription: "确认删除字典项 {{label}}？",
					deleteItemTitle: "删除字典项",
					deleteTypeDescription: "确认删除字典类型 {{name}}？",
					deleteTypeTitle: "删除字典类型",
					disable: "停用",
					edit: "编辑",
					editItemTitle: "编辑字典项",
					editTypeTitle: "编辑字典类型",
					itemDetailTitle: "字典项详情",
					enable: "启用",
					errors: {
						delete: "删除失败",
						fallback: "请稍后重试",
						load: "加载失败",
						save: "保存失败",
					},
					fields: {
						code: "编码",
						color: "颜色",
						createdAt: "创建时间",
						description: "描述",
						label: "标签",
						name: "名称",
						sort: "排序值",
						status: "状态",
						value: "值",
					},
					filters: {
						q: "关键词",
						status: "状态",
					},
					itemEmpty: "暂无字典项",
					itemTableTitle: "字典项",
					manageItems: "管理项",
					more: "更多",
					noTypeSelected: "请选择字典类型后管理字典项",
					placeholders: {
						code: "请输入字典编码",
						description: "请输入描述",
						itemQuery: "搜索标签或值",
						label: "请输入标签",
						name: "请输入字典名称",
						query: "搜索名称或编码",
						sort: "请输入排序值",
						value: "请输入值",
					},
					save: "保存",
					statuses: {
						active: "启用",
						disabled: "停用",
					},
					toggleItemDescription: "确认将字典项 {{label}} {{action}}？",
					toggleItemTitle: "变更字典项状态",
					toggleError: "状态更新失败",
					toggleSuccess: "状态已更新",
					toggleTypeDescription: "确认将字典类型 {{name}} {{action}}？",
					toggleTypeTitle: "变更字典类型状态",
					typeEmpty: "暂无字典类型",
					typeTableTitle: "字典类型",
					validation: {
						codeLength: "编码最多 64 个字符",
						labelLength: "标签最多 80 个字符",
						nameLength: "名称最多 80 个字符",
						valueLength: "值最多 80 个字符",
					},
				},
			},
		},
		true,
		true,
	);
	await i18n.changeLanguage("zh-CN");
});

beforeEach(() => {
	sessionStorage.clear();
	mocks.listPlatformDictionaryTypes.mockReset().mockResolvedValue({
		items: [dictionaryType],
		page: 1,
		pageSize: 10,
		total: 1,
	});
	mocks.listPlatformDictionaryItems.mockReset().mockResolvedValue({
		items: [dictionaryItem],
		page: 1,
		pageSize: 10,
		total: 1,
	});
	mocks.createPlatformDictionaryType
		.mockReset()
		.mockResolvedValue(dictionaryType);
	mocks.updatePlatformDictionaryType
		.mockReset()
		.mockResolvedValue(dictionaryType);
	mocks.deletePlatformDictionaryType.mockReset().mockResolvedValue(undefined);
	mocks.createPlatformDictionaryItem
		.mockReset()
		.mockResolvedValue(dictionaryItem);
	mocks.updatePlatformDictionaryItem
		.mockReset()
		.mockResolvedValue(dictionaryItem);
	mocks.deletePlatformDictionaryItem.mockReset().mockResolvedValue(undefined);
});

function renderDictionariesPage() {
	const queryClient = new QueryClient({
		defaultOptions: {
			mutations: { retry: false },
			queries: { retry: false },
		},
	});

	render(
		<ConfigProvider>
			<LocalePreferencesProvider
				value={{
					currency: "CNY",
					language: "zh-CN",
					onChangeCurrency: vi.fn(),
					onChangeTimeZone: vi.fn(),
					timeZone: "Asia/Shanghai",
				}}
			>
				<QueryClientProvider client={queryClient}>
					<DictionariesPage />
				</QueryClientProvider>
			</LocalePreferencesProvider>
		</ConfigProvider>,
	);

	return userEvent.setup();
}

describe("DictionariesPage", () => {
	it("uses one tabbed workspace for types and items", async () => {
		renderDictionariesPage();

		await screen.findByText("用户状态");
		expect(
			screen.getByTestId("admin-dictionaries-type-query-form"),
		).toBeVisible();
		expect(screen.getByRole("tab", { name: "字典类型" })).toHaveAttribute(
			"aria-selected",
			"true",
		);
		expect(
			screen.queryByTestId("admin-dictionaries-item-query-form"),
		).not.toBeInTheDocument();

		fireEvent.click(
			within(screen.getByTestId("admin-dictionaries-type-table")).getByText(
				"管理项",
			),
		);

		expect(screen.getByRole("tab", { name: "字典项" })).toHaveAttribute(
			"aria-selected",
			"true",
		);
		expect(
			screen.getByTestId("admin-dictionaries-item-query-form"),
		).toBeVisible();
		expect(
			screen.queryByTestId("admin-dictionaries-type-query-form"),
		).not.toBeInTheDocument();
	});

	it("submits dictionary type keyword filters through the API", async () => {
		const user = renderDictionariesPage();

		await screen.findByText("用户状态");
		await user.type(screen.getByPlaceholderText("搜索名称或编码"), "user");
		// Avoid jsdom's expensive accessibility scan of the Pro form; click its visible action.
		await user.click(
			within(
				screen.getByTestId("admin-dictionaries-type-query-form"),
			).getByText(/查\s*询/),
		);

		await waitFor(() => {
			expect(mocks.listPlatformDictionaryTypes).toHaveBeenLastCalledWith(
				expect.objectContaining({ q: "user" }),
				expect.any(AbortSignal),
			);
		});
	});

	it("creates dictionary types through a drawer", async () => {
		const user = renderDictionariesPage();

		await screen.findByText("用户状态");
		await user.click(screen.getByRole("button", { name: "新建字典类型" }));
		await user.type(
			await screen.findByPlaceholderText("请输入字典编码"),
			"order_status",
		);
		await user.type(screen.getByPlaceholderText("请输入字典名称"), "订单状态");
		await user.click(screen.getByRole("button", { name: /保\s*存/ }));

		await waitFor(() => {
			expect(mocks.createPlatformDictionaryType).toHaveBeenCalledWith({
				code: "order_status",
				description: "",
				name: "订单状态",
				status: "active",
			});
		});
	});

	it("selects a dictionary type and manages items", async () => {
		renderDictionariesPage();

		await screen.findByText("用户状态");
		fireEvent.click(
			within(screen.getByTestId("admin-dictionaries-type-table")).getByText(
				"管理项",
				{ exact: true },
			),
		);
		await within(
			screen.getByTestId("admin-dictionaries-item-table"),
		).findByText("用户状态");
		fireEvent.click(
			within(screen.getByTestId("admin-dictionaries-item-table")).getByText(
				"新建字典项",
				{ exact: true },
			),
		);
		fireEvent.change(await screen.findByPlaceholderText("请输入值"), {
			target: { value: "locked" },
		});
		fireEvent.change(screen.getByPlaceholderText("请输入标签"), {
			target: { value: "锁定" },
		});
		fireEvent.change(screen.getByPlaceholderText("请输入排序值"), {
			target: { value: "30" },
		});
		fireEvent.click(
			within(screen.getByRole("dialog")).getByRole("button", {
				name: /保\s*存/,
			}),
		);

		await waitFor(() => {
			expect(mocks.createPlatformDictionaryItem).toHaveBeenCalledWith({
				input: {
					color: "default",
					description: "",
					label: "锁定",
					sort: 30,
					status: "active",
					value: "locked",
				},
				typeId: dictionaryType.id,
			});
		});
	});

	it("opens dictionary type details from the type name", async () => {
		const user = renderDictionariesPage();

		await screen.findByText("用户状态");
		const typeTable = screen.getByTestId("admin-dictionaries-type-table");
		await user.click(within(typeTable).getByText("用户状态", { exact: true }));

		const dialog = await screen.findByRole("dialog");
		expect(within(dialog).getByText("字典类型详情")).toBeInTheDocument();
		expect(within(dialog).getByText(dictionaryType.id)).toBeInTheDocument();
		expect(within(dialog).getByText("user_status")).toBeInTheDocument();
		expect(within(dialog).getByText("用户状态选项")).toBeInTheDocument();
	});

	it("opens dictionary item details from the item label", async () => {
		renderDictionariesPage();

		await screen.findByText("用户状态");
		const typeTable = screen.getByTestId("admin-dictionaries-type-table");
		fireEvent.click(within(typeTable).getByText("管理项", { exact: true }));
		await within(
			screen.getByTestId("admin-dictionaries-item-table"),
		).findByText("用户状态");
		await waitFor(() =>
			expect(mocks.listPlatformDictionaryItems).toHaveBeenCalled(),
		);
		const itemTable = screen.getByTestId("admin-dictionaries-item-table");
		await waitFor(() => {
			expect(itemTable.textContent).toContain("active");
		});
		const itemLabelButton = Array.from(
			itemTable.querySelectorAll("button"),
		).find((button) => button.textContent === "启用");
		if (!itemLabelButton) {
			throw new Error("Dictionary item label button was not rendered.");
		}
		fireEvent.click(itemLabelButton);

		const dialog = await screen.findByRole("dialog");
		expect(within(dialog).getByText("字典项详情")).toBeInTheDocument();
		expect(within(dialog).getByText(dictionaryItem.id)).toBeInTheDocument();
		expect(within(dialog).getByText(dictionaryItem.typeId)).toBeInTheDocument();
		expect(within(dialog).getByText("active")).toBeInTheDocument();
		expect(within(dialog).getByText("可登录用户")).toBeInTheDocument();
	});

	it("deletes dictionary items only after explicit confirmation", async () => {
		renderDictionariesPage();

		await waitFor(() => {
			expect(mocks.listPlatformDictionaryItems).toHaveBeenCalled();
		});
		fireEvent.click(
			within(screen.getByTestId("admin-dictionaries-type-table")).getByText(
				"管理项",
				{ exact: true },
			),
		);
		const itemTable = screen.getByTestId("admin-dictionaries-item-table");
		await waitFor(() => {
			expect(itemTable.textContent).toContain("更多");
		});
		const moreButton = Array.from(itemTable.querySelectorAll("button")).find(
			(button) => button.textContent?.includes("更多"),
		);
		if (!moreButton) {
			throw new Error("Dictionary item action menu was not rendered.");
		}
		fireEvent.click(moreButton);
		const deleteMenuItem = (await screen.findByText("删除")).closest(
			'[role="menuitem"]',
		);
		if (!deleteMenuItem) {
			throw new Error("Dictionary item delete menu item was not rendered.");
		}
		fireEvent.click(deleteMenuItem);
		const confirmButton = screen.getByText("确认删除").closest("button");
		if (!confirmButton) {
			throw new Error("Delete confirmation button was not rendered.");
		}
		fireEvent.click(confirmButton);

		await waitFor(() => {
			expect(mocks.deletePlatformDictionaryItem.mock.calls[0]?.[0]).toBe(
				dictionaryItem.id,
			);
		});
	});

	it("toggles dictionary type status directly through the edit mutation", async () => {
		const user = renderDictionariesPage();

		await screen.findByText("用户状态");
		const typeTable = screen.getByTestId("admin-dictionaries-type-table");
		await user.click(within(typeTable).getByText("更多", { exact: true }));
		await user.click(screen.getByRole("menuitem", { name: /停用/ }));

		await waitFor(() => {
			expect(mocks.updatePlatformDictionaryType).toHaveBeenCalledWith({
				input: {
					code: dictionaryType.code,
					description: dictionaryType.description,
					name: dictionaryType.name,
					status: "disabled",
				},
				typeId: dictionaryType.id,
			});
		});
		expect(screen.queryByText("变更字典类型状态")).not.toBeInTheDocument();
	});
});
