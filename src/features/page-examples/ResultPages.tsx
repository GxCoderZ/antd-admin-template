import {
	CheckCircleOutlined,
	CloseCircleOutlined,
	RightOutlined,
} from "@ant-design/icons";
import {
	Button,
	Card,
	Descriptions,
	Flex,
	Result,
	Steps,
	theme,
	Typography,
} from "antd";
import { useTranslation } from "react-i18next";

const { Text, Title } = Typography;

export function SuccessResultPage() {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	return (
		<Card>
			<Result
				icon={<CheckCircleOutlined style={{ color: token.colorSuccess }} />}
				status="success"
				title={t("adminShell.pageExamples.results.successTitle")}
				subTitle={t("adminShell.pageExamples.results.successDescription")}
				extra={[
					<Button key="back" type="primary">
						{t("adminShell.pageExamples.results.backList")}
					</Button>,
					<Button key="view">
						{t("adminShell.pageExamples.results.viewProject")}
					</Button>,
					<Button key="print">
						{t("adminShell.pageExamples.results.print")}
					</Button>,
				]}
			>
				<Flex gap={token.marginLG} vertical>
					<Title level={4}>
						{t("adminShell.pageExamples.results.projectName")}
					</Title>
					<Descriptions
						column={{ xs: 1, sm: 3 }}
						items={[
							{
								key: "id",
								label: t("adminShell.pageExamples.results.projectId"),
								children: "23421",
							},
							{
								key: "owner",
								label: t("adminShell.pageExamples.owner"),
								children: "Platform Admin",
							},
							{
								key: "date",
								label: t("adminShell.pageExamples.results.effectiveTime"),
								children: "2026-08-26 ~ 2027-08-26",
							},
						]}
					/>
					<Steps
						current={1}
						items={[
							{ title: t("adminShell.pageExamples.results.created") },
							{ title: t("adminShell.pageExamples.results.review") },
							{ title: t("adminShell.pageExamples.results.financeReview") },
							{ title: t("adminShell.pageExamples.results.completed") },
						]}
						responsive
					/>
				</Flex>
			</Result>
		</Card>
	);
}

export function FailureResultPage() {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	return (
		<Card>
			<Result
				icon={<CloseCircleOutlined style={{ color: token.colorError }} />}
				status="error"
				title={t("adminShell.pageExamples.results.failureTitle")}
				subTitle={t("adminShell.pageExamples.results.failureDescription")}
				extra={
					<Button type="primary">
						{t("adminShell.pageExamples.results.returnEdit")}
					</Button>
				}
			>
				<Flex gap={token.marginSM} vertical>
					<Text strong>
						{t("adminShell.pageExamples.results.errorHeading")}
					</Text>
					{["frozen", "ineligible"].map((key) => (
						<Flex align="center" gap={token.marginXS} key={key} wrap>
							<CloseCircleOutlined style={{ color: token.colorError }} />
							<Text style={{ flex: "1 1 10rem" }}>
								{t(`adminShell.pageExamples.results.errors.${key}`)}
							</Text>
							<Button
								icon={<RightOutlined />}
								iconPosition="end"
								size="small"
								type="link"
							>
								{t(`adminShell.pageExamples.results.actions.${key}`)}
							</Button>
						</Flex>
					))}
				</Flex>
			</Result>
		</Card>
	);
}
