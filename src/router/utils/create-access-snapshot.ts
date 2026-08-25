import type { AccessSnapshot } from "#src/store/access";

import { accessRoutes, baseRoutes } from "#src/router/routes";
import { ascending } from "#src/router/utils/ascending";
import { flattenRoutes } from "#src/router/utils/flatten-routes";
import { generateMenuItemsFromRoutes } from "#src/router/utils/generate-menu-items-from-routes";
import { generateRoutesByFrontend } from "#src/router/utils/generate-routes-from-frontend";

export function createAccessSnapshot(userPermissions: string[]): AccessSnapshot {
	const permittedRoutes = generateRoutesByFrontend(accessRoutes, userPermissions);

	return {
		wholeMenus: generateMenuItemsFromRoutes(ascending(permittedRoutes)),
		routeList: baseRoutes,
		flatRouteList: flattenRoutes(baseRoutes),
		permissions: new Set(userPermissions),
	};
}
