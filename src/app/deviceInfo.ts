import UAParser from "ua-parser-js";

export function formatDeviceInfo(
	userAgent: string | undefined,
	unknownDevice: string,
) {
	const normalizedUserAgent = userAgent?.trim();

	if (!normalizedUserAgent) {
		return unknownDevice;
	}

	const { browser, os } = new UAParser(normalizedUserAgent).getResult();
	const browserName = browser.name?.trim();
	const browserVersion = browser.version?.split(".")[0]?.trim();
	const operatingSystem = os.name?.trim();

	if (!browserName || !browserVersion || !operatingSystem) {
		return unknownDevice;
	}

	return `${browserName} ${browserVersion} · ${operatingSystem}`;
}

export function getPrimaryLanguage(acceptLanguage: string | undefined) {
	return acceptLanguage?.split(",")[0]?.split(";")[0]?.trim() || undefined;
}

export function getBrowserTimeZone() {
	try {
		return (
			Intl.DateTimeFormat().resolvedOptions().timeZone?.trim() || undefined
		);
	} catch {
		return undefined;
	}
}
