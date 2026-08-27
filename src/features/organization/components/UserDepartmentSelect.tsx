import { useQuery } from "@tanstack/react-query";
import { Button, Flex, TreeSelect, Typography } from "antd";
import { useTranslation } from "react-i18next";

import {
	listPlatformDepartments,
	platformDepartmentsQueryKey,
	type PlatformDepartment,
} from "#src/api/departments";

function departmentOptions(departments: PlatformDepartment[]): {
	title: string;
	value: string;
	disabled: boolean;
	children: ReturnType<typeof departmentOptions>;
}[] {
	return departments.map((department) => ({
		title: department.name,
		value: department.id,
		disabled: department.status === "disabled",
		children: departmentOptions(department.children),
	}));
}

export function UserDepartmentSelect({
	value,
	onChange,
	id,
}: {
	value?: string | null;
	onChange?: (value: string | null) => void;
	id?: string;
}) {
	const { t } = useTranslation();
	const query = useQuery({
		queryKey: [...platformDepartmentsQueryKey, "user-options"],
		queryFn: ({ signal }) => listPlatformDepartments({}, signal),
	});
	return (
		<Flex vertical>
			<TreeSelect
				allowClear
				aria-label={t("adminShell.users.columns.department")}
				disabled={query.isPending || query.isError}
				{...(id ? { id } : {})}
				loading={query.isFetching}
				onChange={(next: string | undefined) => onChange?.(next ?? null)}
				showSearch
				treeData={query.data ? departmentOptions(query.data) : []}
				treeNodeFilterProp="title"
				value={value ?? undefined}
			/>
			{query.isError ? (
				<Typography.Text role="alert" type="danger">
					{t("adminShell.users.errors.departmentLoad")}
					<Button onClick={() => void query.refetch()} type="link">
						{t("adminShell.users.retry")}
					</Button>
				</Typography.Text>
			) : null}
		</Flex>
	);
}
