import {
	DeleteOutlined,
	EditOutlined,
	FolderOutlined,
	PlusOutlined,
} from "@ant-design/icons";
import {
	Button,
	Card,
	Empty,
	Flex,
	Input,
	Skeleton,
	Space,
	Tree,
	Typography,
} from "antd";
import type { DataNode } from "antd/es/tree";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import type { ContentCategory } from "#src/api/content-categories";

const { Text } = Typography;

interface CategoryTreePanelProps {
	categories: ContentCategory[];
	loading: boolean;
	onCreate: () => void;
	onDelete: () => void;
	onEdit: () => void;
	onSearch: (value: string) => void;
	onSelect: (categoryId: string) => void;
	search: string;
	selectedCategoryId: string;
}

export function CategoryTreePanel({
	categories,
	loading,
	onCreate,
	onDelete,
	onEdit,
	onSearch,
	onSelect,
	search,
	selectedCategoryId,
}: CategoryTreePanelProps) {
	const { t } = useTranslation();
	const treeData = useMemo<DataNode[]>(() => {
		const mapNodes = (items: ContentCategory[]): DataNode[] =>
			items.map((category) => ({
				children: mapNodes(category.children),
				icon: <FolderOutlined aria-hidden />,
				key: category.id,
				title: (
					<span
						style={{
							alignItems: "center",
							display: "inline-flex",
							gap: 8,
							maxWidth: "100%",
							verticalAlign: "top",
						}}
					>
						<span
							style={{
								minWidth: 0,
								overflow: "hidden",
								textOverflow: "ellipsis",
								whiteSpace: "nowrap",
							}}
						>
							{category.name}
						</span>
						<Text type="secondary">{category.itemCount}</Text>
					</span>
				),
			}));
		return [
			{
				children: mapNodes(categories),
				icon: <FolderOutlined aria-hidden />,
				key: "all",
				title: t("adminShell.contentCategories.allContent"),
			},
		];
	}, [categories, t]);
	const hasCategorySelection = selectedCategoryId !== "all";

	return (
		<Card
			title={t("adminShell.contentCategories.treeTitle")}
			styles={{ body: { minHeight: 360 } }}
		>
			<Flex gap="middle" vertical>
				<Input.Search
					allowClear
					onChange={(event) => onSearch(event.target.value)}
					placeholder={t("adminShell.contentCategories.searchCategory")}
					value={search}
				/>
				<Space.Compact block>
					<Button
						block
						icon={<PlusOutlined aria-hidden />}
						onClick={onCreate}
						type="primary"
					>
						{t("adminShell.contentCategories.createCategory")}
					</Button>
					<Button
						aria-label={t("adminShell.contentCategories.editCategory")}
						disabled={!hasCategorySelection}
						icon={<EditOutlined aria-hidden />}
						onClick={onEdit}
					/>
					<Button
						aria-label={t("adminShell.contentCategories.deleteCategory")}
						danger
						disabled={!hasCategorySelection}
						icon={<DeleteOutlined aria-hidden />}
						onClick={onDelete}
					/>
				</Space.Compact>
				{loading ? (
					<Skeleton active paragraph={{ rows: 8 }} title={false} />
				) : categories.length === 0 && search ? (
					<Empty
						description={t("adminShell.contentCategories.emptyCategories")}
						image={Empty.PRESENTED_IMAGE_SIMPLE}
					/>
				) : (
					<Tree
						blockNode
						defaultExpandAll
						onSelect={(keys) => onSelect(String(keys[0] ?? "all"))}
						selectedKeys={[selectedCategoryId]}
						showIcon
						showLine
						treeData={treeData}
					/>
				)}
			</Flex>
		</Card>
	);
}
