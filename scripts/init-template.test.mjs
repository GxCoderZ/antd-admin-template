import { createHash } from "node:crypto";
import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { afterEach, describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);
const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const script = join(repositoryRoot, "scripts", "init-template.mjs");
const workspaces = [];

async function createFixture() {
	const workspace = await mkdtemp(join(tmpdir(), "antd-admin-template-init-"));
	workspaces.push(workspace);
	for (const name of ["fake", "src", "public"]) {
		await cp(join(repositoryRoot, name), join(workspace, name), { recursive: true });
	}
	for (const name of ["README.md", "index.html", "package.json"]) {
		await cp(join(repositoryRoot, name), join(workspace, name));
	}
	await writeFile(join(workspace, "brand.svg"), "<svg xmlns=\"http://www.w3.org/2000/svg\" />\n");
	return workspace;
}

function checksum(value) {
	return createHash("sha256").update(value).digest("hex");
}

afterEach(async () => {
	await Promise.all(workspaces.splice(0).map((workspace) => rm(workspace, { force: true, recursive: true })));
});

describe("template initializer", () => {
	it("reports a deterministic dry-run and leaves the template unchanged", async () => {
		const workspace = await createFixture();
		const packageBefore = await readFile(join(workspace, "package.json"));
		const args = [script, "--project-name", "warehouse-console", "--display-name", "仓储控制台", "--permission-prefix", "warehouse", "--logo", "brand.svg", "--dry-run"];
		const first = await execFileAsync(process.execPath, args, { cwd: workspace });
		const second = await execFileAsync(process.execPath, args, { cwd: workspace });
		expect(first.stdout).toBe(second.stdout);
		expect(JSON.parse(first.stdout)).toMatchObject({ dryRun: true });
		expect(await readFile(join(workspace, "package.json"))).toEqual(packageBefore);
	});

	it("verifies the logo checksum and updates only template metadata", async () => {
		const workspace = await createFixture();
		const logo = await readFile(join(workspace, "brand.svg"));
		const logoChecksum = checksum(logo);
		await execFileAsync(process.execPath, [script, "--project-name", "warehouse-console", "--display-name", "仓储控制台", "--permission-prefix", "warehouse", "--logo", "brand.svg", "--logo-sha256", logoChecksum], { cwd: workspace });

		expect(await readFile(join(workspace, "package.json"), "utf8")).toContain('"name": "warehouse-console"');
		expect(await readFile(join(workspace, "src", "app", "permissions.ts"), "utf8")).toContain('"warehouse.users.read"');
		expect(await readFile(join(workspace, "fake", "store.ts"), "utf8")).toContain('"warehouse.users.read"');
		expect(await readFile(join(workspace, "index.html"), "utf8")).toContain('href="/favicon.svg"');
		expect(await readFile(join(workspace, "public", "favicon.svg"))).toEqual(logo);
		const manifest = JSON.parse(await readFile(join(workspace, ".template-init.json"), "utf8"));
		expect(manifest.logo.checksum).toBe(logoChecksum);
		await expect(execFileAsync(process.execPath, [script, "--project-name", "warehouse-console", "--display-name", "仓储控制台", "--permission-prefix", "warehouse", "--logo", "brand.svg", "--dry-run"], { cwd: workspace })).resolves.toBeDefined();

		await expect(execFileAsync(process.execPath, [script, "--project-name", "warehouse-console", "--display-name", "仓储控制台", "--permission-prefix", "warehouse", "--logo", "brand.svg", "--logo-sha256", "0".repeat(64), "--dry-run"], { cwd: workspace })).rejects.toThrow("--logo-sha256 does not match");
	});
});
