import {
	type ReactNode,
	type Key,
	REACT_ELEMENT_TYPE,
	REACT_FRAGMENT_TYPE,
	type ReactElement,
	type Tag,
} from "./types/element.ts";
import { toChildren } from "./children.ts";
import type { ComponentProps, FunctionComponent } from "./types/component.ts";
import type { RuntimeProps } from "./types/element.ts";

export function h<Props extends ComponentProps>(
	type: FunctionComponent<Props>,
	props: (Omit<Props, "children"> & { key?: Key | null }) | null,
	...children: ReactNode[]
): ReactElement<Props>;

export function h(type: Tag, props: ComponentProps | null, ...children: ReactNode[]): ReactElement;

export function h(
	type: Tag | FunctionComponent<ComponentProps>,
	props: ComponentProps | null,
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
