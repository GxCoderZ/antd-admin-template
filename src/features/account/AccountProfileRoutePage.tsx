import { useNavigate } from "react-router";

import { AccountProfilePage } from "./AccountProfilePage";

export function AccountProfileRoutePage() {
	const navigate = useNavigate();

	return (
		<AccountProfilePage
			onOpenSettings={() => void navigate("/account/settings")}
		/>
	);
}
