import type { PlatformSession } from "../src/api/auth";
import type { PlatformAuditLog, PlatformLoginLog } from "../src/api/operations";
import type { PlatformRole } from "../src/api/roles";
import type { PlatformUserDetail } from "../src/api/users";

const now = Date.now();
const iso = (offsetMinutes = 0) =>
	new Date(now - offsetMinutes * 60_000).toISOString();

export const allPermissions = [
	"platform.logs.read",
	"platform.roles.manage",
	"platform.settings.manage",
	"platform.users.read",
	"platform.users.manage",
] as const;

export let signedIn = false;

export function setSignedIn(value: boolean) {
	signedIn = value;
}

export const roles: PlatformRole[] = [
	{
		id: "role-admin",
		roleKey: "platform_admin",
		displayName: "平台管理员",
		memberCount: 10,
		permissions: [...allPermissions],
		version: 1,
	},
	{
		id: "role-operator",
		roleKey: "operator",
		displayName: "运营管理员",
		memberCount: 11,
		permissions: [
			"platform.logs.read",
			"platform.users.read",
			"platform.users.manage",
		],
		version: 1,
	},
	{
		id: "role-auditor",
		roleKey: "auditor",
		displayName: "只读审计员",
		memberCount: 9,
		permissions: ["platform.logs.read", "platform.users.read"],
		version: 1,
	},
];

const generatedUserSeeds = [
	["avery.chen", "Avery Chen"],
	["ethan.chen", "Ethan Chen"],
	["mia.zhao", "Mia Zhao"],
	["lucas.wu", "Lucas Wu"],
	["amelia.hu", "Amelia Hu"],
	["henry.lin", "Henry Lin"],
	["harper.xu", "Harper Xu"],
	["james.he", "James He"],
	["evelyn.guo", "Evelyn Guo"],
	["benjamin.luo", "Benjamin Luo"],
	["abigail.tang", "Abigail Tang"],
	["alex.yang", "Alex Yang"],
	["ella.fang", "Ella Fang"],
	["daniel.xie", "Daniel Xie"],
	["scarlett.cao", "Scarlett Cao"],
	["matthew.deng", "Matthew Deng"],
	["grace.qin", "Grace Qin"],
	["jack.han", "Jack Han"],
	["chloe.ma", "Chloe Ma"],
	["leo.shen", "Leo Shen"],
	["lily.jiang", "Lily Jiang"],
	["samuel.peng", "Samuel Peng"],
	["zoey.du", "Zoey Du"],
	["owen.song", "Owen Song"],
] as const;

export const users: PlatformUserDetail[] = [
	{
		id: "user-admin",
		username: "admin",
		email: "admin@example.com",
		displayName: "Platform Admin",
		status: "active",
		createdAt: iso(70_000),
		updatedAt: iso(25),
		version: 1,
		roles: [roles[0]!],
	},
	{
		id: "user-olivia",
		username: "olivia.chen",
		email: "olivia.chen@example.com",
		displayName: "Olivia Chen",
		status: "active",
		createdAt: iso(50_000),
		updatedAt: iso(55),
		version: 3,
		roles: [roles[1]!],
	},
	{
		id: "user-noah",
		username: "noah.wang",
		email: "noah.wang@example.com",
		displayName: "Noah Wang",
		status: "active",
		createdAt: iso(42_000),
		updatedAt: iso(180),
		version: 2,
		roles: [roles[1]!],
	},
	{
		id: "user-emma",
		username: "emma.liu",
		email: "emma.liu@example.com",
		displayName: "Emma Liu",
		status: "disabled",
		createdAt: iso(35_000),
		updatedAt: iso(1_440),
		version: 4,
		roles: [roles[2]!],
	},
	{
		id: "user-liam",
		username: "liam.zhang",
		email: "liam.zhang@example.com",
		displayName: "Liam Zhang",
		status: "locked",
		createdAt: iso(28_000),
		updatedAt: iso(2_880),
		version: 2,
		roles: [roles[2]!],
	},
	{
		id: "user-sophia",
		username: "sophia.sun",
		email: "sophia.sun@example.com",
		displayName: "Sophia Sun",
		status: "active",
		createdAt: iso(12_000),
		updatedAt: iso(360),
		version: 1,
		roles: [roles[1]!],
	},
	...generatedUserSeeds.map(
		([username, displayName], index): PlatformUserDetail => ({
			id: `user-demo-${index + 1}`,
			username,
			email: `${username}@example.com`,
			displayName,
			status:
				index % 10 === 4 ? "locked" : index % 6 === 2 ? "disabled" : "active",
			createdAt: iso(10_000 - index * 240),
			updatedAt: iso(420 + index * 17),
			version: 1 + (index % 4),
			roles: [roles[index % roles.length]!],
		}),
	),
];

export const userAvatarDataUrls: Record<string, string> = {};

export const session: PlatformSession = {
	permissions: [...allPermissions],
	user: {
		id: users[0]!.id,
		username: users[0]!.username,
		email: users[0]!.email,
	},
};

const macUserAgent =
	"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/140 Safari/537.36";
const windowsUserAgent =
	"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140 Safari/537.36";
const auditOperationSeeds = [
	{
		action: "user.update",
		module: "users",
		requestMethod: "PATCH",
		requestPath: "/platform/users/:id",
	},
	{
		action: "role.permission.update",
		module: "roles",
		requestMethod: "PUT",
		requestPath: "/platform/roles/:id/permissions",
	},
	{
		action: "user.create",
		module: "users",
		requestMethod: "POST",
		requestPath: "/platform/users",
	},
	{
		action: "settings.update",
		module: "settings",
		requestMethod: "PATCH",
		requestPath: "/platform/settings",
	},
] as const;

export const auditLogs: PlatformAuditLog[] = Array.from(
	{ length: 32 },
	(_, index): PlatformAuditLog => {
		const operation = auditOperationSeeds[index % auditOperationSeeds.length]!;
		const result = index % 9 === 0 ? "failure" : "success";

		return {
			id: `audit-${index + 1}`,
			actorId: index % 4 === 0 ? users[1]!.id : users[0]!.id,
			actorUsername: index % 4 === 0 ? users[1]!.username : users[0]!.username,
			action: operation.action,
			module: operation.module,
			targetId:
				index % 2 === 0
					? users[(index + 1) % users.length]!.id
					: roles[index % roles.length]!.id,
			targetType: index % 2 === 0 ? "platform_user" : "platform_role",
			requestId: `req-audit-${String(index + 1).padStart(4, "0")}`,
			requestIp: `10.12.4.${20 + (index % 12)}`,
			requestMethod: operation.requestMethod,
			requestPath: operation.requestPath,
			result,
			...(result === "failure" ? { failureReason: "permission_denied" } : {}),
			...(index % 3 === 0
				? { before: { status: "disabled" }, after: { status: "active" } }
				: {}),
			userAgent: index % 3 === 0 ? macUserAgent : windowsUserAgent,
			durationMs: 36 + ((index * 17) % 240),
			createdAt: iso(index * 53),
		};
	},
);

export const loginLogs: PlatformLoginLog[] = Array.from(
	{ length: 46 },
	(_, index): PlatformLoginLog => {
		const user = users[index % users.length]!;
		const result =
			index % 11 === 0 ? "limited" : index % 5 === 0 ? "invalid" : "success";
		const authMethod = ["password", "sso", "passkey"] as const;

		return {
			id: `login-${index + 1}`,
			...(result === "success" ? { userId: user.id } : {}),
			identifier: user.username,
			authMethod: authMethod[index % authMethod.length]!,
			mfaUsed: result === "success" && index % 3 !== 0,
			requestId: `req-login-${String(index + 1).padStart(4, "0")}`,
			requestIp: `172.16.10.${10 + (index % 20)}`,
			result,
			...(result === "success"
				? { sessionId: `session-${String(index + 1).padStart(4, "0")}` }
				: {
						failureReason:
							result === "limited" ? "rate_limited" : "invalid_credentials",
					}),
			location: ["Shanghai, CN", "Hangzhou, CN", "Singapore, SG"][index % 3]!,
			userAgent: index % 3 === 0 ? macUserAgent : windowsUserAgent,
			acceptLanguage: index % 2 === 0 ? "zh-CN" : "en-US",
			timeZone: index % 3 === 2 ? "Asia/Singapore" : "Asia/Shanghai",
			durationMs: 48 + ((index * 23) % 620),
			createdAt: iso(index * 37),
		};
	},
);

export let siteTitle = "React Antd Admin";

export function setSiteTitle(value: string) {
	siteTitle = value;
}
