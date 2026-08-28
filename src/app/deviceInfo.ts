import UAParser from "ua-parser-js";

export interface DeviceDetails {
	browser?: string;
	operatingSystem?: string;
}

export function getDeviceDetails(userAgent: string | undefined): DeviceDetails {
	const normalizedUserAgent = userAgent?.trim();

	if (!normalizedUserAgent) {
		return {};
	}

	const { browser, os } = new UAParser(normalizedUserAgent).getResult();
	const browserName = browser.name?.trim();
	const browserVersion = browser.version?.split(".")[0]?.trim();
	const operatingSystemName = os.name?.trim();
	const operatingSystemVersion = os.version?.trim();

	return {
		...(browserName
			? {
					browser: browserVersion
						? `${browserName} ${browserVersion}`
						: browserName,
				}
			: {}),
		...(operatingSystemName
			? {
					operatingSystem: operatingSystemVersion
						? `${operatingSystemName} ${operatingSystemVersion}`
						: operatingSystemName,
				}
			: {}),
	};
}

export function formatDeviceInfo(
	userAgent: string | undefined,
	unknownDevice: string,
) {
	const { browser, operatingSystem } = getDeviceDetails(userAgent);

	if (!browser || !operatingSystem) {
		return unknownDevice;
	}

	return `${browser} · ${operatingSystem}`;
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
