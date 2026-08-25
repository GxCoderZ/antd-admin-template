import type { AppRouteRecordRaw } from "#src/router/types";

import ContainerLayout from "#src/layout/container-layout";

import { lazy } from "react";

const AccountProfile = lazy(() => import("#src/pages/account/profile"));
const AccountSettings = lazy(() => import("#src/pages/account/settings"));

const routes: AppRouteRecordRaw[] = [
	{
		path: "/account",
		Component: ContainerLayout,
		handle: { hideInMenu: true, title: "account.profileTitle" },
		children: [
			{
				path: "/account/profile",
				Component: AccountProfile,
				handle: { hideInMenu: true, title: "account.profileTitle" },
			},
			{
				path: "/account/settings",
				Component: AccountSettings,
				handle: { hideInMenu: true, title: "account.settingsTitle" },
			},
		],
	},
];

export default routes;
