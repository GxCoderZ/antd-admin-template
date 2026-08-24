import { defineFakeRoute } from "vite-plugin-fake-server/client";

import { resultSuccess } from "./utils";

const records = [
	{ id: 1, operator: "产品管理员", module: "用户管理", action: "新增用户", target: "design-reviewer", result: "success", ip: "10.0.0.21", created_at: "2026-08-24 14:38:00" },
	{ id: 2, operator: "产品管理员", module: "用户管理", action: "分配角色", target: "design-reviewer", result: "success", ip: "10.0.0.21", created_at: "2026-08-24 14:36:00" },
	{ id: 3, operator: "产品管理员", module: "用户管理", action: "重置密码", target: "viewer", result: "failed", ip: "10.0.0.21", created_at: "2026-08-24 13:20:00" },
	{ id: 4, operator: "产品管理员", module: "角色管理", action: "更新角色", target: "内容运营", result: "success", ip: "10.0.0.21", created_at: "2026-08-24 11:15:00" },
	{ id: 5, operator: "只读体验者", module: "权限管理", action: "查看权限", target: "系统权限", result: "success", ip: "10.0.0.32", created_at: "2026-08-24 10:08:00" },
];

export default defineFakeRoute([
	{
		url: "/audit/list",
		method: "post",
		response: ({ body }) => {
			const filtered = records.filter(item =>
				(!body.module || item.module === body.module)
				&& (!body.result || item.result === body.result)
				&& (!body.keyword || `${item.operator}${item.action}${item.target}`.includes(body.keyword)),
			);
			const page = Number(body.page) || 1;
			const pageSize = Number(body.page_size) || 10;
			return resultSuccess({
				items: filtered.slice((page - 1) * pageSize, page * pageSize),
				total: filtered.length,
				page,
				page_size: pageSize,
			});
		},
	},
]);
