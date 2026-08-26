import {
	type Dispatch,
	type SetStateAction,
	useCallback,
	useState,
} from "react";

const ROUTE_SESSION_PREFIX = "react-antd-admin.route-session.";
const ROUTE_SESSION_VERSION = 1;

interface RouteSessionStateOptions<State> {
	initialState: State;
	routeKey: string;
	stateKey: string;
}

interface StoredRouteSessionState<State> {
	hasState: true;
	state?: State;
	version: number;
}

function getRouteSessionStoragePrefix(routeKey: string) {
	return `${ROUTE_SESSION_PREFIX}${encodeURIComponent(routeKey)}.`;
}

function getRouteSessionStorageKey(routeKey: string, stateKey: string) {
	return `${getRouteSessionStoragePrefix(routeKey)}${stateKey}`;
}

function readRouteSessionState<State>(key: string, fallback: State): State {
	try {
		const rawValue = globalThis.sessionStorage.getItem(key);
		if (!rawValue) {
			return fallback;
		}

		const parsedValue: unknown = JSON.parse(rawValue);
		if (!parsedValue || typeof parsedValue !== "object") {
			return fallback;
		}

		const storedValue = parsedValue as Partial<StoredRouteSessionState<State>>;
		return storedValue.version === ROUTE_SESSION_VERSION &&
			storedValue.hasState === true
			? (storedValue.state as State)
			: fallback;
	} catch {
		return fallback;
	}
}

function writeRouteSessionState<State>(key: string, state: State) {
	try {
		const storedValue: StoredRouteSessionState<State> = {
			hasState: true,
			state,
			version: ROUTE_SESSION_VERSION,
		};
		globalThis.sessionStorage.setItem(key, JSON.stringify(storedValue));
	} catch {
		// Route state is optional; storage failures must not block page interaction.
	}
}

export function clearRouteSessionState(routeKey: string) {
	try {
		const storagePrefix = getRouteSessionStoragePrefix(routeKey);
		const keysToRemove: string[] = [];

		for (let index = 0; index < globalThis.sessionStorage.length; index += 1) {
			const key = globalThis.sessionStorage.key(index);
			if (key?.startsWith(storagePrefix)) {
				keysToRemove.push(key);
			}
		}

		keysToRemove.forEach((key) => globalThis.sessionStorage.removeItem(key));
	} catch {
		// Route state is optional; storage failures must not block tab closing.
	}
}

export function useRouteSessionState<State>({
	initialState,
	routeKey,
	stateKey,
}: RouteSessionStateOptions<State>): [State, Dispatch<SetStateAction<State>>] {
	const storageKey = getRouteSessionStorageKey(routeKey, stateKey);
	const [state, setState] = useState<State>(() =>
		readRouteSessionState(storageKey, initialState),
	);
	const updateState: Dispatch<SetStateAction<State>> = useCallback(
		(nextState) => {
			setState((currentState) => {
				const resolvedState =
					typeof nextState === "function"
						? (nextState as (current: State) => State)(currentState)
						: nextState;
				writeRouteSessionState(storageKey, resolvedState);
				return resolvedState;
			});
		},
		[storageKey],
	);

	return [state, updateState];
}
