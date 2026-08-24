import { defineFakeRoute } from "vite-plugin-fake-server/client";

import { resultSuccess } from "./utils";

export default defineFakeRoute([
	{
		url: "/dashboard/summary",
		method: "post",
		response: () => resultSuccess({
			metrics: [
				{ key: "users", title: "用户数", value: 28, trend: 12.5, trendLabel: "较上周" },
				{ key: "roles", title: "角色数", value: 6, trend: 0, trendLabel: "保持稳定" },
				{ key: "permissions", title: "权限项", value: 13, trend: 8.3, trendLabel: "较上周" },
				{ key: "operations", title: "今日操作", value: 156, trend: -3.2, trendLabel: "较昨日" },
			],
			activities: [
				{ id: 1, actor: "产品管理员", action: "创建了用户", target: "design-reviewer", created_at: "10 分钟前" },
				{ id: 2, actor: "产品管理员", action: "更新了角色", target: "内容运营", created_at: "35 分钟前" },
				{ id: 3, actor: "只读体验者", action: "查看了权限", target: "系统权限", created_at: "1 小时前" },
			],
			updated_at: "2026-08-24 15:00:00",
		}),
	},
]);
