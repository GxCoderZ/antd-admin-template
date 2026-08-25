import type { UserCreateReq } from "#src/api/system/user";

import { BasicButton } from "#src/components/basic-button";

import { Drawer, Flex, Form, Input } from "antd";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

interface CreateUserDrawerProps {
	loading?: boolean
	onClose: () => void
	onSubmit: (values: UserCreateReq) => Promise<boolean>
	open: boolean
}

export function CreateUserDrawer({ loading = false, onClose, onSubmit, open }: CreateUserDrawerProps) {
	const { t } = useTranslation();
	const [form] = Form.useForm<UserCreateReq>();

	useEffect(() => {
		if (!open)
			form.resetFields();
	}, [form, open]);

	return (
		<Drawer
			destroyOnHidden
			extra={(
				<Flex gap="small">
					<BasicButton disabled={loading} onClick={onClose}>{t("common.cancel")}</BasicButton>
					<BasicButton loading={loading} type="primary" onClick={() => form.submit()}>{t("common.confirm")}</BasicButton>
				</Flex>
			)}
			onClose={onClose}
			open={open}
			title={t("system.user.addUser")}
			width={520}
		>
			<Form<UserCreateReq>
				form={form}
				layout="vertical"
				onFinish={async (values) => {
					if (await onSubmit(values))
						form.resetFields();
				}}
				requiredMark={false}
			>
				<Form.Item label={t("system.user.username")} name="username" rules={[{ required: true }, { min: 3 }, { max: 32 }]}>
					<Input autoComplete="off" placeholder={t("system.user.pleaseInputUsername")} />
				</Form.Item>
				<Form.Item label={t("system.user.displayName")} name="display_name" rules={[{ required: true }, { max: 40 }]}>
					<Input placeholder={t("system.user.pleaseInputDisplayName")} />
				</Form.Item>
				<Form.Item label={t("system.user.email")} name="email" rules={[{ required: true }, { type: "email", message: t("system.user.emailFormat") }]}>
					<Input autoComplete="off" placeholder={t("system.user.pleaseInputEmail")} />
				</Form.Item>
				<Form.Item label={t("system.user.password")} name="password" rules={[{ required: true }, { min: 8, message: t("system.user.passwordMinLength") }]}>
					<Input.Password autoComplete="new-password" placeholder={t("system.user.pleaseInputPassword")} />
				</Form.Item>
			</Form>
		</Drawer>
	);
}
