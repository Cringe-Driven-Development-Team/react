import type { FunctionComponent, MemoComponent, ComponentProps } from "./component.ts";

export const REACT_ELEMENT_TYPE = Symbol.for("react.element");
export const REACT_ROOT_TYPE = Symbol.for("react.root");
export const REACT_FRAGMENT_TYPE = Symbol.for("react.fragment");
export const REACT_TEXT_TYPE = Symbol.for("react.text");
export const REACT_MEMO_TYPE = Symbol.for("react.memo");

export type Tag = keyof HTMLElementTagNameMap;

export type Key = string | number;

export type RuntimeProps = Record<string, unknown>;

export type ReactElementType =
	| keyof HTMLElementTagNameMap
	| FunctionComponent
	| MemoComponent
	| typeof REACT_ROOT_TYPE
	| typeof REACT_FRAGMENT_TYPE
	| typeof REACT_TEXT_TYPE;

export interface ReactElement<Props extends ComponentProps = ComponentProps> {
	$$typeof: typeof REACT_ELEMENT_TYPE;
	type: ReactElementType;
	key: Key | null;
	props: Props & {
		children: ReactElement[];
	};
}

export type ReactText = string | number;
export type RenderableChild = ReactElement | ReactText;
export type ReactNode = RenderableChild | ReactNode[] | boolean | null | undefined;
