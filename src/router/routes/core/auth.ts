import type { AppRouteRecordRaw } from "#src/router/types";

import { $t } from "#src/locales";
import { forgotPasswordPath, loginPath } from "#src/router/extra-info";

import { lazy } from "react";

const Login = lazy(() => import("#src/pages/login"));
const ForgotPassword = lazy(() => import("#src/pages/forgot-password"));

const routes: AppRouteRecordRaw[] = [
	{
		path: loginPath,
		Component: Login,
		handle: {
			hideInMenu: true,
			title: $t("authority.login"),
		},
	},
	{
		path: forgotPasswordPath,
		Component: ForgotPassword,
		handle: {
			hideInMenu: true,
			title: $t("authority.forgotPassword"),
		},
	},
];

export default routes;
