export interface TableColumnConfig<Key extends string = string> {
	key: Key;
	visibility: "required" | "recommended" | "optional";
}
