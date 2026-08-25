import { defineFakeRoute } from "vite-plugin-fake-server/client";

import { auditLogs, loginLogs } from "./store";
import { pageValue, resultSuccess, routeParam } from "./utils";

function pageRows<T>(items: T[], page: number, pageSize: number) {
	const start = (page - 1) * pageSize;
	return {
		items: items.slice(start, start + pageSize),
		page,
		page_size: pageSize,
		total: items.length,
	};
}

export default defineFakeRoute([
	{
		url: "/platform/audit-logs",
		method: "get",
		response: ({ query }) => {
			const page = pageValue(query.page, 1);
			const pageSize = pageValue(query.page_size, 10);
			const action = routeParam(query.action);
			const result = routeParam(query.result);
			const from = routeParam(query.from);
			const to = routeParam(query.to);
			const items = auditLogs.filter(
				(item) =>
					(!action || item.action.includes(action)) &&
					(!result || item.result === result) &&
					(!from || item.createdAt >= from) &&
					(!to || item.createdAt <= to),
			);
			return resultSuccess(pageRows(items, page, pageSize));
		},
	},
	{
		url: "/platform/login-logs",
		method: "get",
		response: ({ query }) => {
			const page = pageValue(query.page, 1);
			const pageSize = pageValue(query.page_size, 10);
			const result = routeParam(query.result);
			const from = routeParam(query.from);
			const to = routeParam(query.to);
			const items = loginLogs.filter(
				(item) =>
					(!result || item.result === result) &&
					(!from || item.createdAt >= from) &&
					(!to || item.createdAt <= to),
			);
			return resultSuccess(pageRows(items, page, pageSize));
		},
	},
]);
