import { theme } from "antd";
import { Link as RouterLink, type LinkProps } from "react-router";

import { dashboardPath } from "../../app/adminRoutes";
import { PressRipple } from "./PressRipple";
import styles from "./PressRipple.module.css";
import { usePressRipple } from "./usePressRipple";

export function NavigationBrandLink({
	children,
	style,
	...linkProps
}: Pick<LinkProps, "aria-label" | "children" | "style">) {
	const { token } = theme.useToken();
	const { ripples, rippleProps, showRipple, releaseRipple, finishRipple } =
		usePressRipple();

	return (
		<>
			<RouterLink
				{...linkProps}
				{...rippleProps}
				className={styles.button}
				onBlur={releaseRipple}
				onDragStart={releaseRipple}
				onKeyDown={(event) => {
					if (event.key === "Enter" && !event.repeat) {
						showRipple(event.currentTarget);
					}
				}}
				onKeyUp={(event) => {
					if (event.key === "Enter") releaseRipple();
				}}
				onPointerCancel={releaseRipple}
				onPointerDown={(event) => {
					if (event.button === 0) showRipple(event.currentTarget, event);
				}}
				onPointerLeave={releaseRipple}
				onPointerUp={releaseRipple}
				style={{
					color: "inherit",
					lineHeight: "inherit",
					outlineOffset: -token.lineWidthFocus,
					textDecoration: "none",
					...style,
				}}
				to={dashboardPath}
			>
				{children}
			</RouterLink>
			<PressRipple ripples={ripples} onFinish={finishRipple} />
		</>
	);
}
