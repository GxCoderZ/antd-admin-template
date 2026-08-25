import { request } from "../client";
import type { SystemInfoData } from "./types";

export * from "./types";

export const systemInfoQueryKey = "system-info";

interface SystemServiceData {
	service: string;
}

export async function getSystemInfo(
	signal?: AbortSignal,
): Promise<SystemInfoData> {
	const { service } = await request<SystemServiceData>("/system/info", {
		signal,
	});

	return {
		...__BUILD_METADATA__,
		service,
	};
}
