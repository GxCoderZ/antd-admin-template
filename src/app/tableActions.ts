import { message } from "antd";
import { useTranslation } from "react-i18next";

export function useTableActions() {
	const { t } = useTranslation();
	const [messageApi, messageContextHolder] = message.useMessage();

	const copyTableValue = async (value: string) => {
		try {
			await navigator.clipboard.writeText(value);
			void messageApi.success(t("adminShell.tableActions.copySuccess"));
		} catch {
			void messageApi.error(t("adminShell.tableActions.copyError"));
		}
	};

	return { copyTableValue, messageContextHolder };
}
