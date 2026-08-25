import { Skeleton } from "antd";

const pageLoadingStyle = { height: "60vh", padding: "24px 40px" } as const;

export function FormSkeleton() {
	return <Skeleton active />;
}

export function RouteContentSkeleton() {
	return <Skeleton active style={pageLoadingStyle} />;
}

export function ApplicationSkeleton() {
	return <Skeleton active style={pageLoadingStyle} />;
}
