import { ESLint, Linter } from "eslint";
import { beforeAll, describe, expect, it } from "vitest";
import tseslint from "typescript-eslint";

const eslint = new ESLint();
const linter = new Linter();
const ruleNames = [
	"no-restricted-imports",
	"no-restricted-syntax",
	"no-empty",
	"@typescript-eslint/no-explicit-any",
	"@typescript-eslint/ban-ts-comment",
];
const paths = {
	page: "src/features/organization/UsersPage.tsx",
	api: "src/api/users/index.ts",
	client: "src/api/client.ts",
	test: "src/features/organization/UsersPage.test.tsx",
};
const configs = {};

beforeAll(async () => {
	for (const [key, filePath] of Object.entries(paths)) {
		const config = await eslint.calculateConfigForFile(filePath);
		configs[key] = {
			files: ["**/*.tsx"],
			languageOptions: {
				parser: tseslint.parser,
				parserOptions: { ecmaFeatures: { jsx: true } },
			},
			linterOptions: config.linterOptions,
			plugins: { "@typescript-eslint": tseslint.plugin },
			rules: Object.fromEntries(
				ruleNames.map((name) => [name, config.rules[name] ?? "off"]),
			),
		};
	}
});

function violations(source, scope = "page") {
	return linter.verify(source, configs[scope], { filename: "fixture.tsx" });
}

describe("runtime architecture rules", () => {
	it.each([
		'fetch("/api/users");',
		'window.fetch("/api/users");',
		'globalThis["fetch"]("/api/users");',
		"setTimeout(() => {}, 100);",
		"window.setInterval(() => {}, 100);",
		"const result = input as unknown as string;",
		"const result = input as any;",
		'// @ts-expect-error deliberately bypass a contract\nconst count: number = "bad";',
		"try { run(); } catch {}",
		'eval("run()");',
		'new Function("return 1");',
		"const node = <div dangerouslySetInnerHTML={{ __html: value }} />;",
	])("rejects forbidden runtime behavior: %s", (source) => {
		expect(violations(source).some((message) => message.severity === 2)).toBe(
			true,
		);
	});

	it.each([
		'import data from "../../../fake/store";',
		'import axios from "axios";',
		'import { request } from "#src/api/client";',
		'import { request as rawRequest } from "../../api/client";',
	])("rejects a page crossing its API boundary: %s", (source) => {
		expect(
			violations(source).some(
				(message) => message.ruleId === "no-restricted-imports",
			),
		).toBe(true);
	});

	it.each([
		'import { usePreference } from "#src/app/preferenceStorage";',
		'import { UsersPage } from "../../features/organization/UsersPage";',
		'import data from "../../../fake/store";',
	])("rejects an API depending on UI or Fake: %s", (source) => {
		expect(
			violations(source, "api").some(
				(message) => message.ruleId === "no-restricted-imports",
			),
		).toBe(true);
	});

	it("allows domain requests, error contracts and optional business data", () => {
		expect(
			violations('import { listPlatformUsers } from "#src/api/users";'),
		).toEqual([]);
		expect(
			violations('import { ApiProblemError } from "#src/api/client";'),
		).toEqual([]);
		expect(violations('const label = record.description ?? "";')).toEqual([]);
		expect(
			violations('const label = "setTimeout is not a function call";'),
		).toEqual([]);
	});

	it("allows fetch only at the HTTP owner and timers in test code", () => {
		expect(violations('fetch("/api/users");', "client")).toEqual([]);
		expect(violations("setTimeout(() => {}, 100);", "test")).toEqual([]);
	});

	it("does not let inline directives disable a boundary", () => {
		const messages = violations(
			'// eslint-disable-next-line no-restricted-syntax\nfetch("/api/users");',
		);
		expect(
			messages.some((message) => message.ruleId === "no-restricted-syntax"),
		).toBe(true);
	});
});
