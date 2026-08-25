import type { PlatformSession } from "../src/api/auth";
import type { PlatformAnnouncement } from "../src/api/announcements";
import type { PlatformAuditLog, PlatformLoginLog } from "../src/api/operations";
import type { PlatformRole } from "../src/api/roles";
import type { PlatformUserDetail } from "../src/api/users";

const now = Date.now();
const iso = (offsetMinutes = 0) =>
	new Date(now - offsetMinutes * 60_000).toISOString();

export const allPermissions = [
	"platform.announcements.manage",
	"platform.announcements.read",
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

const generatedRoleSeeds = [
	["finance-reviewer", "财务审核员"],
	["customer-service", "客服专员"],
	["content-editor", "内容编辑"],
	["data-analyst", "数据分析师"],
	["quality-auditor", "质量审计员"],
	["project-owner", "项目负责人"],
	["product-operator", "产品运营"],
	["marketing-lead", "市场负责人"],
	["sales-lead", "销售负责人"],
	["hr-specialist", "人事专员"],
	["recruiter", "招聘专员"],
	["procurement-specialist", "采购专员"],
	["warehouse-specialist", "仓储专员"],
	["compliance-reviewer", "合规审核员"],
	["risk-controller", "风险控制员"],
	["billing-specialist", "账单专员"],
	["report-viewer", "报表查看员"],
	["notification-operator", "通知运营"],
	["tenant-operator", "租户运营"],
	["helpdesk-specialist", "帮助台专员"],
	["asset-reviewer", "资产审核员"],
	["ticket-specialist", "工单专员"],
	["content-reviewer", "内容审核员"],
] as const;

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
			"platform.announcements.manage",
			"platform.announcements.read",
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
		permissions: [
			"platform.announcements.read",
			"platform.logs.read",
			"platform.users.read",
		],
		version: 1,
	},
	...generatedRoleSeeds.map(([roleKey, displayName], index) => ({
		displayName,
		id: `role-${roleKey}`,
		memberCount: index % 8,
		permissions: [allPermissions[5]],
		roleKey,
		version: 1,
	})),
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

const announcementTitles = [
	"系统维护通知",
	"管理控制台版本更新",
	"账号安全提醒",
	"服务时间调整公告",
	"内部流程更新",
	"数据导出功能升级",
] as const;

export const announcements: PlatformAnnouncement[] = Array.from(
	{ length: 26 },
	(_, index): PlatformAnnouncement => ({
		content: `这是第 ${index + 1} 条公告内容，用于演示查询、分页和状态管理。`,
		createdAt: iso(20_000 - index * 180),
		id: `announcement-${index + 1}`,
		status: index % 4 === 0 ? "draft" : "published",
		title: `${announcementTitles[index % announcementTitles.length]} ${index + 1}`,
		updatedAt: iso(2_000 - index * 37),
	}),
);

export const session: PlatformSession = {
	permissions: [...allPermissions],
	user: {
		id: users[0]!.id,
		username: users[0]!.username,
		email: users[0]!.email,
	},
};

export const auditLogs: PlatformAuditLog[] = Array.from(
	{ length: 32 },
	(_, index): PlatformAuditLog => ({
		id: `audit-${index + 1}`,
		actorId: index % 4 === 0 ? users[1]!.id : users[0]!.id,
		actorUsername: index % 4 === 0 ? users[1]!.username : users[0]!.username,
		action: [
			"user.update",
			"role.permission.update",
			"user.create",
			"settings.update",
		][index % 4]!,
		targetId:
			index % 2 === 0
				? users[(index + 1) % users.length]!.id
				: roles[index % roles.length]!.id,
		targetType: index % 2 === 0 ? "platform_user" : "platform_role",
		requestIp: `10.12.4.${20 + (index % 12)}`,
		result: index % 9 === 0 ? "failure" : "success",
		...(index % 3 === 0
			? { before: { status: "disabled" }, after: { status: "active" } }
			: {}),
		createdAt: iso(index * 53),
	}),
);

export const loginLogs: PlatformLoginLog[] = Array.from(
	{ length: 46 },
	(_, index) => ({
		id: `login-${index + 1}`,
		identifier: users[index % users.length]!.username,
		requestIp: `172.16.10.${10 + (index % 20)}`,
		result:
			index % 11 === 0 ? "limited" : index % 5 === 0 ? "invalid" : "success",
		userAgent:
			index % 3 === 0
				? "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/140 Safari/537.36"
				: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140 Safari/537.36",
		acceptLanguage: index % 2 === 0 ? "zh-CN" : "en-US",
		timeZone: "Asia/Shanghai",
		createdAt: iso(index * 37),
	}),
);

export let siteTitle = "React Antd Admin";

export function setSiteTitle(value: string) {
	siteTitle = value;
}
