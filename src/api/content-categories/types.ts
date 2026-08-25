type ContentCategoryStatus = "active" | "disabled";
export type ContentCategoryItemStatus = "draft" | "published";

export interface ContentCategory {
	children: ContentCategory[];
	code: string;
	id: string;
	itemCount: number;
	name: string;
	parentId: string | null;
	sortOrder: number;
	status: ContentCategoryStatus;
}

export interface SaveContentCategoryInput {
	code: string;
	name: string;
	parentId: string | null;
	status: ContentCategoryStatus;
}

export interface ContentCategoryItem {
	categoryId: string;
	categoryName: string;
	id: string;
	owner: string;
	status: ContentCategoryItemStatus;
	title: string;
	updatedAt: string;
}

export interface SaveContentCategoryItemInput {
	categoryId: string;
	owner: string;
	status: ContentCategoryItemStatus;
	title: string;
}

export interface ListContentCategoryItemsInput {
	categoryId?: string;
	order?: "asc" | "desc";
	page: number;
	pageSize: number;
	q?: string;
	sort?: "category" | "owner" | "status" | "title" | "updated_at";
	status?: ContentCategoryItemStatus;
}
