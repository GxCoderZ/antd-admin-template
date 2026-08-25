import type { AppRouteRecordRaw } from "#src/router/types";
import ContainerLayout from "#src/layout/container-layout";
import { system } from "#src/router/extra-info";

import { lazy } from "react";

const User = lazy(() => import("#src/pages/system/user"));
const Role = lazy(() => import("#src/pages/system/role"));
const Menu = lazy(() => import("#src/pages/system/menu"));
const PlatformSettings = lazy(() => import("#src/pages/system/settings"));
const AboutSystem = lazy(() => import("#src/pages/system/about"));

const routes: AppRouteRecordRaw[] = [
	{
		path: "/system",
		Component: ContainerLayout,
		handle: {
			icon: "SettingOutlined",
			title: "common.menu.system",
			order: system,
		},
		children: [
			{
				path: "/system/user",
				Component: User,
				handle: {
					icon: "UserOutlined",
					title: "common.menu.user",
					permission: "system:user:view",
				},
			},
			{
				path: "/system/role",
				Component: Role,
				handle: {
					icon: "TeamOutlined",
					title: "common.menu.role",
					permission: "system:role:view",
				},
			},
			{
				path: "/system/menu",
				Component: Menu,
				handle: {
					hideInMenu: true,
					icon: "MenuOutlined",
					title: "common.menu.permission",
					permission: "system:permission:view",
				},
			},
			{
				path: "/system/settings",
				Component: PlatformSettings,
				handle: {
					icon: "SettingOutlined",
					title: "common.menu.settings",
					permission: "system:settings:view",
				},
			},
			{
				path: "/system/about",
				Component: AboutSystem,
				handle: {
					icon: "InfoCircleOutlined",
					title: "common.menu.about",
					permission: "system:info:view",
				},
			},
		],
	},
];

export default routes;
