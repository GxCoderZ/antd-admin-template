import { clearSession } from "#src/application/session";
import { loginPath } from "#src/router/extra-info";
import { rememberRoute } from "#src/utils/remember-route";

/**
 * 跳转到登录页面
 *
 */
export function goLogin() {
	// 重置登录状态
	clearSession();

	const remembered = rememberRoute();
	// hash 模式下需要把 query 放在 # 后面
	if (import.meta.env.VITE_ROUTER_MODE === "hash") {
		window.location.href = `${import.meta.env.BASE_URL}#${loginPath}${remembered}`;
	}
	else {
		window.location.href = `${import.meta.env.BASE_URL}${loginPath.slice(1)}${remembered}`;
	}
}
