import { BasicButton } from "#src/components/basic-button";
import { BasicModal } from "#src/components/basic-modal";

import { CopyOutlined } from "@ant-design/icons";
import { Alert, Flex, Input, Typography } from "antd";
import { useTranslation } from "react-i18next";

interface ResetPasswordResultProps {
	onClose: () => void
	open: boolean
	password: string
	username: string
}

export function ResetPasswordResult({ onClose, open, password, username }: ResetPasswordResultProps) {
	const { t } = useTranslation();
	const copyPassword = async () => {
		await navigator.clipboard?.writeText(password);
		window.$message?.success(t("system.user.passwordCopied"));
	};

	return (
		<BasicModal centered footer={<BasicButton type="primary" onClick={onClose}>{t("common.done")}</BasicButton>} onCancel={onClose} open={open} title={t("system.user.resetPasswordSuccess")}>
			<Flex gap="middle" vertical>
				<Alert description={t("system.user.passwordShownOnce", { username })} showIcon type="warning" />
				<div>
					<Typography.Text type="secondary">{t("system.user.temporaryPassword")}</Typography.Text>
					<Flex className="mt-2" gap="small">
						<Input readOnly value={password} />
						<BasicButton aria-label={t("system.user.copyPassword")} icon={<CopyOutlined />} onClick={copyPassword} />
					</Flex>
				</div>
			</Flex>
		</BasicModal>
	);
}
