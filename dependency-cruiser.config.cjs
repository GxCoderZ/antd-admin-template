/** @type {import("dependency-cruiser").IConfiguration} */
module.exports = {
	forbidden: [
		{
			name: "no-circular",
			comment: "Modules must not participate in circular dependency chains.",
			severity: "error",
			from: {},
			to: {
				circular: true,
			},
		},
		{
			name: "no-ui-to-fake",
			severity: "error",
			from: { path: "^src/", pathNot: "\\.test\\.tsx?$" },
			to: { path: "^fake/" },
		},
		{
			name: "no-api-to-ui",
			severity: "error",
			from: { path: "^src/api/", pathNot: "\\.test\\.ts$" },
			to: { path: "^src/(app|features|locales)/" },
		},
		{
			name: "no-fake-to-ui",
			severity: "error",
			from: { path: "^fake/", pathNot: "\\.test\\.ts$" },
			to: { path: "^src/(app|features|locales)/" },
		},
		{
			name: "no-runtime-to-tests",
			severity: "error",
			from: { path: "^(src|fake)/", pathNot: "\\.test\\.tsx?$|^src/test/" },
			to: { path: "\\.test\\.tsx?$|^src/test/" },
		},
	],
	options: {
		doNotFollow: {
			path: "node_modules",
		},
		tsConfig: {
			fileName: "tsconfig.json",
		},
	},
};
