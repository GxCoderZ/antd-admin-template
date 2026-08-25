interface DashboardLoginTrendPoint {
	date: string;
	failure: number;
	success: number;
}

export interface DashboardTodo {
	dueAt: string;
	id: string;
	priority: "high" | "low" | "medium";
	status: "completed" | "pending";
	title: string;
}

export interface DashboardRecentActivity {
	action: string;
	actor: string;
	createdAt: string;
	id: string;
	result: "failure" | "success";
	target: string;
}

export interface DashboardStatistics {
	auditOperationCount: number;
	loginFailureCount: number;
	loginSuccessCount: number;
	loginTrend: DashboardLoginTrendPoint[];
	periodDays: number;
	recentActivities: DashboardRecentActivity[];
	roleCount: number;
	todos: DashboardTodo[];
	userCount: number;
}
