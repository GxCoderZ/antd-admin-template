import type { AppRouteRecordRaw } from "#src/router/types";

import ContainerLayout from "#src/layout/container-layout";
import { dashboard } from "#src/router/extra-info";

import { lazy } from "react";

const Dashboard = lazy(() => import("#src/pages/dashboard"));

const routes: AppRouteRecordRaw[] = [
	{
		path: "/dashboard",
		Component: ContainerLayout,
		handle: {
			icon: "DashboardOutlined",
			title: "common.menu.dashboard",
			order: dashboard,
			permission: "dashboard:view",
		},
		children: [
			{
				index: true,
				Component: Dashboard,
				handle: { title: "common.menu.dashboard", permission: "dashboard:view" },
			},
		],
	},
];

export default routes;
