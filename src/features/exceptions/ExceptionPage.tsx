import { Button, Card, Result } from "antd";

export interface ExceptionPageProps {
	backHomeLabel: string;
	description: string;
	onBackHome: () => void;
	status: "403" | "404" | "500";
}

export function ExceptionPage({
	backHomeLabel,
	description,
	onBackHome,
	status,
}: ExceptionPageProps) {
	return (
		<Card variant="borderless">
			<Result
				extra={
					<Button onClick={onBackHome} type="primary">
						{backHomeLabel}
					</Button>
				}
				status={status}
				subTitle={description}
				title={status}
			/>
		</Card>
	);
}
