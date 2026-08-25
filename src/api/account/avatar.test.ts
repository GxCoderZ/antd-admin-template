import { afterEach, describe, expect, it, vi } from "vitest";

import { uploadPlatformAccountAvatar } from "./index";

describe("account avatar API", () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("serializes the image and sends it through the local API namespace", async () => {
		const fetchMock = vi.fn().mockResolvedValue(
			new Response(JSON.stringify({ code: 0, data: null, msg: "OK" }), {
				status: 200,
			}),
		);
		vi.stubGlobal("fetch", fetchMock);
		const file = new File(["image"], "avatar.png", { type: "image/png" });

		await uploadPlatformAccountAvatar(file);

		expect(fetchMock).toHaveBeenCalledOnce();
		const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
		expect(url).toBe("/api/platform/account/avatar");
		expect(options.method).toBe("PUT");
		expect(options.body).toBe(
			JSON.stringify({ dataUrl: "data:image/png;base64,aW1hZ2U=" }),
		);
	});
});
