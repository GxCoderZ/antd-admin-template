import {
	DownloadOutlined,
	EditOutlined,
	EllipsisOutlined,
	LikeOutlined,
	LoadingOutlined,
	MessageOutlined,
	ShareAltOutlined,
	StarOutlined,
} from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import {
	Avatar,
	Button,
	Card,
	Col,
	Dropdown,
	Empty,
	Flex,
	Form,
	Grid,
	Input,
	List,
	Row,
	Select,
	Skeleton,
	Space,
	Tabs,
	Tag,
	theme,
	Tooltip,
	Typography,
} from "antd";
import type { ReactNode } from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import {
	exampleItemsQueryKey,
	listExampleItems,
	type ExampleListItem,
} from "#src/api/page-examples";

const { Paragraph, Text } = Typography;

type SearchPageKind = "applications" | "articles" | "projects";

interface SearchFilters {
	author: string | undefined;
	category: string[];
	owner: string[];
	rate: "good" | "normal" | undefined;
}

const searchPaths: Record<SearchPageKind, string> = {
	applications: "/examples/lists/search/applications",
	articles: "/examples/lists/search/articles",
	projects: "/examples/lists/search/projects",
};

const ownerOptions = [
	{ label: "Platform Admin", value: "Platform Admin" },
	{ label: "Olivia Chen", value: "Olivia Chen" },
	{ label: "Noah Wang", value: "Noah Wang" },
	{ label: "Emma Liu", value: "Emma Liu" },
];

function SearchPageFrame({
	activeKey,
	children,
	onSearch,
}: {
	activeKey: SearchPageKind;
	children: ReactNode;
	onSearch: (value: string) => void;
}) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const navigate = useNavigate();
	const [draft, setDraft] = useState("");

	return (
		<Flex gap={token.marginLG} vertical>
			<Card
				styles={{ body: { paddingBlockEnd: 0 } }}
				variant="borderless"
			>
				<Flex justify="center" style={{ paddingBlock: token.paddingSM }}>
					<Input.Search
						allowClear
						enterButton={t("adminShell.pageExamples.search")}
						onChange={(event) => setDraft(event.target.value)}
						onSearch={(value) => onSearch(value.trim())}
						placeholder={t("adminShell.pageExamples.searchPlaceholder")}
						size="large"
						style={{ maxWidth: 522, width: "100%" }}
						value={draft}
					/>
				</Flex>
				<Tabs
					activeKey={activeKey}
					items={(["articles", "projects", "applications"] as const).map(
						(key) => ({
							key,
							label: t(`adminShell.pageExamples.searchList.tabs.${key}`),
						}),
					)}
					onChange={(key) => void navigate(searchPaths[key as SearchPageKind])}
				/>
			</Card>
			{children}
		</Flex>
	);
}

function CategorySelector({
	onChange,
	value,
}: {
	onChange: (value: string[]) => void;
	value: string[];
}) {
	const { t } = useTranslation();
	const screens = Grid.useBreakpoint();
	const [expanded, setExpanded] = useState(false);
	const categories = Array.from({ length: 12 }, (_, index) => ({
		label: t("adminShell.pageExamples.searchList.categoryValue", {
			value: index + 1,
		}),
		value: `category-${index + 1}`,
	}));
	const visibleCategories =
		expanded || screens.lg ? categories : categories.slice(0, 6);

	return (
		<Flex align="center" gap="small" wrap>
			<Tag.CheckableTag checked={value.length === 0} onChange={() => onChange([])}>
				{t("adminShell.pageExamples.all")}
			</Tag.CheckableTag>
			{visibleCategories.map((category) => (
				<Tag.CheckableTag
					checked={value.includes(category.value)}
					key={category.value}
					onChange={(checked) =>
						onChange(
							checked
								? [...value, category.value]
								: value.filter((item) => item !== category.value),
						)
					}
				>
					{category.label}
				</Tag.CheckableTag>
			))}
			{screens.lg ? null : (
				<Button onClick={() => setExpanded((current) => !current)} size="small" type="link">
					{t(
						expanded
							? "adminShell.pageExamples.searchList.collapse"
							: "adminShell.pageExamples.searchList.expand",
					)}
				</Button>
			)}
		</Flex>
	);
}

function FilterRow({
	children,
	last = false,
	title,
}: {
	children: ReactNode;
	last?: boolean;
	title: string;
}) {
	const { token } = theme.useToken();
	return (
		<Flex
			align="flex-start"
			gap={token.marginLG}
			style={{
				borderBottom: last
					? undefined
					: `${token.lineWidth}px ${token.lineType} ${token.colorSplit}`,
				paddingBlock: token.paddingSM,
			}}
			wrap
		>
			<Text style={{ flex: "0 0 5rem", lineHeight: `${token.controlHeight}px` }}>
				{title}
			</Text>
			<div style={{ flex: "1 1 20rem", minWidth: 0 }}>{children}</div>
		</Flex>
	);
}

function SearchFilterCard({
	filters,
	onChange,
	showOwner = false,
}: {
	filters: SearchFilters;
	onChange: (filters: SearchFilters) => void;
	showOwner?: boolean;
}) {
	const { t } = useTranslation();

	return (
		<Card variant="borderless">
			<Form component={false}>
				<FilterRow title={t("adminShell.pageExamples.searchList.category")}>
					<CategorySelector
						onChange={(category) => onChange({ ...filters, category })}
						value={filters.category}
					/>
				</FilterRow>
				{showOwner ? (
					<FilterRow title={t("adminShell.pageExamples.owner")}>
						<Flex align="center" gap="small" wrap>
							<Select
								allowClear
								maxTagCount="responsive"
								mode="multiple"
								onChange={(owner) =>
									onChange({ ...filters, owner: owner ?? [] })
								}
								options={ownerOptions}
								placeholder={t("adminShell.pageExamples.searchList.selectOwner")}
								style={{ minWidth: 220 }}
								value={filters.owner}
							/>
							<Button
								onClick={() =>
									onChange({ ...filters, owner: ["Platform Admin"] })
								}
								type="link"
							>
								{t("adminShell.pageExamples.searchList.onlyMine")}
							</Button>
						</Flex>
					</FilterRow>
				) : null}
				<FilterRow last title={t("adminShell.pageExamples.searchList.otherOptions")}>
					<Row gutter={[16, 8]}>
						<Col lg={8} md={12} xs={24}>
							<Form.Item
								label={
									showOwner
										? t("adminShell.pageExamples.searchList.activeUser")
										: t("adminShell.pageExamples.searchList.author")
								}
								style={{ marginBottom: 0 }}
							>
								<Select
									allowClear
									onChange={(author) => onChange({ ...filters, author })}
									options={ownerOptions}
									placeholder={t("adminShell.pageExamples.searchList.unlimited")}
									style={{ width: "100%" }}
								value={filters.author ?? null}
								/>
							</Form.Item>
						</Col>
						<Col lg={8} md={12} xs={24}>
							<Form.Item
								label={t("adminShell.pageExamples.searchList.rating")}
								style={{ marginBottom: 0 }}
							>
								<Select
									allowClear
									onChange={(rate) => onChange({ ...filters, rate })}
									options={[
										{
											label: t("adminShell.pageExamples.searchList.ratings.good"),
											value: "good",
										},
										{
											label: t("adminShell.pageExamples.searchList.ratings.normal"),
											value: "normal",
										},
									]}
									placeholder={t("adminShell.pageExamples.searchList.unlimited")}
									style={{ width: "100%" }}
									value={filters.rate ?? null}
								/>
							</Form.Item>
						</Col>
					</Row>
				</FilterRow>
			</Form>
		</Card>
	);
}

function SearchErrorOrEmpty({
	isEmpty,
	onRetry,
}: {
	isEmpty: boolean;
	onRetry: () => void;
}) {
	const { t } = useTranslation();
	return isEmpty ? (
		<Empty description={t("adminShell.pageExamples.empty")} />
	) : (
		<Empty
			description={t("adminShell.pageExamples.loadError")}
			image={Empty.PRESENTED_IMAGE_SIMPLE}
		>
			<Button onClick={onRetry}>{t("adminShell.pageExamples.retry")}</Button>
		</Empty>
	);
}

function useSearchItems(
	kind: SearchPageKind,
	q: string,
	filters: SearchFilters,
	pageSize: number,
) {
	return useQuery({
		queryFn: ({ signal }) =>
			listExampleItems(
				{
					...(filters.author ? { author: filters.author } : {}),
					category: filters.category,
					...(filters.owner.length ? { owner: filters.owner } : {}),
					page: 1,
					pageSize,
					...(q ? { q } : {}),
					...(filters.rate ? { rate: filters.rate } : {}),
				},
				signal,
			),
		queryKey: [...exampleItemsQueryKey, "search", kind, q, filters, pageSize],
	});
}

function MetricIcon({ icon, value }: { icon: ReactNode; value: number }) {
	return (
		<Space size={8}>
			{icon}
			<span>{value}</span>
		</Space>
	);
}

export function SearchArticlesPage() {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const [q, setQ] = useState("");
	const [pageSize, setPageSize] = useState(5);
	const [filters, setFilters] = useState<SearchFilters>({
		author: undefined,
		category: [],
		owner: ["Olivia Chen", "Noah Wang"],
		rate: undefined,
	});
	const query = useSearchItems("articles", q, filters, pageSize);
	const items = query.data?.items ?? [];
	const canLoadMore = items.length < (query.data?.total ?? 0);

	return (
		<SearchPageFrame activeKey="articles" onSearch={setQ}>
			<SearchFilterCard filters={filters} onChange={setFilters} showOwner />
			<Card
				styles={{ body: { padding: `${token.paddingXS}px ${token.paddingLG}px ${token.paddingLG}px` } }}
				variant="borderless"
			>
				{query.isPending ? (
					<Skeleton active paragraph={{ rows: 10 }} />
				) : query.isError || items.length === 0 ? (
					<SearchErrorOrEmpty
						isEmpty={!query.isError}
						onRetry={() => void query.refetch()}
					/>
				) : (
					<>
						<List
							dataSource={items}
							itemLayout="vertical"
							renderItem={(item) => (
								<List.Item
									actions={[
										<MetricIcon icon={<StarOutlined />} key="star" value={item.star} />,
										<MetricIcon icon={<LikeOutlined />} key="like" value={item.like} />,
										<MetricIcon
											icon={<MessageOutlined />}
											key="message"
											value={item.message}
										/>,
									]}
									key={item.id}
								>
									<List.Item.Meta
										description={
											<Space wrap>
												<Tag>Ant Design</Tag>
												<Tag>{t("adminShell.pageExamples.searchList.designLanguage")}</Tag>
												<Tag>{t("adminShell.pageExamples.searchList.enterprise")}</Tag>
											</Space>
										}
										title={<a href="#search-article">{item.title}</a>}
									/>
									<Paragraph ellipsis={{ rows: 2 }}>{item.description}</Paragraph>
									<Text type="secondary">
										{item.owner} · {new Date(item.updatedAt).toLocaleDateString()}
									</Text>
								</List.Item>
							)}
							size="large"
						/>
						{canLoadMore ? (
							<Flex justify="center" style={{ marginTop: token.margin }}>
								<Button
									onClick={() => setPageSize((current) => current + 5)}
									style={{ paddingInline: token.paddingXL * 2 }}
								>
									{query.isFetching ? <LoadingOutlined /> : null}
									{t("adminShell.pageExamples.searchList.loadMore")}
								</Button>
							</Flex>
						) : null}
					</>
				)}
			</Card>
		</SearchPageFrame>
	);
}

function ProjectCard({ item }: { item: ExampleListItem }) {
	return (
		<Card
			cover={
				<img
					alt={item.title}
					src={item.cover}
					style={{ aspectRatio: "16 / 9", objectFit: "cover", width: "100%" }}
				/>
			}
			hoverable
			style={{ height: "100%" }}
		>
			<Card.Meta
				description={<Paragraph ellipsis={{ rows: 2 }}>{item.subDescription}</Paragraph>}
				title={<a href="#search-project">{item.title}</a>}
			/>
			<Flex align="center" justify="space-between" style={{ marginTop: 16 }}>
				<Text type="secondary">{new Date(item.updatedAt).toLocaleDateString()}</Text>
				<Avatar.Group size="small">
					{item.members.map((member) => (
						<Tooltip key={member.id} title={member.name}>
							<Avatar alt={member.name} src={member.avatar} />
						</Tooltip>
					))}
				</Avatar.Group>
			</Flex>
		</Card>
	);
}

export function SearchProjectsPage() {
	const { token } = theme.useToken();
	const [q, setQ] = useState("");
	const [filters, setFilters] = useState<SearchFilters>({
		author: undefined,
		category: [],
		owner: [],
		rate: undefined,
	});
	const query = useSearchItems("projects", q, filters, 8);
	const items = query.data?.items ?? [];

	return (
		<SearchPageFrame activeKey="projects" onSearch={setQ}>
			<SearchFilterCard filters={filters} onChange={setFilters} />
			{query.isPending ? (
				<Skeleton active paragraph={{ rows: 12 }} />
			) : query.isError || items.length === 0 ? (
				<Card variant="borderless">
					<SearchErrorOrEmpty
						isEmpty={!query.isError}
						onRetry={() => void query.refetch()}
					/>
				</Card>
			) : (
				<List
					dataSource={items}
					data-testid="search-project-grid"
					grid={{ gutter: token.margin, lg: 3, md: 3, sm: 2, xl: 4, xs: 1, xxl: 4 }}
					renderItem={(item) => (
						<List.Item>
							<ProjectCard item={item} />
						</List.Item>
					)}
				/>
			)}
		</SearchPageFrame>
	);
}

function ApplicationCard({ item }: { item: ExampleListItem }) {
	const { t } = useTranslation();
	const numberFormat = new Intl.NumberFormat();
	const actions = [
		{
			icon: <DownloadOutlined />,
			key: "download",
			label: t("adminShell.pageExamples.searchList.actions.download"),
		},
		{
			icon: <EditOutlined />,
			key: "edit",
			label: t("adminShell.pageExamples.searchList.actions.edit"),
		},
		{
			icon: <ShareAltOutlined />,
			key: "share",
			label: t("adminShell.pageExamples.searchList.actions.share"),
		},
	];

	return (
		<Card
			actions={[
				...actions.map((action) => (
					<Tooltip key={action.key} title={action.label}>
						<Button aria-label={action.label} icon={action.icon} type="text" />
					</Tooltip>
				)),
				<Dropdown
					key="more"
					menu={{
						items: [
							{
								key: "disable",
								label: t("adminShell.pageExamples.searchList.actions.disable"),
							},
							{
								key: "archive",
								label: t("adminShell.pageExamples.searchList.actions.archive"),
							},
						],
					}}
				>
					<Button
						aria-label={t("adminShell.pageExamples.more")}
						icon={<EllipsisOutlined />}
						type="text"
					/>
				</Dropdown>,
			]}
			hoverable
			style={{ height: "100%" }}
			styles={{ body: { paddingBottom: 20 } }}
		>
			<Card.Meta avatar={<Avatar size="small" src={item.avatar} />} title={item.title} />
			<Flex style={{ marginInlineStart: 40, marginTop: 16 }}>
				<div style={{ flex: 1 }}>
					<Text type="secondary">
						{t("adminShell.pageExamples.searchList.activeUsers")}
					</Text>
					<Paragraph style={{ fontSize: 24, lineHeight: "32px", margin: 0 }}>
						{numberFormat.format(item.activeUser)}
					</Paragraph>
				</div>
				<div style={{ flex: 1 }}>
					<Text type="secondary">
						{t("adminShell.pageExamples.searchList.newUsers")}
					</Text>
					<Paragraph style={{ fontSize: 24, lineHeight: "32px", margin: 0 }}>
						{numberFormat.format(item.newUser)}
					</Paragraph>
				</div>
			</Flex>
		</Card>
	);
}

export function SearchApplicationsPage() {
	const { token } = theme.useToken();
	const [q, setQ] = useState("");
	const [filters, setFilters] = useState<SearchFilters>({
		author: undefined,
		category: [],
		owner: [],
		rate: undefined,
	});
	const query = useSearchItems("applications", q, filters, 8);
	const items = query.data?.items ?? [];

	return (
		<SearchPageFrame activeKey="applications" onSearch={setQ}>
			<SearchFilterCard filters={filters} onChange={setFilters} />
			{query.isPending ? (
				<Skeleton active paragraph={{ rows: 12 }} />
			) : query.isError || items.length === 0 ? (
				<Card variant="borderless">
					<SearchErrorOrEmpty
						isEmpty={!query.isError}
						onRetry={() => void query.refetch()}
					/>
				</Card>
			) : (
				<List
					dataSource={items}
					grid={{ gutter: token.margin, lg: 3, md: 3, sm: 2, xl: 4, xs: 1, xxl: 4 }}
					renderItem={(item) => (
						<List.Item>
							<ApplicationCard item={item} />
						</List.Item>
					)}
				/>
			)}
		</SearchPageFrame>
	);
}
