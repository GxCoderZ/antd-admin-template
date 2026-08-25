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
