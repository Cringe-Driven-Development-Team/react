import { h, hFragment } from "./h.ts";
import { REACT_FRAGMENT_TYPE } from "./symbols.ts";
import type { ExoticComponent, FunctionComponent, MemoComponent } from "./types/component.ts";
import type { Key, ReactElement, ReactNode, Tag } from "./types/element.ts";
import type { ElementProps, RuntimeProps } from "./types/props.ts";
import { isMemoComponent } from "./memo.ts";
import { isContext } from "./context.ts";
import type { Context, ContextProviderProps } from "./types/context.ts";

type JsxProps = RuntimeProps & {
	children?: ReactNode;
};

export const Fragment = REACT_FRAGMENT_TYPE as unknown as ExoticComponent<{
	children?: ReactNode;
}>;
type RuntimeElementType =
	| Tag
	| FunctionComponent<ElementProps>
	| MemoComponent<ElementProps>
	| Context<unknown>
	| typeof Fragment;

export function jsx(type: RuntimeElementType, props: JsxProps | null, key?: Key): ReactElement {
	const { children, ...restProps } = props ?? {};
	const propsWithKey = key === undefined ? restProps : { ...restProps, key };
	const normalizedChildren =
		children === undefined ? [] : Array.isArray(children) ? children : [children];

	if (type === Fragment) {
		return hFragment(normalizedChildren, key);
	}

	if (isContext(type)) {
		return h(type, propsWithKey as unknown as ContextProviderProps<unknown>, ...normalizedChildren);
	}

	if (isMemoComponent(type)) {
		return h(type, propsWithKey as ElementProps, ...normalizedChildren);
	}

	if (typeof type === "function") {
		return h(type, propsWithKey as ElementProps, ...normalizedChildren);
	}

	if (typeof type === "string") {
		return h(type, propsWithKey as ElementProps, ...normalizedChildren);
	}

	throw new Error("Unsupported JSX element type");
}

export function jsxs(type: RuntimeElementType, props: JsxProps | null, key?: Key): ReactElement {
	return jsx(type, props, key);
}

export type { JSX } from "./types/jsx.ts";
