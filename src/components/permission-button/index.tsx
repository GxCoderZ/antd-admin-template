import type { ButtonProps } from "antd";

import { usePermission } from "#src/hooks/use-permission";

import { Button } from "antd";

export interface PermissionButtonProps extends ButtonProps {
	/** 权限码，支持单个或多个（多个时满足任一即可） */
	perms?: string | string[]
	/** 子元素 */
	children?: React.ReactNode
}

/**
 * 带权限控制的按钮组件
 *
 * @example
 * ```tsx
 * <PermissionButton perms="sys:user:add" type="primary">
 *   新增用户
 * </PermissionButton>
 *
 * <PermissionButton perms={['sys:user:edit', 'sys:user:delete']}>
 *   编辑或删除
 * </PermissionButton>
 * ```
 */
export function PermissionButton({
	perms,
	children,
	...restProps
}: PermissionButtonProps) {
	const hasPermission = usePermission(perms || "");

	// 没有权限码或无权限时不显示
	if (!perms || !hasPermission) {
		return null;
	}

	return <Button {...restProps}>{children}</Button>;
}
