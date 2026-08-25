import type { CardProps } from "antd";

import { Card } from "antd";

export type BasicCardProps = CardProps;

export function BasicCard(props: BasicCardProps) {
	return <Card {...props} />;
}
