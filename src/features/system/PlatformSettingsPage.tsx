import { ApiProblemError } from "#src/api/client";
import {
	getPlatformSettings,
	platformSettingsQueryKey,
	updatePlatformSettings,
} from "#src/api/settings";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, Button, Flex, theme } from "antd";
import { useTranslation } from "react-i18next";

import { FormSkeleton } from "../../app/LoadingSkeletons";
import { platformPermissions, usePermission } from "../../app/permissions";
import { PlatformSettingsForm } from "./PlatformSettingsForm";

export function PlatformSettingsPage() {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const queryClient = useQueryClient();
	const canManage = usePermission(platformPermissions.settingsManage);
	const settingsQuery = useQuery({
		queryFn: ({ signal }) => getPlatformSettings(signal),
		queryKey: platformSettingsQueryKey,
		staleTime: Number.POSITIVE_INFINITY,
		refetchOnWindowFocus: false,
	});
	const mutation = useMutation({
		mutationFn: updatePlatformSettings,
		onSuccess: (settings) =>
			queryClient.setQueryData(platformSettingsQueryKey, settings),
	});
	const conflict =
		mutation.error instanceof ApiProblemError && mutation.error.status === 409;
	const errorDescription = (error: unknown) =>
		error instanceof ApiProblemError
			? error.message
			: t("adminShell.platformSettings.errors.fallback");

	if (settingsQuery.isPending) return <FormSkeleton />;
	if (settingsQuery.isError) {
		return (
			<Alert
				action={
					<Button onClick={() => void settingsQuery.refetch()}>
						{t("adminShell.platformSettings.retry")}
					</Button>
				}
				description={errorDescription(settingsQuery.error)}
				showIcon
				title={t("adminShell.platformSettings.errors.load")}
				type="error"
			/>
		);
	}
	return (
		<Flex gap={token.margin} vertical>
			{mutation.isError ? (
				<Alert
					action={
						conflict ? (
							<Button
								onClick={() => {
									mutation.reset();
									void settingsQuery.refetch();
								}}
							>
								{t("optimisticLock.reload")}
							</Button>
						) : undefined
					}
					description={
						conflict
							? t("optimisticLock.description")
							: errorDescription(mutation.error)
					}
					showIcon
					title={t(
						conflict
							? "optimisticLock.title"
							: "adminShell.platformSettings.errors.update",
					)}
					type="error"
				/>
			) : null}
			{mutation.isSuccess ? (
				<Alert
					showIcon
					title={t("adminShell.platformSettings.saved")}
					type="success"
				/>
			) : null}
			<PlatformSettingsForm
				canManage={canManage}
				conflict={conflict}
				initialValues={settingsQuery.data}
				key={settingsQuery.data.version}
				onChange={() => {
					if (!conflict) mutation.reset();
				}}
				onSave={(values) => {
					if (canManage && !conflict && !mutation.isPending) {
						mutation.mutate({
							...values,
							expectedVersion: settingsQuery.data.version,
						});
					}
				}}
				saving={mutation.isPending}
			/>
		</Flex>
	);
}
