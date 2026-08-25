import type { ReactNode } from "react";
import { useMemo } from "react";

import { ForbiddenPage } from "../features/exceptions/ExceptionPages";

import {
	PermissionContext,
	type PlatformPermission,
	usePermission,
} from "./permissions";

export function PermissionProvider({
	children,
	permissions,
}: {
	children: ReactNode;
	permissions: readonly PlatformPermission[];
}) {
	const value = useMemo(() => new Set(permissions), [permissions]);

	return (
		<PermissionContext.Provider value={value}>
			{children}
		</PermissionContext.Provider>
	);
}

export function PermissionBoundary({
	children,
	permission,
}: {
	children: ReactNode;
	permission: PlatformPermission | undefined;
}) {
	const isAllowed = usePermission(permission);

	if (isAllowed) {
		return children;
	}

	return <ForbiddenPage />;
}
