export interface DashboardMetricType {
	key: string
	title: string
	value: number
	suffix?: string
	trend: number
	trendLabel: string
}

export interface DashboardActivityType {
	id: number
	actor: string
	action: string
	target: string
	created_at: string
}

export interface DashboardSummaryType {
	metrics: DashboardMetricType[]
	activities: DashboardActivityType[]
	updated_at: string
}
