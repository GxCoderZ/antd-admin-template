import type { UserItemType, UserStatus, UserUpdateReq } from "#src/api/system/user";

import { BasicModal } from "#src/components/basic-modal";

import { Alert, Form, Input, Select } from "antd";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

interface EditUserValues {
	display_name: string
	email: string
	status: UserStatus
}

interface EditUserModalProps {
	loading?: boolean
	onClose: () => void
	onSubmit: (values: UserUpdateReq) => Promise<boolean>
	open: boolean
	user?: UserItemType
}

export function EditUserModal({ loading = false, onClose, onSubmit, open, user }: EditUserModalProps) {
	const { t } = useTranslation();
	const [form] = Form.useForm<EditUserValues>();
	const status = Form.useWatch("status", form);

	useEffect(() => {
		if (open && user) {
			form.setFieldsValue({ display_name: user.display_name, email: user.email, status: user.status });
		}
	}, [form, open, user]);

	return (
		<BasicModal
			cancelButtonProps={{ disabled: loading }}
			cancelText={t("common.cancel")}
			confirmLoading={loading}
			onCancel={onClose}
			onOk={() => form.submit()}
			okText={t("common.confirm")}
			open={open}
			title={t("system.user.editUser")}
		>
			<Form<EditUserValues>
				form={form}
				layout="vertical"
				onFinish={values => user && onSubmit({ id: user.id, ...values })}
				requiredMark={false}
			>
				<Form.Item label={t("system.user.username")}>
					<Input disabled value={user?.username} />
				</Form.Item>
				<Form.Item label={t("system.user.displayName")} name="display_name" rules={[{ required: true }, { max: 40 }]}>
					<Input />
				</Form.Item>
				<Form.Item label={t("system.user.email")} name="email" rules={[{ required: true }, { type: "email", message: t("system.user.emailFormat") }]}>
					<Input />
				</Form.Item>
				<Form.Item label={t("common.status")} name="status" rules={[{ required: true }]}>
					<Select options={[
						{ label: t("system.user.status.active"), value: 1 },
						{ label: t("system.user.status.locked"), value: 2 },
						{ label: t("system.user.status.disabled"), value: 3 },
					]}
					/>
				</Form.Item>
				{status === 3 && <Alert description={t("system.user.disableWarning")} showIcon type="warning" />}
			</Form>
		</BasicModal>
	);
}
