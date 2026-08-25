import type { RoleItemType } from "#src/api/system/role";

import { Form, Input, Modal } from "antd";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

interface RenameRoleModalProps {
	loading?: boolean
	onClose: () => void
	onSubmit: (name: string) => Promise<boolean>
	open: boolean
	role?: RoleItemType
}

export function RenameRoleModal({ loading = false, onClose, onSubmit, open, role }: RenameRoleModalProps) {
	const { t } = useTranslation();
	const [form] = Form.useForm<{ name: string }>();

	useEffect(() => {
		if (open && role)
			form.setFieldsValue({ name: role.name });
		else if (!open)
			form.resetFields();
	}, [form, open, role]);

	return (
		<Modal cancelButtonProps={{ disabled: loading }} cancelText={t("common.cancel")} confirmLoading={loading} destroyOnHidden onCancel={onClose} onOk={() => form.submit()} okText={t("common.confirm")} open={open} title={t("system.role.renameRole")}>
			<Form form={form} layout="vertical" onFinish={values => onSubmit(values.name)} requiredMark={false}>
				<Form.Item label={t("system.role.key")}><Input disabled value={role?.key} /></Form.Item>
				<Form.Item label={t("system.role.name")} name="name" rules={[{ required: true }, { max: 40 }]}><Input /></Form.Item>
			</Form>
		</Modal>
	);
}
