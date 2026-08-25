import { Button, Flex, Result, Space, theme, Typography } from "antd";

const { Title } = Typography;

export interface ExceptionPageProps {
	backHomeLabel: string;
	description: string;
	onBackHome: () => void;
	onReload?: () => void;
	reloadLabel?: string;
	status: "403" | "404" | "500";
}

export function ExceptionPage({
	backHomeLabel,
	description,
	onBackHome,
	onReload,
	reloadLabel,
	status,
}: ExceptionPageProps) {
	const { token } = theme.useToken();

	return (
		<Flex
			align="center"
			justify="center"
			style={{ minHeight: 480, padding: token.paddingLG, width: "100%" }}
		>
			<Result
				extra={
					<Space wrap>
						{onReload && reloadLabel ? (
							<Button onClick={onReload} type="primary">
								{reloadLabel}
							</Button>
						) : null}
						<Button
							onClick={onBackHome}
							type={onReload ? "default" : "primary"}
						>
							{backHomeLabel}
						</Button>
					</Space>
				}
				status={status}
				subTitle={description}
				title={
					<Title level={1} style={{ fontSize: 72, lineHeight: 1, margin: 0 }}>
						{status}
					</Title>
				}
			/>
		</Flex>
	);
}
