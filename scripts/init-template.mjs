#!/usr/bin/env node

import { createHash } from "node:crypto";
import { cp, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { basename, extname, join, relative, resolve } from "node:path";

const root = process.cwd();
const defaults = {
	displayName: "React Antd Admin",
	projectName: "antd-admin-template",
	permissionPrefix: "platform",
};
const textExtensions = new Set([".ts", ".tsx", ".md"]);
const logoMimeTypes = {
	".ico": "image/x-icon",
	".png": "image/png",
	".svg": "image/svg+xml",
};

function usage() {
	return `Usage: pnpm init:template -- --project-name <kebab-name> --display-name <name> --permission-prefix <prefix> --logo <path> [--logo-sha256 <sha256>] [--dry-run]

All values except --dry-run are required. The script only changes template metadata,
display branding, the local favicon, and permission string prefixes; it never adds a
real backend or disables the Fake Server.`;
}

function parseArgs(args) {
	const options = { dryRun: false };
	const aliases = {
		"display-name": "displayName",
		logo: "logo",
		"logo-sha256": "logoSha256",
		"permission-prefix": "permissionPrefix",
		"project-name": "projectName",
	};
	for (let index = 0; index < args.length; index += 1) {
		const argument = args[index];
		if (argument === "--help" || argument === "-h") return { help: true };
		if (argument === "--dry-run") {
			options.dryRun = true;
			continue;
		}
		if (!argument?.startsWith("--") || !aliases[argument.slice(2)]) {
			throw new Error(`Unknown argument: ${argument}`);
		}
		const value = args[index + 1];
		if (!value || value.startsWith("--")) {
			throw new Error(`Missing value for ${argument}`);
		}
		options[aliases[argument.slice(2)]] = value;
		index += 1;
	}
	for (const key of [
		"projectName",
		"displayName",
		"permissionPrefix",
		"logo",
	]) {
		if (!options[key])
			throw new Error(
				`Missing required --${key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`,
			);
	}
	return options;
}

function sha256(content) {
	return createHash("sha256").update(content).digest("hex");
}

function validate(options) {
	if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(options.projectName)) {
		throw new Error("--project-name must be lowercase kebab-case.");
	}
	if (!options.displayName.trim() || /[\r\n]/.test(options.displayName)) {
		throw new Error("--display-name must be a non-empty single line.");
	}
	if (!/^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)*$/.test(options.permissionPrefix)) {
		throw new Error(
			"--permission-prefix must be a lowercase dotted or dashed namespace without a trailing separator.",
		);
	}
}

async function listFiles(directory) {
	const entries = await (
		await import("node:fs/promises")
	).readdir(directory, { withFileTypes: true });
	const children = await Promise.all(
		entries.map(async (entry) => {
			const file = join(directory, entry.name);
			if (entry.isDirectory()) return listFiles(file);
			return textExtensions.has(extname(entry.name)) ? [file] : [];
		}),
	);
	return children.flat();
}

function ignoreInvalidManifest(_error) {
	// A fresh template has no manifest. Invalid external metadata is ignored.
}

async function loadCurrentSettings() {
	try {
		const manifest = JSON.parse(
			await readFile(join(root, ".template-init.json"), "utf8"),
		);
		const settings = manifest.settings;
		if (
			typeof settings?.projectName === "string" &&
			typeof settings.displayName === "string" &&
			typeof settings.permissionPrefix === "string"
		)
			return settings;
	} catch (error) {
		ignoreInvalidManifest(error);
	}
	return defaults;
}

async function getTextChanges(options, current) {
	const files = [
		join(root, "README.md"),
		join(root, "index.html"),
		...(await listFiles(join(root, "src"))),
		...(await listFiles(join(root, "fake"))),
	];
	const changes = [];
	let containsPermissionPrefix = false;
	for (const file of files) {
		const before = await readFile(file, "utf8");
		if (file.endsWith(join("src", "app", "permissions.ts"))) {
			containsPermissionPrefix = before.includes(
				`\"${current.permissionPrefix}.`,
			);
		}
		let after = before
			.replaceAll(current.projectName, options.projectName)
			.replaceAll(current.displayName, options.displayName)
			.replaceAll(
				`\"${current.permissionPrefix}.`,
				`\"${options.permissionPrefix}.`,
			);
		if (file.endsWith("index.html")) {
			const extension = extname(options.logo).toLowerCase();
			after = after.replace(
				/<link rel="icon" type="[^"]+" href="[^"]+" \/>/,
				`<link rel="icon" type="${logoMimeTypes[extension]}" href="/favicon${extension}" />`,
			);
		}
		if (after !== before) changes.push({ after, before, file });
	}
	const packageFile = join(root, "package.json");
	const packageBefore = await readFile(packageFile, "utf8");
	if (!packageBefore.includes(`\"name\": \"${current.projectName}\"`)) {
		throw new Error(
			"package.json does not contain the expected current project name.",
		);
	}
	const packageAfter = packageBefore.replace(
		`\"name\": \"${current.projectName}\"`,
		`\"name\": \"${options.projectName}\"`,
	);
	if (packageAfter !== packageBefore)
		changes.push({
			after: packageAfter,
			before: packageBefore,
			file: packageFile,
		});
	if (!containsPermissionPrefix)
		throw new Error(
			"src/app/permissions.ts does not contain the expected current permission prefix.",
		);
	return changes;
}

async function main() {
	const options = parseArgs(process.argv.slice(2));
	if (options.help) {
		console.log(usage());
		return;
	}
	validate(options);
	const logo = resolve(root, options.logo);
	const extension = extname(logo).toLowerCase();
	if (!logoMimeTypes[extension])
		throw new Error("--logo must be a .png, .svg, or .ico file.");
	if (!(await stat(logo)).isFile())
		throw new Error("--logo must point to a file.");
	const logoContent = await readFile(logo);
	const logoChecksum = sha256(logoContent);
	if (options.logoSha256 && options.logoSha256.toLowerCase() !== logoChecksum) {
		throw new Error("--logo-sha256 does not match the supplied logo.");
	}
	const changes = await getTextChanges(options, await loadCurrentSettings());
	const output = changes.map(({ after, before, file }) => ({
		file: relative(root, file),
		from: sha256(before),
		to: sha256(after),
	}));
	output.push({
		file: `public/favicon${extension}`,
		from: "replaced",
		to: logoChecksum,
	});
	console.log(
		JSON.stringify({ dryRun: options.dryRun, changes: output }, null, 2),
	);
	if (options.dryRun) return;
	for (const { after, file } of changes) await writeFile(file, after, "utf8");
	await mkdir(join(root, "public"), { recursive: true });
	await cp(logo, join(root, "public", `favicon${extension}`));
	await writeFile(
		join(root, ".template-init.json"),
		`${JSON.stringify(
			{
				files: output,
				logo: { checksum: logoChecksum, source: basename(logo) },
				settings: {
					displayName: options.displayName,
					permissionPrefix: options.permissionPrefix,
					projectName: options.projectName,
				},
			},
			null,
			2,
		)}\n`,
	);
}

main().catch((error) => {
	console.error(`Template initialization failed: ${error.message}`);
	console.error(usage());
	process.exitCode = 1;
});
