import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RecordDetails } from "./RecordDetails";

describe("RecordDetails", () => {
	it("keeps the configured section and field order without adding actions", () => {
		render(
			<RecordDetails
				sections={[
					{
						key: "basic",
						title: "Basic information",
						items: [
							{ label: "Name", children: "Operator" },
							{ label: "Status", children: "Active" },
						],
					},
					{
						key: "technical",
						title: "Technical information",
						items: [{ label: "Request ID", children: "request-001" }],
					},
				]}
			/>,
		);

		const tables = screen.getAllByRole("table");
		expect(tables).toHaveLength(2);
		const [basic, technical] = tables;
		if (!basic || !technical)
			throw new Error("Both detail sections must render");
		expect(
			within(basic)
				.getAllByRole("row")
				.map((row) => row.textContent),
		).toEqual(["NameOperator", "StatusActive"]);
		expect(within(technical).getByText("request-001")).toBeVisible();
		expect(screen.queryByRole("button")).not.toBeInTheDocument();
	});

	it("allows a compact untitled section and retains complete multiline content", () => {
		const content = "First line\nSecond line with a complete value";
		render(
			<RecordDetails
				sections={[
					{
						key: "details",
						items: [{ label: "Content", children: content }],
					},
				]}
			/>,
		);

		expect(screen.getAllByRole("table")).toHaveLength(1);
		expect(
			screen.getByText(content, { normalizer: (value) => value }),
		).toBeVisible();
		expect(screen.queryByText("Basic information")).not.toBeInTheDocument();
	});
});
