import { fireEvent, render, screen } from "@testing-library/react";
import type { FormEvent } from "react";
import { describe, expect, it, vi } from "vitest";

import { QueryFilterSubmitter } from "./QueryFilterSubmitter";

describe("QueryFilterSubmitter", () => {
	it("matches the Pro reset and query button contract", () => {
		const onReset = vi.fn();
		const onSubmit = vi.fn((event: FormEvent) => event.preventDefault());
		const { rerender } = render(
			<form onSubmit={onSubmit}>
				<QueryFilterSubmitter
					loading={false}
					onReset={onReset}
					queryText="Query"
					resetText="Reset"
				/>
			</form>,
		);
		const buttons = screen.getAllByRole("button");

		expect(buttons.map((button) => button.textContent)).toEqual([
			"Reset",
			"Query",
		]);
		expect(buttons[0]?.parentElement).toHaveStyle({
			gap: "8px",
			justifyContent: "flex-end",
			width: "100%",
		});
		fireEvent.click(screen.getByRole("button", { name: "Reset" }));
		fireEvent.click(screen.getByRole("button", { name: "Query" }));
		expect(onReset).toHaveBeenCalledOnce();
		expect(onSubmit).toHaveBeenCalledOnce();

		rerender(
			<form onSubmit={onSubmit}>
				<QueryFilterSubmitter
					loading
					onReset={onReset}
					queryText="Query"
					resetText="Reset"
				/>
			</form>,
		);
		expect(screen.getByRole("button", { name: "Reset" })).toBeEnabled();
		expect(screen.getByRole("button", { name: /Query$/ })).toHaveClass(
			"ant-btn-loading",
		);
	});
});
