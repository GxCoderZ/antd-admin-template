import type { MenuItemType } from "#src/layout/layout-menu/types";

import { createAccessSnapshot } from "#src/router/utils/create-access-snapshot";

function collectMenuKeys(items: MenuItemType[]): string[] {
	return items.flatMap(item => [item.key, ...collectMenuKeys(item.children ?? [])]);
}

describe("createAccessSnapshot", () => {
	it("filters menus while retaining the full route matching snapshot", () => {
		const snapshot = createAccessSnapshot(["system:user:view"]);
		const menuKeys = collectMenuKeys(snapshot.wholeMenus);

		expect(snapshot.permissions).toEqual(new Set(["system:user:view"]));
		expect(snapshot.routeList.length).toBeGreaterThan(0);
		expect(Object.keys(snapshot.flatRouteList).length).toBeGreaterThan(0);
		expect(menuKeys).toContain("/system/user");
		expect(menuKeys).not.toContain("/system/role");
	});
});
