import type { AppRouteRecordRaw } from "#src/router/types";

import ContainerLayout from "#src/layout/container-layout";
import { audit } from "#src/router/extra-info";

import { lazy } from "react";

const Audit = lazy(() => import("#src/pages/audit"));

const routes: AppRouteRecordRaw[] = [
	{
		path: "/audit",
		Component: ContainerLayout,
		handle: {
			icon: "AuditOutlined",
			title: "common.menu.audit",
			order: audit,
			permission: "audit:view",
		},
		children: [
			{
				index: true,
				Component: Audit,
				handle: { title: "common.menu.audit", permission: "audit:view" },
			},
		],
	},
];

export default routes;
