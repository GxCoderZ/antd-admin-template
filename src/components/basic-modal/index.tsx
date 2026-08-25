import type { ModalProps } from "antd";

import { Modal } from "antd";

export type BasicModalProps = ModalProps;

export function BasicModal({ destroyOnHidden = true, ...props }: BasicModalProps) {
	return <Modal destroyOnHidden={destroyOnHidden} {...props} />;
}
