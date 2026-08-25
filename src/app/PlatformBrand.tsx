import { useEffect } from "react";

import { usePlatformSiteTitle } from "./usePlatformSiteTitle";

export function PlatformDocumentTitle() {
	const siteTitle = usePlatformSiteTitle();

	useEffect(() => {
		document.title = siteTitle;
	}, [siteTitle]);

	return null;
}
