export type ExampleItemStatus = "active" | "archived" | "pending";

export interface ExampleListItem {
	createdAt: string;
	description: string;
	id: string;
	owner: string;
	status: ExampleItemStatus;
	title: string;
}

export interface ListExampleItemsInput {
	page: number;
	pageSize: number;
	q?: string;
	status?: ExampleItemStatus;
}

export interface ExampleRecordDetail extends ExampleListItem {
	activity: Array<{ at: string; content: string; id: string }>;
	participants: string[];
	progress: number;
	updatedAt: string;
}
