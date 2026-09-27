import { jsx } from "./jsx-runtime.ts";
import type { Key, ReactElement, ReactNode } from "./types/element.ts";
import type { RuntimeProps } from "./types/props.ts";

type ElementType = Parameters<typeof jsx>[0];
type JsxProps = NonNullable<Parameters<typeof jsx>[1]>;

type CreateElementProps = RuntimeProps & {
	key?: Key | null;
};

export function createElement(
	type: ElementType,
	props: CreateElementProps | null,
	...children: ReactNode[]
): ReactElement {
	const { key, ...config } = props ?? {};
	const jsxProps: JsxProps = children.length === 0 ? config : { ...config, children };

	return jsx(type, jsxProps, key ?? undefined);
}
