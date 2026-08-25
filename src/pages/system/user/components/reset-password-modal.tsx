import type { UserItemType } from "#src/api/system/user";

import { Form, Input, Modal, Typography } from "antd";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

interface ResetPasswordModalProps {
	loading?: boolean
	onClose: () => void
	onSubmit: (password: string) => Promise<boolean>
	open: boolean
	user?: UserItemType
}

export function ResetPasswordModal({ loading = false, onClose, onSubmit, open, user }: ResetPasswordModalProps) {
	const { t } = useTranslation();
	const [form] = Form.useForm<{ password: string }>();

	useEffect(() => {
		if (!open)
			form.resetFields();
	}, [form, open]);

	return (
		<Modal
			cancelButtonProps={{ disabled: loading }}
			cancelText={t("common.cancel")}
			confirmLoading={loading}
			destroyOnHidden
			onCancel={onClose}
			onOk={() => form.submit()}
			okText={t("system.user.resetPassword")}
			open={open}
			title={t("system.user.resetPassword")}
		>
			<Typography.Paragraph type="secondary">
				{t("system.user.resetPasswordDescription", { username: user?.username })}
			</Typography.Paragraph>
			<Form form={form} layout="vertical" onFinish={values => onSubmit(values.password)} requiredMark={false}>
				<Form.Item label={t("system.user.newPassword")} name="password" rules={[{ required: true }, { min: 8, message: t("system.user.passwordMinLength") }]}>
					<Input.Password autoComplete="new-password" placeholder={t("system.user.pleaseInputPassword")} />
				</Form.Item>
			</Form>
		</Modal>
	);
}
