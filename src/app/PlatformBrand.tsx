import {
	getPlatformSettings,
	platformSettingsQueryKey,
} from "#src/api/settings";
import { useQuery } from "@tanstack/react-query";
import { Alert, Button, Flex, theme } from "antd";
import { useEffect, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { ApplicationSkeleton } from "./LoadingSkeletons";
import { PlatformBrandContext } from "./usePlatformBrand";

export function PlatformBrandProvider({ children }: { children: ReactNode }) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const settings = useQuery({
		queryFn: ({ signal }) => getPlatformSettings(signal),
		queryKey: platformSettingsQueryKey,
		staleTime: Number.POSITIVE_INFINITY,
		refetchOnWindowFocus: false,
	});
	useEffect(() => {
		if (settings.isSuccess) document.title = settings.data.general.browserTitle;
	}, [settings.data, settings.isSuccess]);

	if (settings.isPending) return <ApplicationSkeleton />;
	if (settings.isError) {
		return (
			<Flex style={{ padding: token.paddingLG }}>
				<Alert
					action={
						<Button onClick={() => void settings.refetch()}>
							{t("adminShell.platformSettings.retry")}
						</Button>
					}
					showIcon
					title={t("adminShell.platformSettings.errors.load")}
					type="error"
				/>
			</Flex>
		);
	}
	return (
		<PlatformBrandContext.Provider value={settings.data.general}>
			{children}
		</PlatformBrandContext.Provider>
	);
}
