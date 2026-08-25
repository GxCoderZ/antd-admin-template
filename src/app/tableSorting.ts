type ApiSortOrder = "asc" | "desc";

type TableSortOrder = "ascend" | "descend" | null | undefined;

interface ResolvedTableSort<TSort extends string> {
	order: ApiSortOrder | undefined;
	sort: TSort | undefined;
}

export function resolveTableSort<TSort extends string>(
	columnKey: unknown,
	order: TableSortOrder,
	sortMap: Readonly<Record<string, TSort>>,
): ResolvedTableSort<TSort> {
	if (typeof columnKey !== "string" || !order) {
		return { order: undefined, sort: undefined };
	}

	const sort = sortMap[columnKey];
	return sort
		? { order: order === "ascend" ? "asc" : "desc", sort }
		: { order: undefined, sort: undefined };
}
