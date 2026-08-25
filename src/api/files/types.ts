export interface PlatformFile {
	createdAt: string;
	id: string;
	name: string;
	size: number;
	type: string;
	uploader: string;
}

export interface ListPlatformFilesInput {
	order?: "asc" | "desc";
	page: number;
	pageSize: number;
	q?: string;
	sort?: "created_at" | "name" | "size";
	type?: string;
}

export interface UploadPlatformFileInput {
	file: File;
}
