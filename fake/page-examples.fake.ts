import { defineFakeRoute } from "vite-plugin-fake-server/client";

import { exampleItems, exampleRecord } from "./store";
import { pageValue, resultError, resultSuccess, routeParam } from "./utils";

export default defineFakeRoute([
	{
		method: "get",
		url: "/examples/items",
		response: ({ query }) => {
			const page = pageValue(query.page, 1);
			const pageSize = pageValue(query.page_size, 10);
			const keyword = String(query.q ?? "")
				.trim()
				.toLowerCase();
			const status = routeParam(query.status);
			const filtered = exampleItems.filter(
				(item) =>
					(!keyword ||
						item.title.toLowerCase().includes(keyword) ||
						item.description.toLowerCase().includes(keyword) ||
						item.owner.toLowerCase().includes(keyword)) &&
					(!status || item.status === status),
			);
			const start = (page - 1) * pageSize;
			return resultSuccess({
				items: filtered.slice(start, start + pageSize),
				page,
				page_size: pageSize,
				total: filtered.length,
			});
		},
	},
	{
		method: "get",
		url: "/examples/records/:recordId",
		response: ({ params }) =>
			routeParam(params.recordId) === exampleRecord.id
				? resultSuccess(exampleRecord)
				: resultError("Example record not found", 404),
	},
]);
