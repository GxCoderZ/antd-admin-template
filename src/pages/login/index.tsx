import { AuthPageShell } from "./components/auth-page-shell";
import { PasswordLogin } from "./components/password-login";

export default function Login() {
	return (
		<AuthPageShell>
			<PasswordLogin />
		</AuthPageShell>
	);
}
