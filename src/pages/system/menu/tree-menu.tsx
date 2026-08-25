import type { PermissionGroupType } from "#src/api/system/menu";
import type { TreeDataNode } from "antd";

import { BasicButton } from "#src/components/basic-button";

import { SearchOutlined } from "@ant-design/icons";
import { Alert, Card, Empty, Flex, Input, Skeleton, Tree, Typography } from "antd";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { permissionModuleNames } from "./constants";

interface TreeMenuProps {
	error?: Error | null
	groups: PermissionGroupType[]
	loading?: boolean
	onRetry?: () => void
	onSelect: (module?: string) => void
	selectedModule?: string
}

export default function TreeMenu({ error, groups, loading = false, onRetry, onSelect, selectedModule }: TreeMenuProps) {
	const { t } = useTranslation();
	const [keyword, setKeyword] = useState("");
	const [expandedOverride, setExpandedOverride] = useState<React.Key[]>();
	const treeData = useMemo<TreeDataNode[]>(() => groups
		.filter(group => !keyword || `${permissionModuleNames[group.module] ?? group.module}${group.module}${group.permissions.map(item => `${item.name}${item.code}`).join("")}`.toLocaleLowerCase().includes(keyword.toLocaleLowerCase()))
		.map(group => ({
			key: group.module,
			title: permissionModuleNames[group.module] ?? group.module,
			children: group.permissions.map(permission => ({ key: `permission:${permission.id}`, selectable: false, title: permission.name })),
		})), [groups, keyword]);
	const allKeys = treeData.map(item => item.key);
	const expandedKeys = expandedOverride ?? allKeys;

	return (
		<Card className="h-full" title={t("system.menu.permissionGroups")}>
			<Flex gap="middle" vertical>
				<Input allowClear placeholder={t("system.menu.searchModule")} prefix={<SearchOutlined />} value={keyword} onChange={event => setKeyword(event.target.value)} />
				<Flex gap="small">
					<BasicButton size="small" onClick={() => setExpandedOverride(allKeys)}>{t("common.expandAll")}</BasicButton>
					<BasicButton size="small" onClick={() => setExpandedOverride([])}>{t("common.collapseAll")}</BasicButton>
					{selectedModule && <BasicButton size="small" onClick={() => onSelect(undefined)}>{t("common.all")}</BasicButton>}
				</Flex>
				{error && (
					<Alert
						action={<BasicButton size="small" onClick={onRetry}>{t("common.retry")}</BasicButton>}
						description={error.message}
						showIcon
						type="error"
					/>
				)}
				{loading
					? <Skeleton active paragraph={{ rows: 6 }} />
					: treeData.length > 0
						? (
							<Tree
								blockNode
								expandedKeys={expandedKeys}
								onExpand={setExpandedOverride}
								onSelect={keys => onSelect(keys[0] ? String(keys[0]) : undefined)}
								selectedKeys={selectedModule ? [selectedModule] : []}
								treeData={treeData}
							/>
						)
						: <Empty description={<Typography.Text type="secondary">{t("common.noData")}</Typography.Text>} image={Empty.PRESENTED_IMAGE_SIMPLE} />}
			</Flex>
		</Card>
	);
}
