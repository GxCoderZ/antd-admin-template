import type { AccountRoleType } from "#src/api/account";

import { Space, Tag, Typography } from "antd";
import { useTranslation } from "react-i18next";

interface AccountRoleTagsProps {
	roles: AccountRoleType[]
}

export function AccountRoleTags({ roles }: AccountRoleTagsProps) {
	const { t } = useTranslation();
	if (roles.length === 0)
		return <Typography.Text type="secondary">{t("account.noRoles")}</Typography.Text>;
	return <Space size="small" wrap>{roles.map(role => <Tag key={role.id}>{role.name}</Tag>)}</Space>;
}
