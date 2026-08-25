import type { AppRouteRecordRaw } from "#src/router/types";

import ContainerLayout from "#src/layout/container-layout";
import { operations } from "#src/router/extra-info";

import { lazy } from "react";

const AuditLog = lazy(() => import("#src/pages/audit"));
const LoginLog = lazy(() => import("#src/pages/login-log"));

const routes: AppRouteRecordRaw[] = [
	{
		path: "/operations",
		Component: ContainerLayout,
		handle: {
			icon: "ProfileOutlined",
			title: "common.menu.operations",
			order: operations,
		},
		children: [
			{
				path: "/operations/audit-logs",
				Component: AuditLog,
				handle: { title: "common.menu.audit", permission: "audit:view" },
			},
			{
				path: "/operations/login-logs",
				Component: LoginLog,
				handle: { title: "common.menu.loginLog", permission: "login-log:view" },
			},
		],
	},
];

export default routes;
