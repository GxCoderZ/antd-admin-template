import { defineFakeRoute } from "vite-plugin-fake-server/client";

import { getDashboardSummary } from "./store";
import { resultSuccess } from "./utils";

export default defineFakeRoute([
	{
		url: "/dashboard/summary",
		method: "post",
		response: () => resultSuccess(getDashboardSummary()),
	},
]);
