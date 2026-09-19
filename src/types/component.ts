import type { REACT_MEMO_TYPE } from "../symbols.ts";
import type { ReactElement } from "./element.ts";
import type { ElementProps } from "./props.ts";

export interface FunctionComponent<Props extends ElementProps = ElementProps> {
	(props: Props): ReactElement | null;
}

export interface MemoCompare<Props extends ElementProps = ElementProps> {
	(previousProps: Props, nextProps: Props): boolean;
}

export interface MemoComponent<Props extends ElementProps = ElementProps> {
	(props: Props): ReactElement | null;
	$$typeof: typeof REACT_MEMO_TYPE;
	type: FunctionComponent<Props>;
	compare: MemoCompare<Props> | null;
}
