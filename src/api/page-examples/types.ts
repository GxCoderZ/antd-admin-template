export type ExampleItemStatus = "active" | "archived" | "pending";

export interface ExampleListItem {
	activeUser: number;
	avatar: string;
	category: string;
	cover: string;
	createdAt: string;
	description: string;
	id: string;
	like: number;
	members: Array<{ avatar: string; id: string; name: string }>;
	message: number;
	newUser: number;
	owner: string;
	rate: "good" | "normal";
	star: number;
	status: ExampleItemStatus;
	subDescription: string;
	title: string;
	updatedAt: string;
}

export interface ListExampleItemsInput {
	author?: string;
	category?: string[];
	owner?: string[];
	page: number;
	pageSize: number;
	q?: string;
	rate?: "good" | "normal";
	status?: ExampleItemStatus;
}

export interface ExampleRecordDetail extends ExampleListItem {
	activity: Array<{ at: string; content: string; id: string }>;
	participants: string[];
	progress: number;
	updatedAt: string;
}
