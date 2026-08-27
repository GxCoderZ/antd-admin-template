import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import {
	clearRouteSessionState,
	useRouteSessionState,
} from "./routeSessionState";

interface QueryDraft {
	q: string;
	status: string;
}

function QueryDraftHarness({ routeKey }: Readonly<{ routeKey: string }>) {
	const [draft, setDraft] = useRouteSessionState<QueryDraft>({
		initialState: { q: "", status: "all" },
		routeKey,
		stateKey: "query-draft",
	});

	return (
		<label>
			查询词
			<input
				onChange={(event) =>
					setDraft((current) => ({ ...current, q: event.target.value }))
				}
				value={draft.q}
			/>
		</label>
	);
}

function OptionalSortHarness() {
	const [sort, setSort] = useRouteSessionState<string | undefined>({
		initialState: "created_at",
		routeKey: "/operations/audit-logs",
		stateKey: "sort",
	});

	return (
		<button type="button" onClick={() => setSort(undefined)}>
			{sort ?? "none"}
		</button>
	);
}

function VersionedSortHarness({ version }: Readonly<{ version: number }>) {
	const [sort, setSort] = useRouteSessionState<string | undefined>({
		initialState: undefined,
		routeKey: "/access/roles",
		stateKey: "sort",
		version,
	});

	return (
		<>
			<output aria-label="sort">{sort ?? "none"}</output>
			<button type="button" onClick={() => setSort("role_key")}>
				Sort
			</button>
			<button type="button" onClick={() => setSort(undefined)}>
				Clear
			</button>
		</>
	);
}

describe("route session state", () => {
	beforeEach(() => {
		sessionStorage.clear();
	});

	it("restores state after the route component unmounts", async () => {
		const user = userEvent.setup();
		const firstRender = render(
			<QueryDraftHarness routeKey="/organization/users" />,
		);

		await user.type(screen.getByRole("textbox", { name: "查询词" }), "42");
		firstRender.unmount();
		render(<QueryDraftHarness routeKey="/organization/users" />);

		expect(screen.getByRole("textbox", { name: "查询词" })).toHaveValue("42");
	});

	it("clears only the closed route state", async () => {
		const user = userEvent.setup();
		const usersRender = render(
			<QueryDraftHarness routeKey="/organization/users" />,
		);
		await user.type(screen.getByRole("textbox", { name: "查询词" }), "users");
		usersRender.unmount();

		const rolesRender = render(<QueryDraftHarness routeKey="/access/roles" />);
		await user.type(screen.getByRole("textbox", { name: "查询词" }), "roles");
		rolesRender.unmount();

		clearRouteSessionState("/organization/users");
		const restoredRoles = render(
			<QueryDraftHarness routeKey="/access/roles" />,
		);
		expect(screen.getByRole("textbox", { name: "查询词" })).toHaveValue(
			"roles",
		);
		restoredRoles.unmount();

		render(<QueryDraftHarness routeKey="/organization/users" />);
		expect(screen.getByRole("textbox", { name: "查询词" })).toHaveValue("");
	});

	it("restores an explicitly cleared optional value", async () => {
		const user = userEvent.setup();
		const firstRender = render(<OptionalSortHarness />);

		await user.click(screen.getByRole("button", { name: "created_at" }));
		firstRender.unmount();
		render(<OptionalSortHarness />);

		expect(screen.getByRole("button", { name: "none" })).toBeVisible();
	});

	it("invalidates only state whose declared version changed", async () => {
		const user = userEvent.setup();
		const firstRender = render(
			<>
				<VersionedSortHarness version={1} />
				<QueryDraftHarness routeKey="/access/roles" />
			</>,
		);
		await user.click(screen.getByRole("button", { name: "Sort" }));
		await user.type(screen.getByRole("textbox", { name: "查询词" }), "audit");
		firstRender.unmount();
		render(
			<>
				<VersionedSortHarness version={2} />
				<QueryDraftHarness routeKey="/access/roles" />
			</>,
		);

		expect(screen.getByRole("status", { name: "sort" })).toHaveTextContent(
			"none",
		);
		expect(screen.getByRole("textbox", { name: "查询词" })).toHaveValue(
			"audit",
		);
	});

	it("persists selected and cleared sorting using its current version", async () => {
		const user = userEvent.setup();
		const firstRender = render(<VersionedSortHarness version={2} />);
		await user.click(screen.getByRole("button", { name: "Sort" }));
		firstRender.unmount();
		const secondRender = render(<VersionedSortHarness version={2} />);
		expect(screen.getByRole("status", { name: "sort" })).toHaveTextContent(
			"role_key",
		);
		await user.click(screen.getByRole("button", { name: "Clear" }));
		secondRender.unmount();
		render(<VersionedSortHarness version={2} />);
		expect(screen.getByRole("status", { name: "sort" })).toHaveTextContent(
			"none",
		);
	});
});
