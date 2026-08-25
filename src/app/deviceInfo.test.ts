import { describe, expect, it } from "vitest";

import { formatDeviceInfo, getDeviceDetails } from "./deviceInfo";

const windowsChromeUserAgent =
	"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140 Safari/537.36";

describe("device information", () => {
	it("keeps combined and individual device labels aligned", () => {
		expect(getDeviceDetails(windowsChromeUserAgent)).toEqual({
			browser: "Chrome 140",
			operatingSystem: "Windows 10",
		});
		expect(formatDeviceInfo(windowsChromeUserAgent, "未知设备")).toBe(
			"Chrome 140 · Windows 10",
		);
	});
});
