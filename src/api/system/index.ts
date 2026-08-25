import { request } from "../client";
import type { SystemInfoData } from "./types";

export * from "./types";

export const systemInfoQueryKey = "system-info";

export function getSystemInfo(signal?: AbortSignal) {
	return request<SystemInfoData>("/system/info", { signal });
}
