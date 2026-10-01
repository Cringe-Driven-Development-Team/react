import type { REACT_CONTEXT_TYPE } from "../symbols.ts";
import type { ReactElement, ReactNode } from "./element.ts";

export interface Context<Value> {
	(props: ContextProviderProps<Value>): ReactElement | null;
	readonly $$typeof: typeof REACT_CONTEXT_TYPE;
	readonly defaultValue: Value;
}

export interface ContextProviderProps<Value> {
	value: Value;
	children?: ReactNode;
}

export interface ContextDependency<Value = unknown> {
	readonly context: Context<Value>;
	readonly value: Value;
}
