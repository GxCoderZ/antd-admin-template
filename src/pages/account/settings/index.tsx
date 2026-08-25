import type { AccountSettingsSection } from "../constants";

import { BasicCard } from "#src/components/basic-card";
import { BasicContent } from "#src/components/basic-content";

import { Flex, Grid, Menu, theme, Typography } from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { AccountPageHeading } from "../components/account-page-heading";
import { BasicSettings } from "../components/basic-settings";
import { SecuritySettings } from "../components/security-settings";

export default function AccountSettings() {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const screens = Grid.useBreakpoint();
	const [selectedSection, setSelectedSection] = useState<AccountSettingsSection>("basic");
	const isWide = screens.md === true;

	return (
		<BasicContent>
			<Flex gap={token.marginLG} vertical>
				<AccountPageHeading description={t("account.settingsDescription")} title={t("account.settingsTitle")} />
				<BasicCard styles={{ body: { padding: 0 } }}>
					<Flex vertical={!isWide}>
						<Menu
							items={[
								{ key: "basic", label: t("account.basicSettings") },
								{ key: "security", label: t("account.securitySettings") },
							]}
							mode={isWide ? "inline" : "horizontal"}
							onClick={({ key }) => setSelectedSection(key as AccountSettingsSection)}
							selectedKeys={[selectedSection]}
							style={isWide ? { flex: `0 0 ${token.controlHeight * 6}px`, paddingBlock: token.padding } : { width: "100%" }}
						/>
						<Flex gap={token.marginLG} style={{ minWidth: 0, padding: token.paddingLG, width: "100%" }} vertical>
							<Typography.Title level={4} style={{ margin: 0 }}>{t(selectedSection === "basic" ? "account.basicSettings" : "account.securitySettings")}</Typography.Title>
							{selectedSection === "basic" ? <BasicSettings /> : <SecuritySettings />}
						</Flex>
					</Flex>
				</BasicCard>
			</Flex>
		</BasicContent>
	);
}
