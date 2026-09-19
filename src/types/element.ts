import type {
	REACT_ELEMENT_TYPE,
	REACT_FRAGMENT_TYPE,
	REACT_ROOT_TYPE,
	REACT_TEXT_TYPE,
} from "../symbols.ts";
import type { FunctionComponent, MemoComponent } from "./component.ts";
import type { ElementProps } from "./props.ts";

export type Tag = keyof HTMLElementTagNameMap;

export type Key = string | number;

export type ReactElementType =
	| keyof HTMLElementTagNameMap
	| FunctionComponent
	| MemoComponent
	| typeof REACT_ROOT_TYPE
	| typeof REACT_FRAGMENT_TYPE
	| typeof REACT_TEXT_TYPE;

export interface ReactElement<Props extends ElementProps = ElementProps> {
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
