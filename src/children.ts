import {
	REACT_ELEMENT_TYPE,
	REACT_TEXT_TYPE,
	type ReactElement,
	type ReactNode,
	type RenderableChild,
} from "./types/element.ts";
import type { ComponentProps } from "./types/component.ts";

const EMPTY_CHILDREN = Object.freeze<ReactElement[]>([]) as ReactElement[];

export const Children = {
	toArray(children: ReactNode): RenderableChild[] {
		return childrenToArray(children);
	},
};

export function isValidElement<Props extends ComponentProps = ComponentProps>(
	value: unknown,
): value is ReactElement<Props> {
	return (
		typeof value === "object" &&
		value !== null &&
		(value as { $$typeof?: unknown }).$$typeof === REACT_ELEMENT_TYPE
	);
}

export function toChildren(children: ReactNode[]): ReactElement[] {
	const normalized = normalizeChildren(children);
	return normalized.length === 0 ? EMPTY_CHILDREN : normalized;
}

export function normalizeChildren(children: ReactNode[]): ReactElement[] {
	const normalizedChildren: ReactElement[] = [];

	for (const child of children) {
		if (Array.isArray(child)) {
			normalizedChildren.push(...normalizeChildren(child));
		} else if (isRenderableChild(child)) {
			normalizedChildren.push(typeof child === "object" ? child : hString(String(child)));
		}
	}

	return normalizedChildren;
}

function hString(text: string): ReactElement<{ nodeValue: string }> {
	return {
		$$typeof: REACT_ELEMENT_TYPE,
		type: REACT_TEXT_TYPE,
		key: null,
		props: {
			nodeValue: text,
			children: [],
		},
	};
}

function isRenderableChild(child: ReactNode): child is RenderableChild {
	return child !== null && child !== undefined && typeof child !== "boolean";
}

function childrenToArray(children: ReactNode): RenderableChild[] {
	const result: RenderableChild[] = [];

	appendChildren(result, children);

	return result;
}

function appendChildren(result: RenderableChild[], child: ReactNode): void {
	if (Array.isArray(child)) {
		child.forEach((nestedChild) => appendChildren(result, nestedChild));
		return;
	}

	if (child !== null && child !== undefined && typeof child !== "boolean") {
		result.push(child);
	}
}
