import { defineConfig, globalIgnores } from "eslint/config";
import reactHooks from "eslint-plugin-react-hooks";
import { reactRefresh } from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

const runtimeFiles = ["src/**/*.{ts,tsx}", "fake/**/*.ts"];
const testFiles = ["**/*.test.{ts,tsx}", "src/test/**"];
const forbiddenImports = {
	group: ["**/fake", "**/fake/**", "axios", "axios/**"],
	message:
		"Use a domain API through src/api; UI and API code must not import Fake data.",
};
const runtimeSyntax = [
	{
		selector:
			"CallExpression[callee.name=/^(setTimeout|setInterval|eval|Function)$/]",
		message:
			"Fix the owning state/lifecycle; runtime timers and dynamic code are not allowed.",
	},
	{
		selector:
			"CallExpression[callee.type='MemberExpression'][callee.property.name=/^(setTimeout|setInterval|eval|Function)$/]",
		message: "Runtime timers and dynamic code are not allowed.",
	},
	{
		selector:
			"CallExpression[callee.type='MemberExpression'][callee.property.value=/^(setTimeout|setInterval|eval|Function)$/]",
		message: "Runtime timers and dynamic code are not allowed.",
	},
	{
		selector: "NewExpression[callee.name='Function']",
		message: "Dynamic code execution is not allowed.",
	},
	{
		selector:
			"TSAsExpression > TSAsExpression[typeAnnotation.type='TSUnknownKeyword']",
		message: "Validate the contract instead of casting through unknown.",
	},
	{
		selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']",
		message:
			"Render structured React content; raw HTML needs a reviewed exception.",
	},
];
const fetchSyntax = [
	{
		selector: "CallExpression[callee.name='fetch']",
		message: "fetch belongs only in src/api/client.ts; call a domain API.",
	},
	{
		selector:
			"CallExpression[callee.type='MemberExpression'][callee.property.name='fetch']",
		message: "fetch belongs only in src/api/client.ts; call a domain API.",
	},
	{
		selector:
			"CallExpression[callee.type='MemberExpression'][callee.property.value='fetch']",
		message: "fetch belongs only in src/api/client.ts; call a domain API.",
	},
];

export default defineConfig(
	globalIgnores(["dist"]),
	...tseslint.configs.recommendedTypeChecked,
	reactHooks.configs.flat.recommended,
	reactRefresh.configs.vite(),
	{
		linterOptions: { noInlineConfig: true },
		languageOptions: {
			parserOptions: {
				projectService: true,
				tsconfigRootDir: import.meta.dirname,
			},
		},
	},
	{
		files: runtimeFiles,
		ignores: testFiles,
		rules: {
			"no-empty": ["error", { allowEmptyCatch: false }],
			"no-restricted-syntax": ["error", ...runtimeSyntax, ...fetchSyntax],
			"@typescript-eslint/ban-ts-comment": [
				"error",
				{
					"ts-check": false,
					"ts-expect-error": true,
					"ts-ignore": true,
					"ts-nocheck": true,
				},
			],
		},
	},
	{
		files: ["src/api/client.ts"],
		rules: { "no-restricted-syntax": ["error", ...runtimeSyntax] },
	},
	{
		files: ["src/**/*.{ts,tsx}"],
		ignores: testFiles,
		rules: {
			"no-restricted-imports": ["error", { patterns: [forbiddenImports] }],
		},
	},
	{
		files: ["src/features/**/*.{ts,tsx}"],
		ignores: testFiles,
		rules: {
			"no-restricted-imports": [
				"error",
				{
					patterns: [
						forbiddenImports,
						{
							group: ["**/api/client", "**/api/client.ts", "#src/api/client"],
							importNames: ["request"],
							message:
								"Pages call domain API functions, not the raw HTTP client.",
						},
					],
				},
			],
		},
	},
	{
		files: ["src/api/**/*.ts"],
		ignores: testFiles,
		rules: {
			"no-restricted-imports": [
				"error",
				{
					patterns: [
						forbiddenImports,
						{
							group: ["**/app/**", "**/features/**", "**/locales/**"],
							message:
								"API contracts cannot depend on app assembly, pages or translations.",
						},
					],
				},
			],
		},
	},
);
