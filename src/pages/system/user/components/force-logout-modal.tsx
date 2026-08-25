import type { UserItemType } from "#src/api/system/user";

import { BasicButton } from "#src/components/basic-button";
import { DangerConfirmation } from "#src/components/danger-confirmation";

import { Modal, Result } from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface ForceLogoutModalProps {
	loading?: boolean
	onClose: () => void
	onSubmit: () => Promise<number>
	open: boolean
	user?: UserItemType
}

export function ForceLogoutModal({ loading = false, onClose, onSubmit, open, user }: ForceLogoutModalProps) {
	const { t } = useTranslation();
	const [revokedSessions, setRevokedSessions] = useState<number>();

	const handleClose = () => {
		setRevokedSessions(undefined);
		onClose();
	};

	if (revokedSessions !== undefined) {
		return (
			<Modal centered footer={<BasicButton type="primary" onClick={handleClose}>{t("common.done")}</BasicButton>} onCancel={handleClose} open={open} title={t("system.user.forceLogoutResult")}>
				<Result status="success" title={t("system.user.revokedSessions", { count: revokedSessions })} />
			</Modal>
		);
	}

	return (
		<DangerConfirmation
			impact={t("system.user.forceLogoutImpact", { username: user?.username })}
			loading={loading}
			onCancel={handleClose}
			onConfirm={async () => setRevokedSessions(await onSubmit())}
			open={open}
			targetName={user?.username ?? ""}
			title={t("system.user.forceLogout")}
		/>
	);
}
