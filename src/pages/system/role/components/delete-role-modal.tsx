import type { RoleItemType } from "#src/api/system/role";

import { DangerConfirmation } from "#src/components/danger-confirmation";

import { useTranslation } from "react-i18next";

interface DeleteRoleModalProps {
	loading?: boolean
	onClose: () => void
	onSubmit: () => Promise<void>
	open: boolean
	role?: RoleItemType
}

export function DeleteRoleModal({ loading = false, onClose, onSubmit, open, role }: DeleteRoleModalProps) {
	const { t } = useTranslation();
	return (
		<DangerConfirmation
			impact={t("system.role.deleteImpact", { count: role?.user_count ?? 0, name: role?.name })}
			loading={loading}
			onCancel={onClose}
			onConfirm={onSubmit}
			open={open && !role?.is_system}
			targetName={role?.name ?? ""}
			title={t("system.role.deleteRole")}
		/>
	);
}
