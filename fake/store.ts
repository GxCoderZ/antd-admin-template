import type { PlatformSession } from "../src/api/auth";
import type { PlatformAnnouncement } from "../src/api/announcements";
import type { PlatformDepartment } from "../src/api/departments";
import type {
	PlatformDictionaryItem,
	PlatformDictionaryType,
} from "../src/api/dictionaries";
import type { PlatformNotification } from "../src/api/notifications";
import type { PlatformAuditLog, PlatformLoginLog } from "../src/api/operations";
import type { PlatformPosition } from "../src/api/positions";
import type { PlatformRole } from "../src/api/roles";
import type { PlatformUserDetail } from "../src/api/users";

const now = Date.now();
const iso = (offsetMinutes = 0) =>
	new Date(now - offsetMinutes * 60_000).toISOString();

export const allPermissions = [
	"platform.announcements.manage",
	"platform.announcements.read",
	"platform.departments.manage",
	"platform.dictionaries.manage",
	"platform.logs.read",
	"platform.positions.manage",
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
		builtIn: true,
		createdAt: iso(180_000),
		id: "role-admin",
		roleKey: "platform_admin",
		displayName: "平台管理员",
		memberCount: 10,
		permissions: [...allPermissions],
		updatedAt: iso(20),
		version: 1,
	},
	{
		builtIn: false,
		createdAt: iso(170_000),
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
		updatedAt: iso(90),
		version: 1,
	},
	{
		builtIn: false,
		createdAt: iso(160_000),
		id: "role-auditor",
		roleKey: "auditor",
		displayName: "只读审计员",
		memberCount: 9,
		permissions: [
			"platform.announcements.read",
			"platform.logs.read",
			"platform.users.read",
		],
		updatedAt: iso(240),
		version: 1,
	},
	...generatedRoleSeeds.map(([roleKey, displayName], index) => ({
		builtIn: false,
		createdAt: iso(150_000 - index * 720),
		displayName,
		id: `role-${roleKey}`,
		memberCount: index % 8,
		permissions: ["platform.users.read" as const],
		roleKey,
		updatedAt: iso(300 + index * 17),
		version: 1,
	})),
];

export const departments: Omit<
	PlatformDepartment,
	"children" | "memberCount" | "positionCount"
>[] = [
	{
		code: "headquarters",
		createdAt: iso(80_000),
		id: "dept-headquarters",
		name: "总部职能",
		parentId: null,
		status: "active",
		updatedAt: iso(620),
	},
	{
		code: "platform",
		createdAt: iso(78_000),
		id: "dept-platform",
		name: "平台研发部",
		parentId: null,
		status: "active",
		updatedAt: iso(500),
	},
	{
		code: "frontend",
		createdAt: iso(66_000),
		id: "dept-frontend",
		name: "前端工程组",
		parentId: "dept-platform",
		status: "active",
		updatedAt: iso(400),
	},
	{
		code: "backend",
		createdAt: iso(65_000),
		id: "dept-backend",
		name: "后端工程组",
		parentId: "dept-platform",
		status: "active",
		updatedAt: iso(390),
	},
	{
		code: "operations",
		createdAt: iso(74_000),
		id: "dept-operations",
		name: "运营中心",
		parentId: null,
		status: "active",
		updatedAt: iso(470),
	},
	{
		code: "content",
		createdAt: iso(54_000),
		id: "dept-content",
		name: "内容运营组",
		parentId: "dept-operations",
		status: "active",
		updatedAt: iso(380),
	},
	{
		code: "customer_success",
		createdAt: iso(53_000),
		id: "dept-customer-success",
		name: "客户成功组",
		parentId: "dept-operations",
		status: "active",
		updatedAt: iso(360),
	},
	{
		code: "finance",
		createdAt: iso(70_000),
		id: "dept-finance",
		name: "财务管理部",
		parentId: "dept-headquarters",
		status: "active",
		updatedAt: iso(430),
	},
	{
		code: "hr",
		createdAt: iso(68_000),
		id: "dept-hr",
		name: "人力资源部",
		parentId: "dept-headquarters",
		status: "active",
		updatedAt: iso(420),
	},
	{
		code: "risk",
		createdAt: iso(64_000),
		id: "dept-risk",
		name: "风险合规部",
		parentId: "dept-headquarters",
		status: "disabled",
		updatedAt: iso(410),
	},
];

const positionSeeds = [
	[
		"position-platform-admin",
		"平台管理员",
		"platform_admin",
		"dept-platform",
		2,
	],
	[
		"position-frontend-engineer",
		"前端工程师",
		"frontend_engineer",
		"dept-frontend",
		5,
	],
	["position-ui-engineer", "界面工程师", "ui_engineer", "dept-frontend", 2],
	[
		"position-backend-engineer",
		"后端工程师",
		"backend_engineer",
		"dept-backend",
		5,
	],
	["position-api-engineer", "接口工程师", "api_engineer", "dept-backend", 2],
	[
		"position-operations-manager",
		"运营经理",
		"operations_manager",
		"dept-operations",
		2,
	],
	[
		"position-operations-specialist",
		"运营专员",
		"operations_specialist",
		"dept-operations",
		4,
	],
	["position-content-editor", "内容编辑", "content_editor", "dept-content", 3],
	[
		"position-content-specialist",
		"内容专员",
		"content_specialist",
		"dept-content",
		2,
	],
	[
		"position-customer-success",
		"客户成功专员",
		"customer_success",
		"dept-customer-success",
		4,
	],
	[
		"position-service-specialist",
		"客服专员",
		"service_specialist",
		"dept-customer-success",
		3,
	],
	[
		"position-finance-manager",
		"财务经理",
		"finance_manager",
		"dept-finance",
		1,
	],
	[
		"position-finance-specialist",
		"财务专员",
		"finance_specialist",
		"dept-finance",
		4,
	],
	[
		"position-billing-specialist",
		"账单专员",
		"billing_specialist",
		"dept-finance",
		2,
	],
	["position-hr-manager", "人事经理", "hr_manager", "dept-hr", 1],
	["position-hr-specialist", "人事专员", "hr_specialist", "dept-hr", 4],
	["position-recruiter", "招聘专员", "recruiter", "dept-hr", 2],
	["position-risk-manager", "风控经理", "risk_manager", "dept-risk", 1],
	["position-risk-specialist", "风控专员", "risk_specialist", "dept-risk", 3],
	[
		"position-compliance-reviewer",
		"合规审核员",
		"compliance_reviewer",
		"dept-risk",
		2,
	],
	["position-data-analyst", "数据分析师", "data_analyst", "dept-operations", 2],
	[
		"position-quality-auditor",
		"质量审计员",
		"quality_auditor",
		"dept-operations",
		1,
	],
	[
		"position-product-operator",
		"产品运营",
		"product_operator",
		"dept-operations",
		2,
	],
	["position-project-owner", "项目负责人", "project_owner", "dept-platform", 2],
] as const;

export const positions: PlatformPosition[] = positionSeeds.map(
	([id, name, code, departmentId, memberCount], index) => ({
		code,
		createdAt: iso(58_000 - index * 260),
		departmentId,
		departmentName:
			departments.find((department) => department.id === departmentId)?.name ??
			"",
		id,
		memberCount,
		name,
		status: index % 9 === 0 ? "disabled" : "active",
		updatedAt: iso(760 + index * 31),
	}),
);

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

export const users: Omit<PlatformUserDetail, "departmentName">[] = [
	{
		authSource: "local",
		departmentId: "dept-platform",
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
		departmentId: "dept-operations",
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
		departmentId: "dept-finance",
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
		departmentId: "dept-hr",
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
		departmentId: "dept-risk",
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
		departmentId: "dept-platform",
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
		(
			[username, displayName],
			index,
		): Omit<PlatformUserDetail, "departmentName"> => ({
			authSource: index % 7 === 3 ? "ldap" : index % 3 === 1 ? "sso" : "local",
			departmentId: [
				"dept-platform",
				"dept-operations",
				"dept-finance",
				"dept-hr",
				"dept-risk",
			][index % 5] as string,
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

const dictionaryTypeSeeds = [
	["dict-user-status", "user_status", "用户状态", "用户账号状态"],
	["dict-order-status", "order_status", "订单状态", "订单处理状态"],
	["dict-ticket-priority", "ticket_priority", "工单优先级", "服务工单优先级"],
	["dict-invoice-type", "invoice_type", "发票类型", "财务发票类型"],
	["dict-payment-method", "payment_method", "支付方式", "订单支付方式"],
	["dict-shipping-channel", "shipping_channel", "物流渠道", "物流渠道标签"],
	["dict-device-type", "device_type", "设备类型", "登录设备类型"],
	["dict-content-status", "content_status", "内容状态", "内容审核状态"],
	["dict-risk-level", "risk_level", "风险等级", "风险评估等级"],
	["dict-member-level", "member_level", "会员等级", "客户会员等级"],
	["dict-region", "business_region", "业务区域", "业务区域分组"],
	["dict-notice-kind", "notice_kind", "通知类型", "站内通知类型"],
	["dict-approval-result", "approval_result", "审批结果", "审批流结果"],
	["dict-asset-status", "asset_status", "资产状态", "内部资产状态"],
	["dict-refund-reason", "refund_reason", "退款原因", "售后退款原因"],
	["dict-contract-type", "contract_type", "合同类型", "合同分类"],
	["dict-data-source", "data_source", "数据来源", "数据接入来源"],
	["dict-export-status", "export_status", "导出状态", "导出任务状态"],
] as const;

const dictionaryItemTemplates = [
	[
		["active", "启用", "green"],
		["disabled", "停用", "red"],
		["locked", "锁定", "orange"],
	],
	[
		["pending", "待处理", "blue"],
		["paid", "已支付", "green"],
		["closed", "已关闭", "default"],
	],
	[
		["low", "低", "cyan"],
		["medium", "中", "orange"],
		["high", "高", "red"],
	],
] as const;

export const dictionaryItems: PlatformDictionaryItem[] =
	dictionaryTypeSeeds.flatMap(([typeId], typeIndex) => {
		const templates =
			dictionaryItemTemplates[typeIndex % dictionaryItemTemplates.length]!;
		return templates.map(
			([value, label, color], itemIndex): PlatformDictionaryItem => ({
				color,
				createdAt: iso(16_000 - typeIndex * 120 - itemIndex * 8),
				description: `${label} 字典项用于演示颜色标签和排序值。`,
				id: `${typeId}-item-${value}`,
				label,
				sort: (itemIndex + 1) * 10,
				status: itemIndex === 2 && typeIndex % 4 === 0 ? "disabled" : "active",
				typeId,
				updatedAt: iso(1_600 - typeIndex * 22 - itemIndex * 5),
				value,
			}),
		);
	});

export const dictionaryTypes: PlatformDictionaryType[] =
	dictionaryTypeSeeds.map(
		([id, code, name, description], index): PlatformDictionaryType => ({
			code,
			createdAt: iso(18_000 - index * 200),
			description,
			id,
			itemCount: dictionaryItems.filter((item) => item.typeId === id).length,
			name,
			status: index % 6 === 5 ? "disabled" : "active",
			updatedAt: iso(1_800 - index * 29),
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
			// Spread the existing samples across a week for login trend and filter demos.
			createdAt: iso(index * index * 4),
		};
	},
);
