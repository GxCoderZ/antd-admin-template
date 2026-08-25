import { Button, Flex, theme } from "antd";

interface QueryFilterSubmitterProps {
	loading: boolean;
	onReset: () => void;
	queryText: string;
	resetText: string;
}

export function QueryFilterSubmitter({
	loading,
	onReset,
	queryText,
	resetText,
}: QueryFilterSubmitterProps) {
	const { token } = theme.useToken();

	return (
		<Flex
			align="center"
			gap={token.marginXS}
			justify="flex-end"
			style={{ width: "100%" }}
		>
			<Button htmlType="button" onClick={onReset}>
				{resetText}
			</Button>
			<Button htmlType="submit" loading={loading} type="primary">
				{queryText}
			</Button>
		</Flex>
	);
}
