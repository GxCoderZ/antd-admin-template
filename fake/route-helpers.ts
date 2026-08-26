import type { FakeRouteConfig } from "vite-plugin-fake-server/client";

interface FakeRouteRequest {
	body?: unknown;
	params?: Record<string, string>;
	query?: Record<string, string>;
}

export interface FakeRoute {
	method?: string;
	response?: (request: FakeRouteRequest) => unknown;
	url: string;
}

export function toFakeRouteList(routes: FakeRouteConfig): readonly FakeRoute[] {
	const routeList = Array.isArray(routes) ? routes : [routes];
	return routeList.map((route) => {
		const fakeRoute: FakeRoute = { url: route.url };
		const method = route.method?.toLowerCase();

		if (method) {
			fakeRoute.method = method;
		}

		if (route.response) {
			fakeRoute.response = (request) =>
				route.response!(
					request as Parameters<NonNullable<typeof route.response>>[0],
					undefined as never,
					undefined as never,
				);
		}

		return fakeRoute;
	});
}

export function findFakeRoute(
	routes: FakeRouteConfig,
	method: string,
	url: string,
) {
	const route = toFakeRouteList(routes).find(
		(candidate) => candidate.method === method && candidate.url === url,
	);

	if (!route?.response) {
		throw new Error(`Missing Fake route: ${method.toUpperCase()} ${url}`);
	}

	return route.response;
}

export function readFakeBody<Body>(body: unknown): Body {
	return body as Body;
}
