import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import {
	getPlatformSettings,
	platformSettingsQueryKey,
} from "#src/api/settings";

export function usePlatformSiteTitle() {
	const { t } = useTranslation();
	const settingsQuery = useQuery({
		enabled: false,
		queryFn: ({ signal }) => getPlatformSettings(signal),
		queryKey: platformSettingsQueryKey,
	});

	return settingsQuery.data?.siteTitle.trim() || t("app.name");
}
