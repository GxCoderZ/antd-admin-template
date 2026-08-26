import { describe, expect, it } from "vitest";

import type { PlatformFile } from "../src/api/files";
import fileRoutes from "./files.fake";
import { findFakeRoute } from "./route-helpers";

function findRoute(method: string, url: string) {
	return findFakeRoute(fileRoutes, method, url);
}

describe("Fake file management", () => {
	it("supports pagination, search and empty states", () => {
		const list = findRoute("get", "/platform/files");
		const first = list({ query: { page: "1", page_size: "10" } }) as {
			data: { items: PlatformFile[]; total: number };
		};
		const empty = list({
			query: { page: "1", page_size: "10", q: "missing-file" },
		}) as typeof first;
		expect(first.data.items).toHaveLength(10);
		expect(first.data.total).toBeGreaterThan(10);
		expect(empty.data.items).toHaveLength(0);
	});

	it("persists fake upload and delete mutations in the preview session", () => {
		const list = findRoute("get", "/platform/files");
		const upload = findRoute("post", "/platform/files");
		const remove = findRoute("delete", "/platform/files/:fileId");
		const created = upload({
			body: { name: "验收报告.pdf", size: 2048, type: "application/pdf" },
		}) as { data: PlatformFile };
		expect(created.data.name).toBe("验收报告.pdf");
		expect(
			(
				list({ query: { q: "验收报告" } }) as {
					data: { items: PlatformFile[] };
				}
			).data.items,
		).toHaveLength(1);
		remove({ params: { fileId: created.data.id } });
		expect(
			(
				list({ query: { q: "验收报告" } }) as {
					data: { items: PlatformFile[] };
				}
			).data.items,
		).toHaveLength(0);
	});

	it("rejects invalid uploads and unknown deletes", () => {
		const upload = findRoute("post", "/platform/files");
		const remove = findRoute("delete", "/platform/files/:fileId");
		expect(upload({ body: { name: "", size: 0, type: "" } })).toMatchObject({
			code: 422,
		});
		expect(remove({ params: { fileId: "file-missing" } })).toMatchObject({
			code: 404,
		});
	});
});
