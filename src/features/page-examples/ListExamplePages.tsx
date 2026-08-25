import {
	LikeOutlined,
	MessageOutlined,
	PlusOutlined,
	StarOutlined,
} from "@ant-design/icons";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
	Alert,
	Avatar,
	Button,
	Card,
	Col,
	Empty,
	Flex,
	Input,
	List,
	Pagination,
	Progress,
	Row,
	Segmented,
	Select,
	Skeleton,
	Space,
	Statistic,
	Tabs,
	Tag,
	theme,
	Typography,
} from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import {
	exampleItemsQueryKey,
	listExampleItems,
	type ExampleItemStatus,
	type ExampleListItem,
} from "#src/api/page-examples";

const { Paragraph, Text, Title } = Typography;

function statusTag(
	item: ExampleListItem,
	t: ReturnType<typeof useTranslation>["t"],
) {
	const colors: Record<ExampleItemStatus, string> = {
		active: "success",
		archived: "default",
		pending: "processing",
	};
	return (
		<Tag color={colors[item.status]}>
			{t(`adminShell.pageExamples.statuses.${item.status}`)}
		</Tag>
	);
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
	const { t } = useTranslation();
	return (
		<Alert
			action={
				<Button onClick={onRetry}>{t("adminShell.pageExamples.retry")}</Button>
			}
			description={t("adminShell.pageExamples.errorFallback")}
			title={t("adminShell.pageExamples.loadError")}
			showIcon
			type="error"
		/>
	);
}

export function BasicListPage() {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const [page, setPage] = useState(1);
	const [q, setQ] = useState("");
	const [status, setStatus] = useState<"all" | ExampleItemStatus>("all");
	const query = useQuery({
		placeholderData: keepPreviousData,
		queryFn: ({ signal }) =>
			listExampleItems(
				{
					page,
					pageSize: 5,
					...(q ? { q } : {}),
					...(status === "all" ? {} : { status }),
				},
				signal,
			),
		queryKey: [...exampleItemsQueryKey, "basic", { page, q, status }],
	});

	return (
		<Flex gap={token.marginLG} vertical>
			<Title level={2} style={{ margin: 0 }}>
				{t("adminShell.pageExamples.basicList.title")}
			</Title>
			<Card>
				<Row gutter={[0, token.marginLG]}>
					<Col md={8} xs={24}>
						<Statistic
							title={t("adminShell.pageExamples.basicList.todo")}
							value={8}
							suffix={t("adminShell.pageExamples.basicList.tasks")}
						/>
					</Col>
					<Col md={8} xs={24}>
						<Statistic
							title={t("adminShell.pageExamples.basicList.averageTime")}
							value={32}
							suffix={t("adminShell.pageExamples.basicList.minutes")}
						/>
					</Col>
					<Col md={8} xs={24}>
						<Statistic
							title={t("adminShell.pageExamples.basicList.completed")}
							value={24}
							suffix={t("adminShell.pageExamples.basicList.tasks")}
						/>
					</Col>
				</Row>
			</Card>
			<Card
				title={t("adminShell.pageExamples.basicList.listTitle")}
				extra={
					<Flex gap={token.marginSM} wrap>
						<Segmented
							onChange={(value) => {
								setStatus(value as typeof status);
								setPage(1);
							}}
							options={[
								{ label: t("adminShell.pageExamples.all"), value: "all" },
								{
									label: t("adminShell.pageExamples.statuses.active"),
									value: "active",
								},
								{
									label: t("adminShell.pageExamples.statuses.pending"),
									value: "pending",
								},
							]}
							value={status}
						/>
						<Input.Search
							allowClear
							onSearch={(value) => {
								setQ(value.trim());
								setPage(1);
							}}
							placeholder={t("adminShell.pageExamples.searchPlaceholder")}
						/>
					</Flex>
				}
			>
				{query.isPending ? (
					<Skeleton active paragraph={{ rows: 8 }} />
				) : query.isError ? (
					<ErrorState onRetry={() => void query.refetch()} />
				) : query.data.items.length === 0 ? (
					<Empty description={t("adminShell.pageExamples.empty")} />
				) : (
					<>
						<List
							dataSource={query.data.items}
							renderItem={(item, index) => (
								<List.Item
									actions={[
										<Button key="edit" type="link">
											{t("adminShell.pageExamples.edit")}
										</Button>,
										<Button key="more" type="link">
											{t("adminShell.pageExamples.more")}
										</Button>,
									]}
								>
									<List.Item.Meta
										avatar={
											<Avatar shape="square" size="large">
												{item.title.slice(0, 1)}
											</Avatar>
										}
										description={item.description}
										title={
											<Space wrap>
												<Text strong>{item.title}</Text>
												{statusTag(item, t)}
											</Space>
										}
									/>
									<Space size="large" wrap>
										<div>
											<Text type="secondary">
												{t("adminShell.pageExamples.owner")}
											</Text>
											<br />
											<Text>{item.owner}</Text>
										</div>
										<div>
											<Text type="secondary">
												{t("adminShell.pageExamples.startTime")}
											</Text>
											<br />
											<Text>
												{new Date(item.createdAt).toLocaleDateString()}
											</Text>
										</div>
										<Progress
											percent={index % 3 === 1 ? 100 : 54 + index * 7}
											size="small"
											style={{ width: token.controlHeight * 3 }}
										/>
									</Space>
								</List.Item>
							)}
						/>
						<Flex justify="end" style={{ marginTop: token.margin }}>
							<Pagination
								current={query.data.page}
								onChange={setPage}
								pageSize={query.data.pageSize}
								showSizeChanger={false}
								total={query.data.total}
							/>
						</Flex>
					</>
				)}
			</Card>
		</Flex>
	);
}

export function SearchListPage() {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const [q, setQ] = useState("");
	const [draft, setDraft] = useState("");
	const query = useQuery({
		queryFn: ({ signal }) =>
			listExampleItems({ page: 1, pageSize: 10, ...(q ? { q } : {}) }, signal),
		queryKey: [...exampleItemsQueryKey, "search", q],
	});
	return (
		<Flex gap={token.marginLG} vertical>
			<Title level={2} style={{ margin: 0 }}>
				{t("adminShell.pageExamples.searchList.title")}
			</Title>
			<Flex justify="center">
				<Input.Search
					enterButton={t("adminShell.pageExamples.search")}
					onChange={(event) => setDraft(event.target.value)}
					onSearch={() => setQ(draft.trim())}
					placeholder={t("adminShell.pageExamples.searchPlaceholder")}
					size="large"
					style={{ maxWidth: token.controlHeightLG * 12, width: "100%" }}
					value={draft}
				/>
			</Flex>
			<Tabs
				items={["articles", "projects", "applications"].map((key) => ({
					key,
					label: t(`adminShell.pageExamples.searchList.tabs.${key}`),
				}))}
			/>
			<Card>
				<Flex gap={token.margin} vertical>
					<Flex align="center" gap={token.marginSM} wrap>
						<Text>{t("adminShell.pageExamples.searchList.category")}</Text>
						{["all", "one", "two", "three", "four"].map((key) => (
							<Button key={key} type={key === "all" ? "link" : "text"}>
								{t(`adminShell.pageExamples.searchList.categories.${key}`)}
							</Button>
						))}
					</Flex>
					<Flex align="center" gap={token.marginSM} wrap>
						<Text>{t("adminShell.pageExamples.owner")}</Text>
						<Select
							allowClear
							mode="multiple"
							options={[
								{ label: "Platform Admin", value: "Platform Admin" },
								{ label: "Olivia Chen", value: "Olivia Chen" },
							]}
							style={{ minWidth: token.controlHeight * 6 }}
						/>
						<Button type="link">
							{t("adminShell.pageExamples.searchList.onlyMine")}
						</Button>
					</Flex>
				</Flex>
			</Card>
			<Card>
				{query.isPending ? (
					<Skeleton active paragraph={{ rows: 9 }} />
				) : query.isError ? (
					<ErrorState onRetry={() => void query.refetch()} />
				) : query.data.items.length === 0 ? (
					<Empty description={t("adminShell.pageExamples.empty")} />
				) : (
					<List
						dataSource={query.data.items}
						renderItem={(item, index) => (
							<List.Item>
								<List.Item.Meta
									description={
										<Space orientation="vertical" size={token.marginXS}>
											<Space wrap>
												<Tag>Ant Design</Tag>
												<Tag>
													{t(
														"adminShell.pageExamples.searchList.designLanguage",
													)}
												</Tag>
												<Tag>
													{t("adminShell.pageExamples.searchList.enterprise")}
												</Tag>
											</Space>
											<Paragraph
												ellipsis={{ rows: 2 }}
												style={{ marginBottom: 0 }}
											>
												{item.description} {item.description}
											</Paragraph>
											<Text type="secondary">
												{item.owner} ·{" "}
												{new Date(item.createdAt).toLocaleDateString()}
											</Text>
											<Space split={<span />}>
												<Text type="secondary">
													<StarOutlined /> {20 + index}
												</Text>
												<Text type="secondary">
													<LikeOutlined /> {50 + index}
												</Text>
												<Text type="secondary">
													<MessageOutlined /> {30 + index}
												</Text>
											</Space>
										</Space>
									}
									title={<Text strong>{item.title}</Text>}
								/>
							</List.Item>
						)}
					/>
				)}
			</Card>
		</Flex>
	);
}

export function CardListPage() {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const query = useQuery({
		queryFn: ({ signal }) => listExampleItems({ page: 1, pageSize: 8 }, signal),
		queryKey: [...exampleItemsQueryKey, "cards"],
	});
	return (
		<Flex gap={token.marginLG} vertical>
			<div>
				<Title level={2}>{t("adminShell.pageExamples.cardList.title")}</Title>
				<Paragraph>
					{t("adminShell.pageExamples.cardList.description")}
				</Paragraph>
				<Space size="large" wrap>
					<Button type="link">
						{t("adminShell.pageExamples.cardList.quickStart")}
					</Button>
					<Button type="link">
						{t("adminShell.pageExamples.cardList.introduction")}
					</Button>
					<Button type="link">
						{t("adminShell.pageExamples.cardList.documentation")}
					</Button>
				</Space>
			</div>
			{query.isPending ? (
				<Skeleton active paragraph={{ rows: 10 }} />
			) : query.isError ? (
				<ErrorState onRetry={() => void query.refetch()} />
			) : (
				<Row gutter={[token.marginLG, token.marginLG]}>
					<Col lg={6} md={8} sm={12} xs={24}>
						<Card
							hoverable
							style={{ height: "100%", minHeight: token.controlHeight * 6 }}
						>
							<Flex
								align="center"
								justify="center"
								style={{ height: token.controlHeight * 4 }}
							>
								<Button icon={<PlusOutlined />} type="text">
									{t("adminShell.pageExamples.cardList.add")}
								</Button>
							</Flex>
						</Card>
					</Col>
					{query.data.items.map((item) => (
						<Col key={item.id} lg={6} md={8} sm={12} xs={24}>
							<Card
								actions={[
									<span key="one">
										{t("adminShell.pageExamples.cardList.actionOne")}
									</span>,
									<span key="two">
										{t("adminShell.pageExamples.cardList.actionTwo")}
									</span>,
								]}
								hoverable
								style={{ height: "100%" }}
							>
								<Card.Meta
									avatar={
										<Avatar size="large">{item.title.slice(0, 1)}</Avatar>
									}
									description={
										<Paragraph
											ellipsis={{ rows: 3 }}
											style={{ marginBottom: 0 }}
										>
											{item.description}
										</Paragraph>
									}
									title={item.title}
								/>
							</Card>
						</Col>
					))}
				</Row>
			)}
		</Flex>
	);
}
