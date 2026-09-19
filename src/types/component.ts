import type { REACT_MEMO_TYPE, ReactElement } from "./element.ts";

export type ComponentProps = object;

export interface FunctionComponent<Props extends ComponentProps = ComponentProps> {
	(props: Props): ReactElement | null;
}

export interface MemoCompare<Props extends ComponentProps = ComponentProps> {
	(previousProps: Props, nextProps: Props): boolean;
}

export interface MemoComponent<Props extends ComponentProps = ComponentProps> {
	(props: Props): ReactElement | null;
	$$typeof: typeof REACT_MEMO_TYPE;
	type: FunctionComponent<Props>;
	compare: MemoCompare<Props> | null;
}
