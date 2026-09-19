import { EffectKind, type EffectHook } from "./types/hooks.ts";
import { LayoutMask, PassiveMask, type Fiber, type FiberFlags } from "./types/fiber.ts";
import { isEffectHook } from "./hooks.ts";
import { hasFiberWork } from "./flags.ts";

const pendingPassiveJobs: Array<() => void> = [];
let isPassiveFlushScheduled = false;
let isFlushingPassiveEffects = false;

export function collectLayoutEffects(fiber: Fiber | null): Array<() => void> {
	return collectEffects(fiber, EffectKind.LAYOUT, LayoutMask);
}

export function schedulePassiveEffects(fiber: Fiber | null): void {
	collectEffects(fiber, EffectKind.PASSIVE, PassiveMask).forEach(enqueuePassiveJob);
}

export function cleanupLayoutEffects(fiber: Fiber, includeSiblings: boolean): void {
	cleanupEffects(fiber, includeSiblings, EffectKind.LAYOUT);
}

export function schedulePassiveCleanup(fiber: Fiber, includeSiblings: boolean): void {
	enqueuePassiveJob(() => cleanupEffects(fiber, includeSiblings, EffectKind.PASSIVE));
}

export function flushPassiveEffects(): void {
	isPassiveFlushScheduled = false;

	if (isFlushingPassiveEffects) {
		return;
	}

	isFlushingPassiveEffects = true;

	try {
		while (pendingPassiveJobs.length > 0) {
			const job = pendingPassiveJobs.shift();
			job?.();
		}
	} finally {
		isFlushingPassiveEffects = false;
	}
}

function collectEffects(
	fiber: Fiber | null,
	effectKind: EffectKind,
	mask: FiberFlags,
): Array<() => void> {
	const effectJobs: Array<() => void> = [];

	traversePostOrder(fiber, true, mask, (nextFiber) => {
		nextFiber.hooks?.forEach((hook) => {
			if (isEffectHook(hook) && hook.effectKind === effectKind && hook.shouldRun) {
				effectJobs.push(() => runEffectHook(hook));
			}
		});
	});

	return effectJobs;
}

function runEffectHook(hook: EffectHook): void {
	try {
		hook.cleanup?.();
		hook.cleanup = undefined;

		const cleanup = hook.callback();
		if (cleanup && typeof cleanup !== "function") {
			console.warn(
				"Effect callback must return a cleanup function or undefined. Did you write an async effect?",
			);
		}

		hook.cleanup = typeof cleanup === "function" ? (cleanup as () => void) : undefined;
	} catch (error) {
		console.error(error);
	} finally {
		hook.shouldRun = false;
	}
}

function cleanupEffects(fiber: Fiber, includeSiblings: boolean, effectKind: EffectKind): void {
	traversePostOrder(fiber, includeSiblings, null, (nextFiber) => {
		nextFiber.hooks?.forEach((hook) => {
			if (isEffectHook(hook) && hook.effectKind === effectKind) {
				cleanupEffectHook(hook);
			}
		});
	});
}

function cleanupEffectHook(hook: EffectHook): void {
	if (!hook.cleanup) {
		return;
	}

	try {
		hook.cleanup();
	} catch (error) {
		console.error(error);
	} finally {
		hook.cleanup = undefined;
		hook.shouldRun = false;
	}
}

function enqueuePassiveJob(job: () => void): void {
	pendingPassiveJobs.push(job);
	schedulePassiveFlush();
}

function schedulePassiveFlush(): void {
	if (isPassiveFlushScheduled) {
		return;
	}

	isPassiveFlushScheduled = true;

	if (typeof requestAnimationFrame === "function") {
		requestAnimationFrame(() => setTimeout(flushPassiveEffects, 0));
		return;
	}

	setTimeout(flushPassiveEffects, 0);
}

function traversePostOrder(
	fiber: Fiber | null,
	includeSiblings: boolean,
	mask: FiberFlags | null,
	visit: (fiber: Fiber) => void,
): void {
	if (!fiber) {
		return;
	}

	const rootParent = includeSiblings ? null : fiber.parent;
	const stack: Array<{ fiber: Fiber; visited: boolean }> = [{ fiber, visited: false }];

	while (stack.length > 0) {
		const frame = stack.pop();
		if (!frame) {
			return;
		}

		if (frame.visited) {
			visit(frame.fiber);
			continue;
		}

		const canVisitSiblings = includeSiblings || frame.fiber.parent !== rootParent;
		const sibling = canVisitSiblings ? firstEnterableFiber(frame.fiber.sibling, mask) : null;

		if (sibling) {
			stack.push({ fiber: sibling, visited: false });
		}

		stack.push({ fiber: frame.fiber, visited: true });

		const child = firstEnterableFiber(frame.fiber.child, mask);
		if (child) {
			stack.push({ fiber: child, visited: false });
		}
	}
}

function firstEnterableFiber(fiber: Fiber | null, mask: FiberFlags | null): Fiber | null {
	let current = fiber;

	while (current && !shouldEnterFiber(current, mask)) {
		current = current.sibling;
	}

	return current;
}

function shouldEnterFiber(fiber: Fiber, mask: FiberFlags | null): boolean {
	return !mask || hasFiberWork(fiber, mask);
}
