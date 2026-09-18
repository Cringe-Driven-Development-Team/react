import {
	EffectKind,
	HookKind,
	type Dispatch,
	type EffectCallback,
	type EffectDeps,
	type EffectHook,
	type Hook,
	type MemoCallback,
	type MemoHook,
	type StateAction,
	type StateHook,
} from "./types/hooks.ts";
import type { Fiber, FiberRoot } from "./types/fiber.ts";
import { getFiberRoot, markFiberDirty } from "./renderer-state.ts";
import { getFlagForEffectKind } from "./flags.ts";
import { countProfilerEvent } from "./profiler.ts";

const RE_RENDER_LIMIT = 25;

let currentlyRenderingFiber: Fiber | null = null;
let hookIndex = 0;
let scheduleRender: ((root: FiberRoot) => void) | null = null;
let restartRender: ((root: FiberRoot) => boolean) | null = null;
let reRenderCount = 0;
let didRequestRestart = false;
let isUpdateScheduled = false;
const queueOwners = new WeakMap<StateAction<unknown>[], Fiber>();
const dirtyRoots = new Set<FiberRoot>();

export function setScheduleRender(
	scheduler: (root: FiberRoot) => void,
	restart: (root: FiberRoot) => boolean,
): void {
	scheduleRender = scheduler;
	restartRender = restart;
}

export function resetReRenderCount(): void {
	reRenderCount = 0;
}

export function hasRequestedRestart(): boolean {
	return didRequestRestart;
}

export function prepareToUseHooks(fiber: Fiber): void {
	didRequestRestart = false;
	currentlyRenderingFiber = fiber;
	hookIndex = 0;
	currentlyRenderingFiber.hooks = [];
}

export function finishHooks(): void {
	currentlyRenderingFiber = null;
	hookIndex = 0;
}

export function adoptHookQueueOwners(fiber: Fiber): void {
	fiber.hooks?.forEach((hook) => {
		if (isStateHook(hook)) {
			queueOwners.set(hook.queue, fiber);
		}
	});
}

export function useState<State>(initial: State): [State, Dispatch<State>] {
	if (!currentlyRenderingFiber) {
		throw new Error("Render.useState must be called inside a function component.");
	}

	const fiber = currentlyRenderingFiber;

	const hooks = currentlyRenderingFiber.hooks;
	if (!hooks) {
		throw new Error("Hooks are not initialized.");
	}

	const oldHook = currentlyRenderingFiber.alternate?.hooks?.[hookIndex];
	const oldStateHook = oldHook && isStateHook(oldHook) ? oldHook : undefined;
	const queue = (oldStateHook?.queue ?? []) as StateAction<State>[];
	queueOwners.set(queue as StateAction<unknown>[], currentlyRenderingFiber);

	const hook: StateHook<State> = {
		kind: HookKind.STATE,
		state: oldStateHook ? (oldStateHook.state as State) : initial,
		queue,
		dispatch:
			(oldStateHook?.dispatch as Dispatch<State> | undefined) ??
			createDispatch<State>(fiber, queue),
	};

	queue.forEach((stateAction) => {
		hook.state =
			typeof stateAction === "function"
				? (stateAction as (previousState: State) => State)(hook.state)
				: stateAction;
	});

	hooks.push(hook as StateHook<unknown>);
	hookIndex += 1;

	return [hook.state, hook.dispatch];
}

export function useEffect(callback: EffectCallback, deps?: EffectDeps): void {
	useEffectHook(EffectKind.PASSIVE, callback, deps, "useEffect");
}

export function useLayoutEffect(callback: EffectCallback, deps?: EffectDeps): void {
	useEffectHook(EffectKind.LAYOUT, callback, deps, "useLayoutEffect");
}

export function useMemo<Value>(factory: () => Value, deps?: EffectDeps): Value {
	if (!currentlyRenderingFiber) {
		throw new Error("Render.useMemo must be called inside a function component.");
	}

	const hooks = currentlyRenderingFiber.hooks;
	if (!hooks) {
		throw new Error("Render hooks were not initialized.");
	}

	const oldHook = currentlyRenderingFiber.alternate?.hooks?.[hookIndex];
	const oldMemoHook = oldHook && isMemoHook(oldHook) ? oldHook : undefined;
	const canReuse = oldMemoHook !== undefined && !didDepsChange(oldMemoHook.deps, deps);
	const value = canReuse ? (oldMemoHook.value as Value) : factory();

	hooks.push({ kind: HookKind.MEMO, value, deps });
	hookIndex += 1;

	return value;
}

export function useCallback<Callback extends MemoCallback>(
	callback: Callback,
	deps?: EffectDeps,
): Callback {
	return useMemo(() => callback, deps);
}

function createDispatch<State>(fiber: Fiber, queue: StateAction<State>[]): Dispatch<State> {
	const root = getFiberRoot(fiber);
	if (!root) {
		throw new Error("Render.useState must be called inside a tree owned by a root.");
	}

	return (action) => {
		queue.push(action);
		markFiberDirty(queueOwners.get(queue as StateAction<unknown>[]) ?? null);

		if (currentlyRenderingFiber) {
			countReRenderOrThrow();
			didRequestRestart = restartRenderOrThrow(root);
			return;
		}

		scheduleUpdate(root);
	};
}

function scheduleUpdate(root: FiberRoot): void {
	countProfilerEvent("scheduledUpdateCalls");
	dirtyRoots.add(root);

	if (isUpdateScheduled) {
		return;
	}

	isUpdateScheduled = true;
	queueMicrotask(() => {
		isUpdateScheduled = false;
		countProfilerEvent("scheduledRenderCalls");

		const roots = [...dirtyRoots];
		dirtyRoots.clear();
		roots.forEach((dirtyRoot) => scheduleRenderOrThrow(dirtyRoot));
	});
}

function countReRenderOrThrow(): void {
	reRenderCount += 1;
	if (reRenderCount > RE_RENDER_LIMIT) {
		throw new Error(
			"Too many re-renders. Render limits the number of renders to prevent an infinite loop.",
		);
	}
}

function restartRenderOrThrow(root: FiberRoot): boolean {
	if (!restartRender) {
		throw new Error("Render is not initialized.");
	}

	return restartRender(root);
}

function scheduleRenderOrThrow(root: FiberRoot): void {
	if (!scheduleRender) {
		throw new Error("Render is not initialized.");
	}

	scheduleRender(root);
}

function useEffectHook(
	effectKind: EffectKind,
	callback: EffectCallback,
	deps: EffectDeps | undefined,
	hookName: string,
): void {
	if (!currentlyRenderingFiber) {
		throw new Error(`Render.${hookName} must be called inside a function component.`);
	}

	const hooks = currentlyRenderingFiber.hooks;
	if (!hooks) {
		throw new Error("Render hooks were not initialized.");
	}

	const oldHook = currentlyRenderingFiber.alternate?.hooks?.[hookIndex];
	const oldEffectHook = oldHook && isEffectHook(oldHook) ? oldHook : undefined;
	const shouldRun =
		!oldEffectHook ||
		oldEffectHook.effectKind !== effectKind ||
		didDepsChange(oldEffectHook.deps, deps);

	if (shouldRun) {
		currentlyRenderingFiber.flags |= getFlagForEffectKind(effectKind);
	}

	hooks.push({
		kind: HookKind.EFFECT,
		effectKind,
		callback,
		deps,
		cleanup: oldEffectHook?.cleanup,
		shouldRun,
	});
	hookIndex += 1;
}

function didDepsChange(
	prevDeps: EffectDeps | undefined,
	nextDeps: EffectDeps | undefined,
): boolean {
	if (!prevDeps || !nextDeps) {
		return true;
	}

	if (prevDeps.length !== nextDeps.length) {
		return true;
	}

	return nextDeps.some((dep, index) => !Object.is(dep, prevDeps[index]));
}

function isStateHook(hook: Hook): hook is StateHook<unknown> {
	return hook.kind === HookKind.STATE;
}

function isMemoHook(hook: Hook): hook is MemoHook {
	return hook.kind === HookKind.MEMO;
}

export function isEffectHook(hook: Hook): hook is EffectHook {
	return hook.kind === HookKind.EFFECT;
}
