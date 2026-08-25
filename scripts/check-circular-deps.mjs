import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import process from "node:process";
import { fileURLToPath } from "node:url";

const workspaceRoot = fileURLToPath(new URL("../", import.meta.url));
const reportPath = fileURLToPath(new URL("../circular-deps.json", import.meta.url));
const pnpmCliPath = process.env.npm_execpath;

if (!pnpmCliPath) {
	throw new Error("Unable to locate the pnpm executable for the circular dependency scan.");
}

// circular-dependency-scanner does not overwrite an existing report when the
// result is empty, so reset it first to prevent stale paths from surviving.
writeFileSync(reportPath, "[]\n", "utf8");

const scan = spawnSync(
	process.execPath,
	[pnpmCliPath, "exec", "ds", "src", "--output", "circular-deps.json"],
	{
		cwd: workspaceRoot,
		stdio: "inherit",
	},
);

if (scan.error) {
	throw scan.error;
}
if (scan.status !== 0) {
	process.exit(scan.status ?? 1);
}

const cycles = JSON.parse(readFileSync(reportPath, "utf8"));
if (!Array.isArray(cycles)) {
	throw new TypeError("The circular dependency report must contain a JSON array.");
}
if (cycles.length > 0) {
	console.error(`Circular dependency gate failed: ${cycles.length} path(s) found.`);
	process.exit(1);
}

console.log("Circular dependency gate passed: 0 paths found.");
