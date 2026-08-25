import type { PlatformSession } from "../src/api/auth";
import type { PlatformAnnouncement } from "../src/api/announcements";
import type { PlatformFile } from "../src/api/files";
import type { PlatformNotification } from "../src/api/notifications";
import type {
	ExampleListItem,
	ExampleRecordDetail,
} from "../src/api/page-examples";
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
		authSource: "local",
		department: "platform",
		id: "user-admin",
		username: "admin",
		email: "admin@example.com",
		displayName: "Platform Admin",
		jobTitle: "平台管理员",
		lastLoginAt: iso(8),
		lastLoginIp: "192.168.1.10",
		mfaEnabled: true,
		phone: "13800138000",
		status: "active",
		createdAt: iso(70_000),
		updatedAt: iso(25),
		version: 1,
		roles: [roles[0]!],
	},
	{
		authSource: "sso",
		department: "operations",
		id: "user-olivia",
		username: "olivia.chen",
		email: "olivia.chen@example.com",
		displayName: "Olivia Chen",
		jobTitle: "运营经理",
		lastLoginAt: iso(35),
		lastLoginIp: "10.10.20.15",
		mfaEnabled: true,
		phone: "13800138001",
		status: "active",
		createdAt: iso(50_000),
		updatedAt: iso(55),
		version: 3,
		roles: [roles[1]!],
	},
	{
		authSource: "sso",
		department: "finance",
		id: "user-noah",
		username: "noah.wang",
		email: "noah.wang@example.com",
		displayName: "Noah Wang",
		jobTitle: "财务专员",
		lastLoginAt: iso(120),
		lastLoginIp: "10.10.30.22",
		mfaEnabled: false,
		phone: "13800138002",
		status: "active",
		createdAt: iso(42_000),
		updatedAt: iso(180),
		version: 2,
		roles: [roles[1]!],
	},
	{
		authSource: "ldap",
		department: "hr",
		id: "user-emma",
		username: "emma.liu",
		email: "emma.liu@example.com",
		displayName: "Emma Liu",
		jobTitle: "人事专员",
		lastLoginAt: iso(2_880),
		lastLoginIp: "10.10.40.18",
		mfaEnabled: false,
		phone: "13800138003",
		status: "disabled",
		createdAt: iso(35_000),
		updatedAt: iso(1_440),
		version: 4,
		roles: [roles[2]!],
	},
	{
		authSource: "local",
		department: "risk",
		id: "user-liam",
		username: "liam.zhang",
		email: "liam.zhang@example.com",
		displayName: "Liam Zhang",
		jobTitle: "风控审核员",
		lastLoginAt: iso(4_320),
		lastLoginIp: "10.10.50.9",
		mfaEnabled: true,
		phone: "13800138004",
		status: "locked",
		createdAt: iso(28_000),
		updatedAt: iso(2_880),
		version: 2,
		roles: [roles[2]!],
	},
	{
		authSource: "sso",
		department: "platform",
		id: "user-sophia",
		username: "sophia.sun",
		email: "sophia.sun@example.com",
		displayName: "Sophia Sun",
		jobTitle: "前端工程师",
		lastLoginAt: iso(75),
		lastLoginIp: "10.10.10.28",
		mfaEnabled: true,
		phone: "13800138005",
		status: "active",
		createdAt: iso(12_000),
		updatedAt: iso(360),
		version: 1,
		roles: [roles[1]!],
	},
	...generatedUserSeeds.map(
		([username, displayName], index): PlatformUserDetail => ({
			authSource: index % 7 === 3 ? "ldap" : index % 3 === 1 ? "sso" : "local",
			department: ["platform", "operations", "finance", "hr", "risk"][
				index % 5
			] as PlatformUserDetail["department"],
			id: `user-demo-${index + 1}`,
			username,
			email: `${username}@example.com`,
			displayName,
			jobTitle: ["工程师", "运营专员", "财务专员", "人事专员", "风控专员"][
				index % 5
			]!,
			lastLoginAt: iso(90 + index * 43),
			lastLoginIp: `10.20.${Math.floor(index / 10) + 1}.${index + 20}`,
			mfaEnabled: index % 3 !== 1,
			phone: `1390000${String(1000 + index)}`,
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

const notificationTitles = [
	"账号安全检查完成",
	"待办事项即将到期",
	"平台功能更新",
	"同事提到了你",
] as const;

export const notifications: PlatformNotification[] = Array.from(
	{ length: 18 },
	(_, index): PlatformNotification => ({
		content: `这是第 ${index + 1} 条站内通知，用于演示未读筛选和会话内已读状态。`,
		createdAt: iso(index * 47),
		id: `notification-${index + 1}`,
		kind: (["system", "task", "user"] as const)[index % 3]!,
		readAt: index % 4 === 0 ? iso(index * 42) : null,
		title: `${notificationTitles[index % notificationTitles.length]} ${index + 1}`,
	}),
);

const exampleTitles = [
	"客户成功计划",
	"季度运营复盘",
	"产品体验优化",
	"数据质量治理",
	"内部知识库整理",
] as const;

export const exampleItems: ExampleListItem[] = Array.from(
	{ length: 24 },
	(_, index): ExampleListItem => ({
		createdAt: iso(18_000 - index * 240),
		description: `用于演示标准列表、搜索列表和卡片列表的通用内容 ${index + 1}。`,
		id: `example-${index + 1}`,
		owner: users[index % 6]!.displayName,
		status: (["active", "pending", "archived"] as const)[index % 3]!,
		title: `${exampleTitles[index % exampleTitles.length]} ${index + 1}`,
	}),
);

export const exampleRecord: ExampleRecordDetail = {
	...exampleItems[0]!,
	activity: [
		{ at: iso(20), content: "更新了项目进度", id: "activity-1" },
		{ at: iso(180), content: "补充了验收说明", id: "activity-2" },
		{ at: iso(1_440), content: "创建了记录", id: "activity-3" },
	],
	id: "record-001",
	participants: ["Platform Admin", "Olivia Chen", "Noah Wang"],
	progress: 72,
	updatedAt: iso(20),
};

const fileNames = [
	"运营周报.pdf",
	"客户清单.xlsx",
	"产品截图.png",
	"上线检查表.docx",
	"数据字典.csv",
] as const;

export const platformFiles: PlatformFile[] = Array.from(
	{ length: 23 },
	(_, index): PlatformFile => ({
		createdAt: iso(index * 95),
		id: `file-${index + 1}`,
		name: `${index + 1}-${fileNames[index % fileNames.length]}`,
		size: 12_000 + index * 8_192,
		type: [
			"application/pdf",
			"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
			"image/png",
			"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
			"text/csv",
		][index % 5]!,
		uploader: users[index % 6]!.displayName,
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
