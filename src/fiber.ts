import {
	FiberFlags,
	FiberTag,
	type Fiber,
	type FunctionComponentFiber,
	type MemoComponentFiber,
} from "./types/fiber.ts";
import { createDom } from "./patch-dom.ts";
import { reconcileChildren } from "./reconcile.ts";
import { queueDeletion } from "./renderer-state.ts";
import {
	adoptHookQueueOwners,
	finishHooks,
	hasRequestedRestart,
	prepareToUseHooks,
} from "./hooks.ts";
import { createWorkInProgressFiber } from "./fiber-pair.ts";
import { bubbleSubtreeFlags } from "./flags.ts";
import { shallowEqual } from "./memo.ts";
import { countProfilerEvent } from "./profiler.ts";

export function performUnitOfWork(fiber: Fiber): Fiber | null {
	countProfilerEvent("unitsOfWork");

	if (isFunctionComponentFiber(fiber)) {
		updateFunctionComponent(fiber);
	} else if (isMemoComponentFiber(fiber)) {
		updateMemoComponent(fiber);
	} else if (fiber.tag === FiberTag.FRAGMENT) {
		updateFragmentComponent(fiber);
	} else {
		updateHostComponent(fiber);
	}

	if (fiber.didBailout && !fiber.hasDirtySubtree) {
		return completeUnitOfWork(fiber);
	}

	if (fiber.child) {
		return fiber.child;
	}

	return completeUnitOfWork(fiber);
}

function completeUnitOfWork(fiber: Fiber): Fiber | null {
	let nextFiber: Fiber | null = fiber;
	while (nextFiber) {
		completeWork(nextFiber);

		if (nextFiber.sibling) {
			return nextFiber.sibling;
		}

		nextFiber = nextFiber.parent;
	}

	return null;
}

function completeWork(fiber: Fiber): void {
	createInstance(fiber);
	markUpdate(fiber);
	bubbleSubtreeFlags(fiber);
}

function createInstance(fiber: Fiber): void {
	if (fiber.tag !== FiberTag.HOST && fiber.tag !== FiberTag.TEXT) {
		return;
	}

	if (fiber.dom) {
		return;
	}

	fiber.dom = createDom(fiber);
	appendAllChildren(fiber.dom, fiber);
}

function appendAllChildren(parent: Node, fiber: Fiber): void {
	let node = fiber.child;

	while (node) {
		if (node.dom) {
			parent.appendChild(node.dom);
		} else if (node.child) {
			node = node.child;
			continue;
		}

		while (!node.sibling) {
			if (!node.parent || node.parent === fiber) {
				return;
			}

			node = node.parent;
		}

		node = node.sibling;
	}
}

function markUpdate(fiber: Fiber): void {
	const current = fiber.alternate;
	if (!current) {
		return;
	}

	if (fiber.tag === FiberTag.HOST) {
		if (current.props !== fiber.props) {
			fiber.flags |= FiberFlags.UPDATE;
		}

		return;
	}

	if (fiber.tag === FiberTag.TEXT && getNodeValue(current) !== getNodeValue(fiber)) {
		fiber.flags |= FiberFlags.UPDATE;
	}
}

function getNodeValue(fiber: Fiber): unknown {
	return (fiber.props as { nodeValue?: unknown }).nodeValue;
}

function isFunctionComponentFiber(fiber: Fiber): fiber is FunctionComponentFiber {
	return fiber.tag === FiberTag.FUNCTION_COMPONENT;
}

function updateFunctionComponent(fiber: FunctionComponentFiber): void {
	if (canBailoutFunctionComponent(fiber)) {
		fiber.didBailout = true;
		adoptHookQueueOwners(fiber);
		cloneChildFibers(fiber, !fiber.hasDirtySubtree);
		return;
	}

	prepareToUseHooks(fiber);
	let child: ReturnType<FunctionComponentFiber["type"]>;
	try {
		countProfilerEvent("componentRenders");
		child = fiber.type(fiber.props);
	} finally {
		finishHooks();
	}

	if (hasRequestedRestart()) {
		return;
	}

	reconcileChildren(fiber, child == null ? [] : [child], queueDeletion);
}

function canBailoutFunctionComponent(fiber: FunctionComponentFiber): boolean {
	return Boolean(fiber.alternate && !fiber.dirty && fiber.props === fiber.alternate.props);
}

function isMemoComponentFiber(fiber: Fiber): fiber is MemoComponentFiber {
	return fiber.tag === FiberTag.MEMO_COMPONENT;
}

function updateMemoComponent(fiber: MemoComponentFiber): void {
	if (canBailoutMemoComponent(fiber)) {
		fiber.didBailout = true;
		fiber.props = fiber.alternate.props;
		adoptHookQueueOwners(fiber);
		cloneChildFibers(fiber, !fiber.hasDirtySubtree);
		return;
	}

	prepareToUseHooks(fiber);
	let child: ReturnType<MemoComponentFiber["type"]["type"]>;
	try {
		countProfilerEvent("componentRenders");
		child = fiber.type.type(fiber.props);
	} finally {
		finishHooks();
	}

	if (hasRequestedRestart()) {
		return;
	}

	reconcileChildren(fiber, child == null ? [] : [child], queueDeletion);
}

function canBailoutMemoComponent(
	fiber: MemoComponentFiber,
): fiber is MemoComponentFiber & { alternate: Fiber } {
	const alternate = fiber.alternate;
	if (!alternate || fiber.dirty) {
		return false;
	}

	if (alternate.props === fiber.props) {
		return true;
	}

	const compare = fiber.type.compare ?? shallowEqual;
	return compare(alternate.props, fiber.props);
}

function cloneChildFibers(parent: Fiber, deep: boolean): void {
	const currentFirstChild = parent.alternate?.child ?? null;
	let oldChild = currentFirstChild;
	let previousClone: Fiber | null = null;

	while (oldChild) {
		const clonedChild = createWorkInProgressFiber(oldChild, oldChild, parent, oldChild.index);
		adoptHookQueueOwners(clonedChild);

		if (!parent.child) {
			parent.child = clonedChild;
		} else if (previousClone) {
			previousClone.sibling = clonedChild;
		}

		if (deep) {
			cloneChildFibers(clonedChild, true);
		}

		previousClone = clonedChild;
		oldChild = oldChild.sibling;
	}
}

function updateFragmentComponent(fiber: Fiber): void {
	reconcileChildren(fiber, fiber.props.children, queueDeletion);
}

function updateHostComponent(fiber: Fiber): void {
	reconcileChildren(fiber, fiber.props.children, queueDeletion);
}
