import type { Options } from "ky";

import ky from "ky";

const API_TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT) || 10000;

const rawRequestConfig: Options = {
	prefixUrl: "",
	timeout: API_TIMEOUT,
	retry: {
		limit: 3,
	},
};

export const rawRequest = ky.create(rawRequestConfig);
