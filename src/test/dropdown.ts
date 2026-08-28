import { screen, waitFor, within } from "@testing-library/react";
import type userEvent from "@testing-library/user-event";
import { expect } from "vitest";

export async function clickDropdownMenuItem(
	user: ReturnType<typeof userEvent.setup>,
	name: string | RegExp,
) {
	const menu = await screen.findByRole("menu");
	const item = within(menu).getByText(name).closest('[role="menuitem"]')!;
	// JSDOM does not run opacity keyframes; wait for pointer eligibility, not visual motion.
	await waitFor(() => {
		expect(item).not.toHaveStyle({ pointerEvents: "none" });
	});
	await user.click(item);
}
