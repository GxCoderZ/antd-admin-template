import type { AppRouteRecordRaw } from "#src/router/types";

/**
 * 动态生成路由 - 前端方式
 * 根据用户拥有的权限码过滤路由，未配置 permission 的路由默认可见
 *
 * 过滤规则：
 * - 叶子路由（无 children）：有 permission 则检查，无 permission 则默认可见
 * - 父路由（有 children）：先递归过滤子节点，子节点全被过滤则父节点也隐藏
 */
export function generateRoutesByFrontend(
	routes: AppRouteRecordRaw[],
	permissions: string[],
) {
	const _filter = (nodes: AppRouteRecordRaw[]): AppRouteRecordRaw[] => {
		return nodes.reduce<AppRouteRecordRaw[]>((acc, node) => {
			if (node.children && node.children.length > 0) {
				// 有子路由：先递归过滤子节点，子节点全被过滤则父节点也隐藏
				const filteredChildren = _filter(node.children);
				if (filteredChildren.length > 0) {
					acc.push({ ...node, children: filteredChildren });
				}
			}
			else {
				// 叶子节点：有 permission 则检查权限，无 permission 默认可见
				const permission = node.handle?.permission;
				if (!permission || permissions.includes(permission)) {
					acc.push(node);
				}
			}
			return acc;
		}, []);
	};

	return _filter(routes);
}
