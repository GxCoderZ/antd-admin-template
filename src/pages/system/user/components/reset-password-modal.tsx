import type { UserItemType } from "#src/api/system/user";

import { BasicModal } from "#src/components/basic-modal";
import { DangerConfirmationContent } from "#src/components/danger-confirmation";

import { Form, Input } from "antd";
import { useEffect, useState } from "react";
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
	const [confirmationState, setConfirmationState] = useState({ targetName: "", value: "" });
	const targetName = user?.username ?? "";
	const confirmation = confirmationState.targetName === targetName ? confirmationState.value : "";

	useEffect(() => {
		if (!open) {
			form.resetFields();
		}
	}, [form, open]);

	return (
		<BasicModal
			afterOpenChange={(nextOpen) => {
				if (!nextOpen)
					setConfirmationState({ targetName: "", value: "" });
			}}
			cancelButtonProps={{ disabled: loading }}
			cancelText={t("common.cancel")}
			confirmLoading={loading}
			closable={!loading}
			keyboard={!loading}
			maskClosable={!loading}
			onCancel={onClose}
			onOk={() => form.submit()}
			okButtonProps={{ danger: true, disabled: confirmation !== targetName }}
			okText={t("system.user.resetPassword")}
			open={open}
			title={t("system.user.resetPassword")}
		>
			<Form form={form} layout="vertical" onFinish={values => onSubmit(values.password)} requiredMark={false}>
				<Form.Item label={t("system.user.newPassword")} name="password" rules={[{ required: true }, { min: 12, message: t("system.user.passwordMinLength") }]}>
					<Input.Password autoComplete="new-password" placeholder={t("system.user.pleaseInputPassword")} />
				</Form.Item>
				<DangerConfirmationContent
					disabled={loading}
					impact={t("system.user.resetPasswordDescription", { username: user?.username })}
					onChange={value => setConfirmationState({ targetName, value })}
					targetName={targetName}
					value={confirmation}
				/>
			</Form>
		</BasicModal>
	);
}
