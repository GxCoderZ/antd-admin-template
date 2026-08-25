import type { ButtonProps, MenuProps } from "antd";

import { BasicButton } from "#src/components/basic-button";
import { loginPath } from "#src/router/extra-info";
import { useAuthStore } from "#src/store/auth";
import { useUserStore } from "#src/store/user";
import { cn } from "#src/utils/cn";

import { LogoutOutlined, SettingOutlined, UserOutlined } from "@ant-design/icons";
import { Avatar, Dropdown } from "antd";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

export function UserMenu({ ...restProps }: ButtonProps) {
	const navigate = useNavigate();
	const { t } = useTranslation();
	const avatar = useUserStore(state => state.avatar);
	const logout = useAuthStore(state => state.logout);

	const onClick: MenuProps["onClick"] = async ({ key }) => {
		if (key === "/account/profile" || key === "/account/settings") {
			navigate(key);
			return;
		}
		if (key === "logout") {
			await logout();
			navigate(loginPath);
		}
	};

	const items: MenuProps["items"] = [
		{
			label: t("account.profileTitle"),
			key: "/account/profile",
			icon: <UserOutlined />,
		},
		{
			label: t("account.settingsTitle"),
			key: "/account/settings",
			icon: <SettingOutlined />,
		},
		{
			label: t("authority.logout"),
			key: "logout",
			icon: <LogoutOutlined />,
		},
	];

	return (
		<Dropdown
			menu={{ items, onClick }}
			arrow={false}
			placement="bottomRight"
			trigger={["click"]}
		>
			<BasicButton
				type="text"
				{...restProps}
				className={cn(restProps.className, "rounded-full px-1")}
			>
				<Avatar src={avatar} />
			</BasicButton>
		</Dropdown>
	);
}
