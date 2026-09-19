import { REACT_ROOT_TYPE } from "./symbols.ts";
import type { ReactElement } from "./types/element.ts";
import { FiberFlags, FiberTag, type Fiber, type FiberRoot } from "./types/fiber.ts";
import { HookKind } from "./types/hooks.ts";

export type PendingCommit = {
	root: Fiber;
};

export function createFiberRoot(container: Element): FiberRoot {
	return {
		container,
		currentRoot: null,
		wipRoot: null,
		nextUnitOfWork: null,
		isUnmounted: false,
	};
}

export function createRenderRoot(root: FiberRoot, element: ReactElement): Fiber {
	const rootFiber: Fiber = root.currentRoot?.alternate ?? {
		tag: FiberTag.ROOT,
		type: REACT_ROOT_TYPE,
		key: null,
		props: {
			children: [element],
		},
		dom: root.container,
		index: 0,
		parent: null,
		child: null,
		sibling: null,
		alternate: root.currentRoot,
		deletions: null,
		flags: FiberFlags.NO_FLAGS,
		subtreeFlags: FiberFlags.NO_FLAGS,
		dirty: true,
		hasDirtySubtree: false,
	};

	rootFiber.tag = FiberTag.ROOT;
	rootFiber.type = REACT_ROOT_TYPE;
	rootFiber.key = null;
	rootFiber.props = {
		children: [element],
	};
	rootFiber.dom = root.container;
	rootFiber.index = 0;
	rootFiber.parent = null;
	rootFiber.child = null;
	rootFiber.sibling = null;
	rootFiber.alternate = root.currentRoot;
	rootFiber.root = root;
	rootFiber.deletions = null;
	rootFiber.flags = FiberFlags.NO_FLAGS;
	rootFiber.subtreeFlags = FiberFlags.NO_FLAGS;
	rootFiber.dirty = true;
	rootFiber.hasDirtySubtree = root.currentRoot?.hasDirtySubtree ?? false;
	delete rootFiber.didBailout;

	if (root.currentRoot) {
		root.currentRoot.alternate = rootFiber;
	}

	root.wipRoot = rootFiber;
	root.nextUnitOfWork = rootFiber;

	return rootFiber;
}

export function createUpdateRoot(root: FiberRoot): Fiber | null {
	if (root.isUnmounted || !root.currentRoot) {
		return null;
	}

	const pendingRoot = root.wipRoot ?? root.currentRoot;

	const element = pendingRoot.props.children[0];
	if (!element) {
		return null;
	}

	return createRenderRoot(root, element);
}

export function markFiberDirty(fiber: Fiber | null): void {
	if (!fiber) {
		return;
	}

	fiber.dirty = true;
	if (fiber.alternate) {
		fiber.alternate.dirty = true;
	}

	let parent = fiber.parent;
	while (parent && !parent.hasDirtySubtree) {
		parent.hasDirtySubtree = true;
		if (parent.alternate) {
			parent.alternate.hasDirtySubtree = true;
		}
		parent = parent.parent;
	}
}

export function queueDeletion(parent: Fiber, fiber: Fiber): void {
	if (!parent.deletions) {
		parent.deletions = [];
	}
	parent.deletions.push(fiber);
	parent.flags |= FiberFlags.CHILD_DELETION;
}

export function getPendingCommit(root: FiberRoot): PendingCommit | null {
	if (!root.wipRoot) {
		return null;
	}

	return {
		root: root.wipRoot,
	};
}

export function commitRoot(root: FiberRoot, rootFiber: Fiber): void {
	finalizeCommittedTree(rootFiber);
	root.currentRoot = rootFiber;
	root.wipRoot = null;
}

export function getFiberRoot(fiber: Fiber): FiberRoot | null {
	let currentFiber: Fiber | null = fiber;

	while (currentFiber) {
		if (currentFiber.root) {
			return currentFiber.root;
		}

		currentFiber = currentFiber.parent;
	}

	return null;
}

export function resetFiberRoot(root: FiberRoot): void {
	root.currentRoot = null;
	root.wipRoot = null;
	root.nextUnitOfWork = null;
	root.isUnmounted = true;
}

function dropAppliedActions(fiber: Fiber): void {
	fiber.hooks?.forEach((hook) => {
		if (hook.kind !== HookKind.STATE) {
			return;
		}

		hook.queue.length = 0;
	});
}

function finalizeCommittedTree(fiber: Fiber | null): void {
	const stack: Fiber[] = [];
	if (fiber) {
		stack.push(fiber);
	}

	while (stack.length > 0) {
		const current = stack.pop() as Fiber;

		const alternate = current.alternate;
		if (alternate) {
			alternate.alternate = current;
			alternate.parent = current.parent?.alternate ?? null;
			alternate.child = current.child?.alternate ?? null;
			alternate.sibling = current.sibling?.alternate ?? null;
			alternate.deletions = null;
			alternate.flags = FiberFlags.NO_FLAGS;
			alternate.subtreeFlags = FiberFlags.NO_FLAGS;
			alternate.dirty = false;
			alternate.hasDirtySubtree = false;
			delete alternate.didBailout;
		}

		current.deletions = null;
		current.flags = FiberFlags.NO_FLAGS;
		current.subtreeFlags = FiberFlags.NO_FLAGS;
		current.dirty = false;
		current.hasDirtySubtree = false;
		delete current.didBailout;
		dropAppliedActions(current);

		if (current.sibling) {
			stack.push(current.sibling);
		}

		if (current.child) {
			stack.push(current.child);
		}
	}
}
