import type { DrawerProps } from "antd";

import { Drawer } from "antd";

export type BasicDrawerProps = DrawerProps;

export function BasicDrawer({ destroyOnHidden = true, ...props }: BasicDrawerProps) {
	return <Drawer destroyOnHidden={destroyOnHidden} {...props} />;
}
