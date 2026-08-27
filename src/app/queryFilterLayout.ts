import { useReducer } from "react";

// Match the search configuration in Ant Design Pro's table-list template.
export const managementQueryLayout = { labelWidth: 120 };

export function useQuerySubmission() {
	const [revision, submit] = useReducer((value: number) => value + 1, 0);

	return { revision, submit };
}
