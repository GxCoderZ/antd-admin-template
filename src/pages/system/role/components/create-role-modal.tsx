import type { RoleCreateReq } from "#src/api/system/role";

import { BasicModal } from "#src/components/basic-modal";

import { Form, Input } from "antd";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

interface CreateRoleModalProps {
	loading?: boolean
	onClose: () => void
	onSubmit: (values: RoleCreateReq) => Promise<boolean>
	open: boolean
}

export function CreateRoleModal({ loading = false, onClose, onSubmit, open }: CreateRoleModalProps) {
	const { t } = useTranslation();
	const [form] = Form.useForm<RoleCreateReq>();

	useEffect(() => {
		if (!open)
			form.resetFields();
	}, [form, open]);

	return (
		<BasicModal cancelButtonProps={{ disabled: loading }} cancelText={t("common.cancel")} confirmLoading={loading} onCancel={onClose} onOk={() => form.submit()} okText={t("common.confirm")} open={open} title={t("system.role.addRole")}>
			<Form<RoleCreateReq> form={form} layout="vertical" onFinish={onSubmit} requiredMark={false}>
				<Form.Item label={t("system.role.name")} name="name" rules={[{ required: true }, { max: 40 }]}>
					<Input placeholder={t("system.role.namePlaceholder")} />
				</Form.Item>
				<Form.Item
					extra={t("system.role.keyImmutableHint")}
					label={t("system.role.key")}
					name="key"
					rules={[{ required: true }, { pattern: /^[a-z][a-z0-9-]{2,31}$/, message: t("system.role.keyFormat") }]}
				>
					<Input placeholder="product-operator" />
				</Form.Item>
				<Form.Item label={t("common.remark")} name="remark" rules={[{ max: 120 }]}>
					<Input.TextArea autoSize={{ minRows: 3, maxRows: 5 }} />
				</Form.Item>
			</Form>
		</BasicModal>
	);
}
