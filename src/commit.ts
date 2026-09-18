import { FiberFlags, MutationMask, type Fiber } from "./types/fiber.ts";
import { cleanupDom, updateDom } from "./patch-dom.ts";
import { resetReRenderCount } from "./hooks.ts";
import {
	collectLayoutEffects,
	cleanupLayoutEffects,
	flushPassiveEffects,
	schedulePassiveCleanup,
	schedulePassiveEffects,
} from "./effects.ts";
import { hasFiberWork, hasFlags } from "./flags.ts";
import { countProfilerEvent } from "./profiler.ts";

type CommitRootOptions = {
	root: Fiber;
	onCommitted: (root: Fiber) => void;
};

export function commitRoot({ root, onCommitted }: CommitRootOptions): void {
	if (root.alternate === null) {
		clearContainer(root.dom);
	}

	if (hasFlags(root.flags, FiberFlags.CHILD_DELETION)) {
		commitChildDeletions(root);
	}
	if (root.child) {
		commitWork(root.child);
	}

	const layoutEffects = collectLayoutEffects(root.child);
	schedulePassiveEffects(root.child);
	onCommitted(root);
	resetReRenderCount();
	layoutEffects.forEach((runLayoutEffect) => runLayoutEffect());
}

export function commitRootUnmount(rootFiber: Fiber): void {
	flushPassiveEffects();

	const parentDom = getParentDom(rootFiber);
	if (!parentDom) {
		return;
	}

	let child = rootFiber.child;
	while (child) {
		const nextChild = child.sibling;
		cleanupLayoutEffects(child, false);
		schedulePassiveCleanup(child, false);
		commitDeletion(child, parentDom);
		child = nextChild;
	}
}

function clearContainer(container: Node | null): void {
	if (!container) {
		return;
	}

	while (container.firstChild) {
		container.removeChild(container.firstChild);
	}
}

function commitWork(fiber: Fiber | null): void {
	const stack: Fiber[] = [];
	if (fiber) {
		stack.push(fiber);
	}

	while (stack.length > 0) {
		const current = stack.pop() as Fiber;
		countProfilerEvent("commitVisits");

		if (!hasFiberWork(current, MutationMask)) {
			if (current.sibling) {
				stack.push(current.sibling);
			}
			continue;
		}

		if (hasFlags(current.flags, FiberFlags.CHILD_DELETION)) {
			commitChildDeletions(current);
		}

		if (hasFlags(current.flags, FiberFlags.PLACEMENT)) {
			insertOrAppendPlacementNode(current, getHostSibling(current), getHostParentDom(current));
		} else if (
			hasFlags(current.flags, FiberFlags.MOVE) &&
			current.dom !== null &&
			current.alternate
		) {
			updateDom(current.dom, current.alternate.props, current.props);
			getHostParentDom(current).insertBefore(current.dom, getHostSibling(current));
		} else if (hasFlags(current.flags, FiberFlags.MOVE) && current.dom === null) {
			commitMove(current, getHostParentDom(current));
		} else if (
			hasFlags(current.flags, FiberFlags.UPDATE) &&
			current.dom !== null &&
			current.alternate
		) {
			updateDom(current.dom, current.alternate.props, current.props);
		}

		if (current.sibling) {
			stack.push(current.sibling);
		}
		if (current.child) {
			stack.push(current.child);
		}
	}
}

function insertOrAppendPlacementNode(fiber: Fiber, before: Node | null, parentDom: Node): void {
	if (fiber.dom) {
		parentDom.insertBefore(fiber.dom, before);
		return;
	}

	let child = fiber.child;
	while (child) {
		insertOrAppendPlacementNode(child, before, parentDom);
		child = child.sibling;
	}
}

function getHostParentDom(fiber: Fiber): Node {
	const parentDom = getParentDom(fiber.parent);
	if (!parentDom) {
		throw new Error("Expected to find a host parent.");
	}

	return parentDom;
}

function getParentDom(fiber: Fiber | null): Node | null {
	let parentFiber = fiber;

	while (parentFiber) {
		if (parentFiber.dom) {
			return parentFiber.dom;
		}

		parentFiber = parentFiber.parent;
	}

	return null;
}

function getHostSibling(fiber: Fiber): Node | null {
	const hostParentFiber = getHostParentFiber(fiber.parent);
	let nextFiber = getNextFiberSibling(fiber, hostParentFiber);

	while (nextFiber) {
		const isRelocating = hasFlags(nextFiber.flags, FiberFlags.PLACEMENT | FiberFlags.MOVE);

		if (nextFiber.dom && !isRelocating) {
			return nextFiber.dom;
		}

		if (nextFiber.dom || isRelocating) {
			nextFiber = getNextFiberSibling(nextFiber, hostParentFiber);
			continue;
		}

		if (nextFiber.child) {
			nextFiber = nextFiber.child;
			continue;
		}

		nextFiber = getNextFiberSibling(nextFiber, hostParentFiber);
	}

	return null;
}

function getHostParentFiber(fiber: Fiber | null): Fiber | null {
	let parentFiber = fiber;

	while (parentFiber && !parentFiber.dom) {
		parentFiber = parentFiber.parent;
	}

	return parentFiber;
}

function getNextFiberSibling(fiber: Fiber, stopFiber: Fiber | null): Fiber | null {
	let nextFiber: Fiber | null = fiber;

	while (nextFiber && !nextFiber.sibling) {
		nextFiber = nextFiber.parent;
		if (nextFiber === stopFiber) {
			return null;
		}
	}

	return nextFiber?.sibling ?? null;
}

function commitMove(fiber: Fiber, domParent: Node): void {
	commitMoveChildren(fiber.child, domParent, getHostSibling(fiber));
}

function commitMoveChildren(fiber: Fiber | null, domParent: Node, before: Node | null): void {
	let current = fiber;

	while (current) {
		if (current.dom) {
			domParent.insertBefore(current.dom, before);
			markMovedFiberAsUpdated(current);
		} else {
			commitMoveChildren(current.child, domParent, before);
			markMovedFiberAsUpdated(current);
		}

		current = current.sibling;
	}
}

function markMovedFiberAsUpdated(fiber: Fiber): void {
	fiber.flags = (fiber.flags & ~(FiberFlags.PLACEMENT | FiberFlags.MOVE)) | FiberFlags.UPDATE;
}

function commitChildDeletions(parent: Fiber): void {
	if (!parent.deletions) {
		return;
	}

	const parentDom = getParentDom(parent);
	if (!parentDom) {
		return;
	}

	parent.deletions.forEach((fiber) => {
		cleanupLayoutEffects(fiber, false);
		schedulePassiveCleanup(fiber, false);
		commitDeletion(fiber, parentDom);
	});
}

function commitDeletion(fiber: Fiber, domParent: Node): void {
	if (fiber.dom) {
		cleanupDomTree(fiber);
		domParent.removeChild(fiber.dom);
		return;
	}

	if (fiber.child) {
		commitDeletionChildren(fiber.child, domParent);
	}
}

function commitDeletionChildren(fiber: Fiber | null, domParent: Node): void {
	let current = fiber;

	while (current) {
		commitDeletion(current, domParent);
		current = current.sibling;
	}
}

function cleanupDomTree(fiber: Fiber): void {
	if (fiber.dom) {
		cleanupDom(fiber.dom, fiber.props);
	}

	cleanupDomTreeChildren(fiber.child);
}

function cleanupDomTreeChildren(fiber: Fiber | null): void {
	let current = fiber;

	while (current) {
		cleanupDomTree(current);
		current = current.sibling;
	}
}
