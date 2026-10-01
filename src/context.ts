import { REACT_CONTEXT_TYPE } from "./symbols.ts";
import type { Context, ContextDependency, ContextProviderProps } from "./types/context.ts";
import { FiberTag, type ContextProviderFiber, type Fiber } from "./types/fiber.ts";

type RuntimeContext = {
	$$typeof?: unknown;
};

export function createContext<Value>(defaultValue: Value): Context<Value> {
	return {
		$$typeof: REACT_CONTEXT_TYPE,
		defaultValue,
	} as Context<Value>;
}

export function isContext(value: unknown): value is Context<unknown> {
	return isObject(value) && (value as RuntimeContext).$$typeof === REACT_CONTEXT_TYPE;
}

export function assertContext(context: unknown): asserts context is Context<unknown> {
	if (!isContext(context)) {
		throw new Error("Render.useContext expected a context object returned by createContext.");
	}
}

export function readContextValue<Value>(fiber: Fiber, context: Context<Value>): Value {
	assertContext(context);

	const value = findContextValue(fiber, context);
	trackContextDependency(fiber, context, value);
	return value;
}

export function propagateContextChange(providerFiber: Fiber): void {
	if (!isContextProviderFiber(providerFiber) || !providerFiber.alternate) {
		return;
	}

	const previousValue = getProviderValue(providerFiber.alternate);
	const nextValue = getProviderValue(providerFiber);

	if (Object.is(previousValue, nextValue)) {
		return;
	}

	markContextConsumers(providerFiber.alternate.child, providerFiber.type, nextValue);
}

export function warnIfProviderValueMissing(providerFiber: Fiber): void {
	if (isContextProviderFiber(providerFiber) && !("value" in providerFiber.props)) {
		console.warn("Context expects a `value` prop.");
	}
}

function findContextValue<Value>(fiber: Fiber, context: Context<Value>): Value {
	let parent = fiber.parent;

	while (parent) {
		if (isContextProviderFiber(parent) && parent.type === context) {
			return getProviderValue(parent) as Value;
		}

		parent = parent.parent;
	}

	return context.defaultValue;
}

function isContextProviderFiber(fiber: Fiber): fiber is ContextProviderFiber {
	return fiber.tag === FiberTag.CONTEXT_PROVIDER;
}

function trackContextDependency<Value>(fiber: Fiber, context: Context<Value>, value: Value): void {
	const dependencies = fiber.contextDependencies ?? [];
	dependencies.push({ context, value } as ContextDependency<unknown>);
	fiber.contextDependencies = dependencies;
}

function markContextConsumers(
	fiber: Fiber | null,
	context: Context<unknown>,
	nextValue: unknown,
): void {
	let nextFiber = fiber;

	while (nextFiber) {
		if (isContextProviderFiber(nextFiber) && nextFiber.type === context) {
			nextFiber = nextFiber.sibling;
			continue;
		}

		if (hasChangedContextDependency(nextFiber, context, nextValue)) {
			nextFiber.hasContextUpdate = true;
			markParentPathHasContextUpdate(nextFiber);
		}

		if (nextFiber.child) {
			markContextConsumers(nextFiber.child, context, nextValue);
		}

		nextFiber = nextFiber.sibling;
	}
}

function hasChangedContextDependency(
	fiber: Fiber,
	context: Context<unknown>,
	nextValue: unknown,
): boolean {
	return Boolean(
		fiber.contextDependencies?.some(
			(dependency) => dependency.context === context && !Object.is(dependency.value, nextValue),
		),
	);
}

function markParentPathHasContextUpdate(fiber: Fiber): void {
	let parent = fiber.parent;

	while (parent) {
		parent.hasDirtySubtree = true;
		parent = parent.parent;
	}
}

function getProviderValue(fiber: Fiber): unknown {
	return (fiber.props as ContextProviderProps<unknown>).value;
}

function isObject(value: unknown): value is object {
	return typeof value === "object" && value !== null;
}
