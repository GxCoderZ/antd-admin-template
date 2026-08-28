import { Descriptions, Flex, theme } from "antd";
import type { DescriptionsProps } from "antd";

export interface RecordDetailSection {
	key: string;
	title?: DescriptionsProps["title"];
	items: NonNullable<DescriptionsProps["items"]>;
}

export function RecordDetails({
	sections,
}: {
	sections: readonly RecordDetailSection[];
}) {
	const { token } = theme.useToken();

	return (
		<Flex vertical gap={token.margin} data-testid="record-details">
			{sections.map(({ key, ...section }) => (
				<Descriptions
					key={key}
					{...section}
					bordered
					column={1}
					size="small"
					styles={{
						header: { marginBottom: token.marginSM },
						label: {
							width: "8em",
							minWidth: "8em",
							verticalAlign: "top",
							overflowWrap: "anywhere",
						},
						content: { overflowWrap: "anywhere", verticalAlign: "top" },
					}}
				/>
			))}
		</Flex>
	);
}
