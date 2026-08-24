import { useAccessStore } from "#src/store/access";

/**
 * 权限判断 Hook
 *
 * @example
 * ```tsx
 * const hasAddPermission = usePermission('sys:user:add');
 * const hasEditPermission = usePermission('sys:user:edit');
 *
 * if (hasAddPermission) {
 *   // 显示新增按钮
 * }
 * ```
 */
export function usePermission(perm: string | string[]): boolean {
	const permissions = useAccessStore(state => state.permissions);

	// 支持单个权限码或权限码数组
	if (Array.isArray(perm)) {
		// 数组：至少有一个权限即返回 true（OR 逻辑）
		return perm.some(p => permissions.has(p));
	}
	else {
		// 单个权限码
		return permissions.has(perm);
	}
}

/**
 * 判断是否拥有所有权限（AND 逻辑）
 *
 * @example
 * ```tsx
 * const hasAllPermissions = usePermissionAll(['sys:user:add', 'sys:user:edit']);
 * ```
 */
export function usePermissionAll(perms: string[]): boolean {
	const permissions = useAccessStore(state => state.permissions);

	return perms.every(p => permissions.has(p));
}
