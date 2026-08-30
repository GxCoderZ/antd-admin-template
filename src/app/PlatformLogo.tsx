import { AntDesignOutlined } from "@ant-design/icons";
import { theme } from "antd";

export function PlatformLogo({
	size,
	src,
}: {
	size: number;
	src: string | null;
}) {
	const { token } = theme.useToken();
	return src ? (
		<img
			alt=""
			src={src}
			style={{
				flex: "0 0 auto",
				height: size,
				objectFit: "contain",
				width: size,
			}}
		/>
	) : (
		<AntDesignOutlined
			aria-hidden
			style={{ color: token.colorPrimary, flex: "0 0 auto", fontSize: size }}
		/>
	);
}
