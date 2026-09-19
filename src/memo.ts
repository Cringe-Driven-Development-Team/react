import { REACT_MEMO_TYPE, type RuntimeProps } from "./types/element.ts";
import type {
	ComponentProps,
	FunctionComponent,
	MemoCompare,
	MemoComponent,
} from "./types/component.ts";

export function memo<Props extends ComponentProps>(
	type: FunctionComponent<Props> & { $$typeof?: never },
	compare?: MemoCompare<Props>,
): MemoComponent<Props> {
	return {
		$$typeof: REACT_MEMO_TYPE,
		type,
		compare: compare ?? null,
	} as MemoComponent<Props>;
}

export function isMemoComponent(type: unknown): type is MemoComponent {
	return (
		typeof type === "object" &&
		type !== null &&
		"$$typeof" in type &&
		(type as { $$typeof: unknown }).$$typeof === REACT_MEMO_TYPE
	);
}

export function shallowEqual(previousProps: ComponentProps, nextProps: ComponentProps): boolean {
	const previous = previousProps as RuntimeProps;
	const next = nextProps as RuntimeProps;
	const previousKeys = Object.keys(previous);

	if (previousKeys.length !== Object.keys(next).length) {
		return false;
	}

	return previousKeys.every(
		(key) => Object.hasOwn(next, key) && Object.is(previous[key], next[key]),
	);
}
