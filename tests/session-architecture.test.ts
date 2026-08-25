import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const read = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), "utf8");

describe("session dependency boundaries", () => {
	it("keeps session stores free of transport and router side effects", () => {
		const authStore = read("src/store/auth.ts");
		const userStore = read("src/store/user.ts");
		const accessStore = read("src/store/access.ts");

		expect(authStore).not.toContain("#src/api");
		expect(authStore).not.toContain("useUserStore");
		expect(authStore).not.toContain("useAccessStore");
		expect(authStore).not.toContain("useTabsStore");
		expect(userStore).not.toContain("fetchCurrentUser");
		expect(userStore).not.toContain("#src/utils/request");
		expect(accessStore).not.toContain("#src/router/routes");
		expect(accessStore).not.toMatch(/from\s+"#src\/router"/);
		expect(accessStore).not.toContain("persist(");
	});

	it("routes refresh traffic through the leaf transport", () => {
		const refreshCoordinator = read("src/utils/request/refresh.ts");
		const refreshEndpoint = read("src/api/auth/refresh.ts");
		const rawClient = read("src/utils/request/client.ts");

		expect(refreshCoordinator).toContain("#src/api/auth/refresh");
		expect(refreshEndpoint).toContain("#src/utils/request/client");
		expect(refreshEndpoint).not.toMatch(/from\s+"#src\/utils\/request"/);
		expect(rawClient).not.toMatch(/#src\/(api|store|router|application)/);
	});

	it("refreshes the report and fails the gate when cycles exist", () => {
		const packageJson = read("package.json");
		const circularGate = read("scripts/check-circular-deps.mjs");

		expect(packageJson).toContain("node scripts/check-circular-deps.mjs");
		expect(circularGate).toContain("writeFileSync(reportPath, \"[]\\n\"");
		expect(circularGate).toContain("if (cycles.length > 0)");
		expect(circularGate).toContain("process.exit(1)");
	});
});
