import { REACT_ELEMENT_TYPE, REACT_FRAGMENT_TYPE } from "./symbols.ts";
import type { Key, ReactElement, ReactNode, Tag } from "./types/element.ts";
import { toChildren } from "./children.ts";
import type { FunctionComponent } from "./types/component.ts";
import type { ElementProps, RuntimeProps } from "./types/props.ts";

export function h<Props extends ElementProps>(
	type: FunctionComponent<Props>,
	props: (Omit<Props, "children"> & { key?: Key | null }) | null,
	...children: ReactNode[]
): ReactElement<Props>;

export function h(type: Tag, props: ElementProps | null, ...children: ReactNode[]): ReactElement;

export function h(
	type: Tag | FunctionComponent<ElementProps>,
	props: ElementProps | null,
	...children: ReactNode[]
): ReactElement {
	const { key, ...restProps } = (props ?? {}) as RuntimeProps & { key?: unknown };

	return {
		$$typeof: REACT_ELEMENT_TYPE,
		type,
		key: normalizeKey(key),
		props: {
			...restProps,
			children: toChildren(children),
		},
	};
}

export function hFragment(children: ReactNode[], key?: unknown): ReactElement {
	return {
		$$typeof: REACT_ELEMENT_TYPE,
		type: REACT_FRAGMENT_TYPE,
		key: normalizeKey(key),
		props: {
			children: toChildren(children),
		},
	};
}

function normalizeKey(key: unknown): Key | null {
	return typeof key === "string" || typeof key === "number" ? key : null;
}
