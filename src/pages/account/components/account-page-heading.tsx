import { theme, Typography } from "antd";

interface AccountPageHeadingProps {
	description: string
	title: string
}

export function AccountPageHeading({ description, title }: AccountPageHeadingProps) {
	const { token } = theme.useToken();
	return (
		<section aria-labelledby="account-page-title">
			<Typography.Title id="account-page-title" level={3} style={{ marginBottom: token.marginXXS }}>{title}</Typography.Title>
			<Typography.Paragraph style={{ marginBottom: 0 }} type="secondary">{description}</Typography.Paragraph>
		</section>
	);
}
